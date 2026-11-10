import { mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { findPod, readRemoteFile } from "./kubectl.ts";
import type { Config, Runner, Snapshot, TableCount, Target } from "./types.ts";
import { judge, toPrune, verifySqlite, type VerifyResult } from "./verify.ts";

export interface BackupIO {
  run: Runner;
  write: (path: string, bytes: Uint8Array) => Promise<void>;
  verify: (file: string, tables: string[]) => VerifyResult;
  listDirs: (dir: string) => string[];
  remove: (dir: string) => void;
  sizeOf: (file: string) => number;
  log?: (msg: string) => void;
  now?: () => Date;
}

/** Nome de diretório ordenável por data — a poda depende dessa ordem. */
export function stampFor(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

export const realIO = (run: Runner): BackupIO => ({
  run,
  write: async (path, bytes) => {
    await Bun.write(path, bytes);
  },
  verify: (file, tables) => verifySqlite(file, tables),
  listDirs: (dir) => {
    try {
      return readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
    } catch {
      return [];
    }
  },
  remove: (dir) => rmSync(dir, { recursive: true, force: true }),
  sizeOf: (file) => {
    try {
      return statSync(file).size;
    } catch {
      return 0;
    }
  },
});

/** Contagens do snapshot anterior, para comparar. */
export function previousTables(
  io: BackupIO,
  targetDir: string,
): TableCount[] | null {
  const dirs = io.listDirs(targetDir).sort();
  const last = dirs.at(-1);
  if (!last) return null;
  try {
    const raw = readFileSync(join(targetDir, last, "manifest.json"), "utf8");
    return (JSON.parse(raw) as Snapshot).tables ?? null;
  } catch {
    return null;
  }
}

/**
 * Copia o SQLite de dentro do pod e prova que a cópia abre.
 *
 * Leva `.db`, `-wal` e `-shm` juntos: com WAL ligado (padrão dos agentes), o
 * `.db` sozinho pode estar desatualizado — o SQLite recupera ao abrir o trio.
 */
export async function backupTarget(
  target: Target,
  config: Config,
  io: BackupIO,
  previous: TableCount[] | null,
): Promise<Snapshot> {
  const now = io.now ?? (() => new Date());
  const log = io.log ?? (() => {});
  const startedAt = now();
  const stamp = stampFor(startedAt);
  const dir = join(config.backupDir, target.name, stamp);
  const base: Snapshot = {
    target: target.name,
    takenAt: startedAt.toISOString(),
    pod: "",
    dir,
    bytes: 0,
    integrity: "não verificado",
    tables: [],
    verdict: "falhou",
    deltas: [],
    error: null,
    durationMs: 0,
  };

  try {
    const pod = await findPod(io.run, config.kubeContext, target.namespace, target.selector);
    base.pod = pod;
    mkdirSync(dir, { recursive: true });

    const fileName = basename(target.path);
    let bytes = 0;
    for (const suffix of ["", "-wal", "-shm"]) {
      const remote = `${target.path}${suffix}`;
      const content = await readRemoteFile(
        io.run,
        config.kubeContext,
        target.namespace,
        pod,
        target.container,
        remote,
      );
      // Sem WAL ativo o -wal/-shm não existem: ausência é normal, só o .db é obrigatório.
      if (!content) {
        if (suffix === "") throw new Error(`${target.path} não existe ou está vazio em ${pod}`);
        continue;
      }
      await io.write(join(dir, `${fileName}${suffix}`), content);
      bytes += content.length;
    }
    base.bytes = bytes;

    const result = io.verify(join(dir, fileName), target.tables ?? []);
    const { verdict, deltas } = judge(result, previous);
    log(
      `  ${target.name}: ${verdict} · ${(bytes / 1024).toFixed(0)} KB · ${result.tables
        .map((t) => `${t.table}=${t.rows}`)
        .join(" ")}`,
    );

    return {
      ...base,
      integrity: result.integrity,
      tables: result.tables,
      verdict,
      deltas,
      error: result.error,
      durationMs: Math.round(now().getTime() - startedAt.getTime()),
    };
  } catch (err) {
    const message = (err as Error).message;
    log(`  ${target.name}: FALHOU — ${message}`);
    return {
      ...base,
      error: message,
      durationMs: Math.round(now().getTime() - startedAt.getTime()),
    };
  }
}

/** Remove snapshots além do limite de retenção deste alvo. */
export function prune(target: Target, config: Config, io: BackupIO): string[] {
  const targetDir = join(config.backupDir, target.name);
  const keep = target.keep ?? config.keep;
  const doomed = toPrune(io.listDirs(targetDir), keep);
  for (const dir of doomed) io.remove(join(targetDir, dir));
  return doomed;
}
