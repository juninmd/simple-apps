import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { judge, toPrune, verifySqlite } from "../src/verify.ts";
import type { TableCount } from "../src/types.ts";

const tmp = () => mkdtempSync(join(tmpdir(), "backup-sentinel-"));

/** Cria um SQLite de verdade: o teste da verificação não pode ser simulado. */
function makeDb(rows: number, extraTable = false): string {
  const dir = tmp();
  const file = join(dir, "store.db");
  const db = new Database(file, { create: true });
  db.exec("CREATE TABLE items (id INTEGER PRIMARY KEY, title TEXT)");
  if (extraTable) db.exec("CREATE TABLE outra (id INTEGER PRIMARY KEY)");
  const insert = db.prepare("INSERT INTO items (title) VALUES (?)");
  for (let i = 0; i < rows; i++) insert.run(`item ${i}`);
  db.close();
  return file;
}

describe("verifySqlite", () => {
  test("banco íntegro passa e conta as linhas", () => {
    const result = verifySqlite(makeDb(3));
    expect(result.integrity).toBe("ok");
    expect(result.tables).toEqual([{ table: "items", rows: 3 }]);
    expect(result.error).toBeNull();
  });

  test("banco vazio abre e devolve zero linhas", () => {
    expect(verifySqlite(makeDb(0)).tables).toEqual([{ table: "items", rows: 0 }]);
  });

  test("filtra pelas tabelas pedidas", () => {
    const result = verifySqlite(makeDb(2, true), ["items"]);
    expect(result.tables.map((t) => t.table)).toEqual(["items"]);
  });

  test("arquivo que não é SQLite falha em vez de passar batido", () => {
    const dir = tmp();
    const file = join(dir, "store.db");
    writeFileSync(file, "isto não é um banco de dados");
    const result = verifySqlite(file);
    expect(result.error ?? result.integrity).not.toBe("ok");
  });

  test("arquivo inexistente não explode o processo", () => {
    const result = verifySqlite(join(tmp(), "nao-existe.db"));
    expect(result.error).toBeTruthy();
    expect(result.tables).toEqual([]);
  });

  test("arquivo truncado no meio é reprovado", () => {
    const original = makeDb(50);
    const bytes = new Uint8Array(require("node:fs").readFileSync(original));
    const dir = tmp();
    const file = join(dir, "store.db");
    // Metade do arquivo: cabeçalho válido, conteúdo faltando.
    writeFileSync(file, bytes.slice(0, Math.floor(bytes.length / 2)));
    const result = verifySqlite(file);
    expect(result.integrity === "ok" && !result.error).toBe(false);
  });
});

describe("judge", () => {
  const ok = (tables: TableCount[]) => ({ integrity: "ok", tables, error: null });

  test("banco íntegro com linhas é ok", () => {
    expect(judge(ok([{ table: "items", rows: 10 }]), null).verdict).toBe("ok");
  });

  test("sem tabela nenhuma é vazio", () => {
    expect(judge(ok([]), null).verdict).toBe("vazio");
  });

  test("tabelas todas zeradas é vazio — provavelmente o volume errado", () => {
    expect(judge(ok([{ table: "items", rows: 0 }]), null).verdict).toBe("vazio");
  });

  test("integridade reprovada é corrompido", () => {
    expect(
      judge({ integrity: "row 3 missing from index", tables: [], error: null }, null).verdict,
    ).toBe("corrompido");
  });

  test("erro de abertura é falha", () => {
    expect(judge({ integrity: "não abriu", tables: [], error: "file is encrypted" }, null).verdict).toBe(
      "falhou",
    );
  });

  test("crescimento normal é ok e vira delta", () => {
    const j = judge(ok([{ table: "items", rows: 120 }]), [{ table: "items", rows: 100 }]);
    expect(j.verdict).toBe("ok");
    expect(j.deltas).toEqual([{ table: "items", before: 100, after: 120 }]);
  });

  test("tabela que encolheu é sinalizada", () => {
    const j = judge(ok([{ table: "items", rows: 40 }]), [{ table: "items", rows: 100 }]);
    expect(j.verdict).toBe("encolheu");
    expect(j.deltas[0]).toEqual({ table: "items", before: 100, after: 40 });
  });

  test("tabela nova não conta como delta", () => {
    const j = judge(
      ok([
        { table: "items", rows: 10 },
        { table: "nova", rows: 5 },
      ]),
      [{ table: "items", rows: 10 }],
    );
    expect(j.deltas).toEqual([]);
    expect(j.verdict).toBe("ok");
  });

  test("mesmo número de linhas não gera delta", () => {
    expect(judge(ok([{ table: "items", rows: 10 }]), [{ table: "items", rows: 10 }]).deltas).toEqual(
      [],
    );
  });

  test("corrupção vence encolhimento na ordem do veredito", () => {
    const j = judge({ integrity: "malformed", tables: [{ table: "items", rows: 1 }], error: null }, [
      { table: "items", rows: 100 },
    ]);
    expect(j.verdict).toBe("corrompido");
  });
});

describe("retenção", () => {
  const dirs = [
    "2026-08-01T00-00-00-000Z",
    "2026-08-02T00-00-00-000Z",
    "2026-08-03T00-00-00-000Z",
    "2026-08-04T00-00-00-000Z",
  ];

  test("mantém os mais recentes", () => {
    expect(toPrune(dirs, 2)).toEqual(["2026-08-02T00-00-00-000Z", "2026-08-01T00-00-00-000Z"]);
  });

  test("nada a podar quando cabe tudo", () => {
    expect(toPrune(dirs, 10)).toEqual([]);
  });

  test("keep 0 poda tudo", () => {
    expect(toPrune(dirs, 0)).toHaveLength(4);
  });
});
