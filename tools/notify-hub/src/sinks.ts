export type SinkType = "telegram" | "discord" | "webhook";

export interface Sink {
  type: SinkType;
  target: string; // telegram: chat_id · discord: webhook URL · webhook: URL
}

export interface SinkResult {
  type: SinkType;
  target: string;
  ok: boolean;
  status: number;
  error?: string;
}

// One Telegram bot serves every telegram sink; only the chat_id varies.
const TG_TOKEN = process.env.NOTIFY_TELEGRAM_BOT_TOKEN ?? "";

const SINK_TIMEOUT_MS = Number(process.env.SINK_TIMEOUT_MS) || 8000;
const DISCORD_MAX = 2000;
const TELEGRAM_MAX = 4096;

export const escapeHtml = (v: string): string =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function truncate(v: string, max: number): string {
  return v.length <= max ? v : `${v.slice(0, max - 1)}…`;
}

// Neutralise mass mentions so a published message cannot ping @everyone/@here.
export const defang = (v: string): string => v.replace(/@(everyone|here)/g, "@\u200b$1");

async function post(url: string, body: unknown, headers: Record<string, string> = {}): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(SINK_TIMEOUT_MS),
  });
}

export async function dispatch(sink: Sink, title: string, message: string): Promise<SinkResult> {
  const base = { type: sink.type, target: sink.target };
  try {
    let res: Response;
    if (sink.type === "telegram") {
      if (!TG_TOKEN) return { ...base, ok: false, status: 0, error: "NOTIFY_TELEGRAM_BOT_TOKEN unset" };
      const t = escapeHtml(title);
      const m = escapeHtml(message);
      const text = truncate(title ? `<b>${t}</b>\n${m}` : m, TELEGRAM_MAX);
      res = await post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        chat_id: sink.target,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
    } else if (sink.type === "discord") {
      res = await post(sink.target, {
        content: truncate(defang(title ? `**${title}**\n${message}` : message), DISCORD_MAX),
      });
    } else {
      res = await post(sink.target, { title, message, ts: Date.now() });
    }
    return { ...base, ok: res.ok, status: res.status, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (err) {
    return { ...base, ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fanOut(sinks: Sink[], title: string, message: string): Promise<SinkResult[]> {
  return Promise.all(sinks.map((s) => dispatch(s, title, message)));
}
