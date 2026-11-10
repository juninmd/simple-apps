import { Hono } from "hono";
import { TopicStore } from "./store";
import { fanOut, type Sink, type SinkType } from "./sinks";
import { dashboardHtml } from "./dashboard";

const store = new TopicStore();
const VALID: SinkType[] = ["telegram", "discord", "webhook"];

function cleanSinks(raw: unknown): Sink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is Sink => s && VALID.includes(s.type) && typeof s.target === "string" && s.target.length > 0)
    .map((s) => ({ type: s.type, target: s.target }));
}

const app = new Hono();

app.get("/", (c) => c.html(dashboardHtml));

app.get("/api/topics", (c) => c.json({ topics: store.list() }));

app.post("/api/topics", async (c) => {
  const b = await c.req.json().catch(() => null);
  try {
    const topic = await store.create(String(b?.name ?? ""), cleanSinks(b?.sinks));
    return c.json({ name: topic.name, token: topic.token, publishUrl: `/pub/${topic.name}` }, 201);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "failed" }, 400);
  }
});

app.delete("/api/topics/:name", async (c) => {
  const ok = await store.remove(c.req.param("name"));
  return c.json({ ok }, ok ? 200 : 404);
});

// Publish: Bearer token (or ?token=) authorizes, then fan-out to the topic's sinks.
app.post("/pub/:name", async (c) => {
  const topic = store.get(c.req.param("name"));
  if (!topic) return c.json({ error: "unknown topic" }, 404);

  const auth = c.req.header("authorization")?.replace(/^Bearer\s+/i, "") ?? c.req.query("token") ?? "";
  if (auth !== topic.token) return c.json({ error: "unauthorized" }, 401);

  const b = await c.req.json().catch(() => ({}));
  const title = String(b?.title ?? "").slice(0, 200);
  const message = String(b?.message ?? b?.text ?? "").slice(0, 4000);
  if (!title && !message) return c.json({ error: "title or message required" }, 400);

  const results = await fanOut(topic.sinks, title, message);
  await store.record(topic.name, { ts: Date.now(), title, message, results });
  const okCount = results.filter((r) => r.ok).length;
  return c.json({ ok: okCount === results.length, delivered: okCount, total: results.length, results });
});

app.get("/health", (c) => c.json({ ok: true, topics: store.list().length }));

if (import.meta.main) {
  const port = Number(process.env.PORT ?? 3000);
  console.log(`notify-hub on :${port}`);
  Bun.serve({ port, fetch: app.fetch });
}

export { app, store };
