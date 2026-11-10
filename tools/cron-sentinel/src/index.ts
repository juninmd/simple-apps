import { Hono } from "hono";
import { CheckStore, type Status } from "./store";
import { notify } from "./telegram";
import { dashboardHtml } from "./dashboard";

const store = new CheckStore();

const app = new Hono();

app.get("/", (c) => c.html(dashboardHtml));

app.get("/api/checks", (c) => c.json({ checks: store.list() }));

app.post("/api/checks", async (c) => {
  const b = await c.req.json().catch(() => null);
  const name = String(b?.name ?? "").trim();
  if (!name) return c.json({ error: "name required" }, 400);
  const periodSec = Math.max(10, Number(b?.periodSec) || 86400);
  const graceSec = Math.max(0, Number(b?.graceSec) || 3600);
  const check = await store.create(name, periodSec, graceSec);
  return c.json({ ...check, pingUrl: `/ping/${check.id}` }, 201);
});

app.delete("/api/checks/:id", async (c) => {
  const ok = await store.remove(c.req.param("id"));
  return c.json({ ok }, ok ? 200 : 404);
});

// Jobs hit this on success (GET or POST — curl-friendly).
const ping = async (c: any) => {
  const ok = await store.ping(c.req.param("id"));
  return ok ? c.text("OK") : c.text("unknown check", 404);
};
app.get("/ping/:id", ping);
app.post("/ping/:id", ping);

app.get("/health", (c) => c.json({ ok: true, checks: store.list().length }));

const emoji: Record<Status, string> = { new: "🆕", up: "✅", late: "🟡", down: "🔴" };

if (import.meta.main) {
  const intervalMs = Number(process.env.RECONCILE_INTERVAL_MS ?? 30_000);
  setInterval(async () => {
    for (const { check, from, to } of await store.reconcile()) {
      // Alert when a job goes silent, or recovers from down.
      if (to === "down" || (from === "down" && to === "up")) {
        await notify(`${emoji[to]} <b>${check.name}</b>: ${from} → <b>${to}</b>`);
      }
    }
  }, intervalMs);
  const port = Number(process.env.PORT ?? 3000);
  console.log(`cron-sentinel on :${port}`);
  Bun.serve({ port, fetch: app.fetch });
}

export { app, store };
