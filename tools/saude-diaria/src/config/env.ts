// Bun carrega .env automaticamente — sem dotenv.
const num = (v: string | undefined, d: number) => (v ? Number(v) : d);

export const env = {
  aiProvider: (process.env.AI_PROVIDER ?? "ollama") as
    | "ollama"
    | "openai"
    | "anthropic"
    | "google",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
  ollamaModel: process.env.OLLAMA_MODEL ?? "llama3.2",
  openaiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
  geminiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",

  telegramToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatIds: (process.env.TELEGRAM_CHAT_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  cronIngestion: process.env.CRON_INGESTION ?? "*/30 * * * *",
  cronDigest: process.env.CRON_DIGEST ?? "0 11 * * *",

  dbPath: process.env.DB_PATH ?? "./data/store.db",
  maxItemsPerFeed: num(process.env.MAX_ITEMS_PER_FEED, 20),
  digestMaxItems: num(process.env.DIGEST_MAX_ITEMS, 12),
  feedTimeoutMs: num(process.env.FEED_TIMEOUT_MS, 12000),
};
