import { Database } from "bun:sqlite";
import type { TableCount, Verdict } from "./types.ts";

export interface VerifyResult {
  integrity: string;
  tables: TableCount[];
  error: string | null;
}

/**
 * Abre a cópia e prova que ela é um banco: integrity_check e contagem por tabela.
 * Backup que nunca foi aberto não é backup — é um arquivo com esperança dentro.
 */
export function verifySqlite(file: string, only: string[] = []): VerifyResult {
  let db: Database | null = null;
  try {
    db = new Database(file, { readonly: true });
    const check = db
      .query<{ integrity_check: string }, []>("PRAGMA integrity_check")
      .get();
    const integrity = check?.integrity_check ?? "sem resposta";

    const names = db
      .query<{ name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all()
      .map((r) => r.name)
      .filter((name) => (only.length ? only.includes(name) : true));

    const tables: TableCount[] = names.map((name) => {
      // O nome vem do sqlite_master, não do usuário; aspas duplas bastam.
      const row = db?.query<{ n: number }, []>(`SELECT COUNT(*) AS n FROM "${name}"`).get();
      return { table: name, rows: row?.n ?? 0 };
    });

    return { integrity, tables, error: null };
  } catch (err) {
    return { integrity: "não abriu", tables: [], error: (err as Error).message };
  } finally {
    db?.close();
  }
}

export interface Judgement {
  verdict: Verdict;
  deltas: { table: string; before: number; after: number }[];
}

/**
 * Decide se o snapshot presta, comparando com o anterior.
 * Pura: é aqui que mora a regra, e é isto que os testes cobrem.
 */
export function judge(
  result: VerifyResult,
  previous: TableCount[] | null,
): Judgement {
  const deltas: Judgement["deltas"] = [];
  const before = new Map((previous ?? []).map((t) => [t.table, t.rows]));

  for (const t of result.tables) {
    const was = before.get(t.table);
    if (was !== undefined && was !== t.rows) {
      deltas.push({ table: t.table, before: was, after: t.rows });
    }
  }

  if (result.error) return { verdict: "falhou", deltas };
  if (result.integrity !== "ok") return { verdict: "corrompido", deltas };
  if (!result.tables.length) return { verdict: "vazio", deltas };
  if (result.tables.every((t) => t.rows === 0)) return { verdict: "vazio", deltas };

  // Encolher não prova corrupção, mas em base append-only é sinal de que algo
  // apagou dados — e é justamente quando você quer o backup anterior intacto.
  const shrank = deltas.some((d) => d.after < d.before);
  if (shrank) return { verdict: "encolheu", deltas };

  return { verdict: "ok", deltas };
}

/** Snapshots antigos que devem sair, preservando os `keep` mais recentes. */
export function toPrune(dirs: string[], keep: number): string[] {
  return [...dirs].sort().reverse().slice(Math.max(0, keep));
}
