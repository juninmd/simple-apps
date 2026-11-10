import type { Config } from "./types.ts";

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
    baseUrl: (env.LLM_BASE_URL ?? "http://localhost:4000/v1").replace(/\/+$/, ""),
    apiKey: env.LLM_API_KEY ?? "",
    models: list(env.LLM_MODELS),
    skipModels: list(env.LLM_SKIP_MODELS),
    repeats: num(env.LLM_REPEATS, 2),
    concurrency: num(env.LLM_CONCURRENCY, 2),
    timeoutMs: num(env.LLM_TIMEOUT_MS, 60_000),
    maxTokens: num(env.LLM_MAX_TOKENS, 200),
    dbPath: env.DB_PATH ?? "./data/bench.db",
    telegramToken: env.TELEGRAM_BOT_TOKEN ?? "",
    telegramChatIds: list(env.TELEGRAM_CHAT_IDS ?? env.TELEGRAM_CHAT_ID),
  };
  return { ...base, ...overrides };
}

/** Aplica a allowlist/denylist de modelos, preservando a ordem do gateway. */
export function selectModels(available: string[], config: Config): string[] {
  const wanted = config.models.length ? config.models : available;
  return wanted.filter((m) => !config.skipModels.includes(m));
}
