import { env } from "./config/env.ts";

/** Send a Markdown message to every configured chat. No-op if unconfigured. */
export async function sendTelegram(text: string): Promise<void> {
  if (!env.telegramToken || !env.telegramChatIds.length) {
    console.log("[telegram] não configurado — imprimindo no console:\n");
    console.log(text);
    return;
  }
  let delivered = 0;
  for (const chatId of env.telegramChatIds) {
    let ok = true;
    for (const chunk of split(text, 3800)) {
      const res = await fetch(
        `https://api.telegram.org/bot${env.telegramToken}/sendMessage`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: chunk,
            parse_mode: "Markdown",
            disable_web_page_preview: true,
          }),
        },
      );
      if (!res.ok) {
        ok = false;
        console.error(`[telegram] ${res.status}: ${(await res.text()).slice(0, 300)}`);
      }
    }
    if (ok) delivered++;
  }
  // Throw so the caller keeps the items pending instead of marking them as sent.
  if (!delivered) throw new Error("telegram: nenhum chat recebeu a mensagem completa");
}

export function split(text: string, max: number): string[] {
  const out: string[] = [];
  let buf = "";
  for (const line of text.split("\n")) {
    for (let i = 0; i < Math.max(line.length, 1); i += max - 1) {
      const piece = line.slice(i, i + max - 1);
      if (buf && buf.length + piece.length + 1 > max) {
        out.push(buf);
        buf = "";
      }
      buf += `${piece}\n`;
    }
  }
  if (buf.trim()) out.push(buf);
  return out;
}
