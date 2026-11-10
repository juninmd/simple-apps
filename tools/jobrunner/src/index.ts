import { Hono } from "hono";
import { JobStore } from "./store";
import { execute } from "./runner";
import { dashboardHtml } from "./dashboard";

const store = new JobStore();
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TG_CHAT = process.env.TELEGRAM_CHAT_ID ?? "";

async function alert(text: string): Promise<void> {
  if (!TG_TOKEN || !TG_CHAT) return;
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: "HTML" }),
    });
  } catch {}
}

// Runs a single job now, records it, and alerts on a fresh failure.
async function runJob(jid: string): Promise<void> {
  const job = store.get(jid);
  if (!job) return;
  const wasOk = job.lastOk;
  const run = await execute(job);
  await store.applyRun(jid, run);
  if (!run.ok && wasOk !== false) {
    await alert(`⚙️ <b>${job.name}</b> falhou: ${run.error ?? "HTTP " + run.status} (${job.url})`);
  } else if (run.ok && wasOk === false) {
    await alert(`✅ <b>${job.name}</b> recuperou (${run.status}, ${run.ms}ms)`);
  }
}

const app = new Hono();

const METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"];

app.get("/", (c) => {
  c.header("Content-Security-Policy", "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'");
  return c.html(dashboardHtml);
});
app.get("/api/jobs", (c) => c.json({ jobs: store.list() }));

app.post("/api/jobs", async (c) => {
  const b = await c.req.json().catch(() => null);
  const name = String(b?.name ?? "").trim();
  const url = String(b?.url ?? "").trim();
  if (!name || !/^https?:\/\//.test(url)) return c.json({ error: "name and http(s) url required" }, 400);
  const method = String(b?.method ?? "GET").toUpperCase();
  if (!METHODS.includes(method)) return c.json({ error: "invalid method" }, 400);
  const job = await store.create({
    name,
    url,
    method,
    headers: b?.headers && typeof b.headers === "object" ? b.headers : {},
    body: typeof b?.body === "string" ? b.body : undefined,
    intervalSec: Number(b?.intervalSec) || 3600,
  });
  return c.json(job, 201);
});

app.post("/api/jobs/:id/run", async (c) => {
  if (!store.get(c.req.param("id"))) return c.json({ error: "not found" }, 404);
  await runJob(c.req.param("id"));
  return c.json(store.get(c.req.param("id")));
});

app.post("/api/jobs/:id/toggle", async (c) => {
  const enabled = await store.toggle(c.req.param("id"));
  return enabled === null ? c.json({ error: "not found" }, 404) : c.json({ enabled });
});

app.delete("/api/jobs/:id", async (c) => {
  const ok = await store.remove(c.req.param("id"));
  return c.json({ ok }, ok ? 200 : 404);
});

app.get("/health", (c) => c.json({ ok: true, jobs: store.list().length }));

if (import.meta.main) {
  const tickMs = Number(process.env.TICK_MS ?? 5000);
  setInterval(async () => {
    for (const job of store.due(Date.now())) await runJob(job.id);
  }, tickMs);
  const port = Number(process.env.PORT ?? 3000);
  console.log(`jobrunner on :${port}`);
  Bun.serve({ port, fetch: app.fetch });
}

export { app, store };
