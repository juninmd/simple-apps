import type { Config, Target } from "./types.ts";

const num = (v: string | undefined, d: number) => {
  const n = v === undefined || v === "" ? Number.NaN : Number(v);
  return Number.isFinite(n) ? n : d;
};

const list = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function loadConfig(
  overrides: Partial<Config> = {},
  env: Record<string, string | undefined> = process.env,
): Config {
  const base: Config = {
    targetsFile: env.TARGETS_FILE ?? "./targets.json",
    backupDir: env.BACKUP_DIR ?? "./data/backups",
    keep: num(env.KEEP, 7),
    kubeContext: env.KUBE_CONTEXT ?? "",
    telegramToken: env.TELEGRAM_BOT_TOKEN ?? "",
    telegramChatIds: list(env.TELEGRAM_CHAT_IDS ?? env.TELEGRAM_CHAT_ID),
    strict: env.STRICT === "1",
  };
  return { ...base, ...overrides };
}

const SAFE_NAME = /^[a-z0-9][a-z0-9._-]*$/i;

/**
 * Valida os alvos. O `name` vira caminho em disco e o `path` entra num comando
 * remoto: os dois passam por checagem antes de qualquer coisa executar.
 */
export function parseTargets(raw: unknown): Target[] {
  if (!Array.isArray(raw)) throw new Error("targets.json deve ser um array");
  const seen = new Set<string>();
  return raw.map((entry, i) => {
    const t = entry as Partial<Target>;
    const at = `targets[${i}]`;
    if (!t.name || !SAFE_NAME.test(t.name)) {
      throw new Error(`${at}: "name" ausente ou com caractere inválido`);
    }
    if (seen.has(t.name)) throw new Error(`${at}: nome duplicado "${t.name}"`);
    seen.add(t.name);
    if (!t.namespace) throw new Error(`${at} (${t.name}): "namespace" é obrigatório`);
    if (!t.selector) throw new Error(`${at} (${t.name}): "selector" é obrigatório`);
    if (!t.path || !t.path.startsWith("/")) {
      throw new Error(`${at} (${t.name}): "path" deve ser absoluto dentro do container`);
    }
    // O path vai para um `sh -c` remoto: aspas e cifrão viram injeção de comando.
    if (/["'`$\\\s]/.test(t.path)) {
      throw new Error(`${at} (${t.name}): "path" não pode ter espaço, aspas, $ ou barra invertida`);
    }
    return {
      name: t.name,
      namespace: t.namespace,
      selector: t.selector,
      container: t.container,
      path: t.path,
      tables: t.tables ?? [],
      keep: t.keep,
    };
  });
}

export async function loadTargets(file: string): Promise<Target[]> {
  return parseTargets(JSON.parse(await Bun.file(file).text()));
}
