import { Hono } from "hono";
import { EndpointStore, type ReceivedRequest } from "./store";
import { verifyHmac } from "./hmac";
import { fanOut } from "./relay";
import { dashboardHtml } from "./dashboard";

const store = new EndpointStore();
const MAX_BODY = Number(process.env.MAX_BODY_BYTES ?? 16 * 1024);

const app = new Hono();

app.get("/", (c) => c.html(dashboardHtml));

// --- management API ---
app.get("/api/endpoints", (c) => c.json({ endpoints: store.list() }));

app.post("/api/endpoints", async (c) => {
  const b = await c.req.json().catch(() => null);
  const name = String(b?.name ?? "").trim();
  const targets = Array.isArray(b?.targets) ? b.targets.filter((t: unknown) => typeof t === "string") : [];
  if (!name) return c.json({ error: "name required" }, 400);
  const ep = await store.create(name, targets, b?.hmacSecret || undefined);
  return c.json({ token: ep.token, url: `/h/${ep.token}` }, 201);
});

app.get("/api/endpoints/:token", (c) => {
  const ep = store.get(c.req.param("token"));
  if (!ep) return c.json({ error: "not found" }, 404);
  const { hmacSecret, ...rest } = ep;
  return c.json({ ...rest, hmacSecret: hmacSecret ? true : undefined });
});

app.delete("/api/endpoints/:token", async (c) => {
  const ok = await store.remove(c.req.param("token"));
  return c.json({ ok }, ok ? 200 : 404);
});

// --- ingest: any method, verify, store, fan-out ---
app.all("/h/:token", async (c) => {
  const ep = store.get(c.req.param("token"));
  if (!ep) return c.text("unknown endpoint", 404);

  const raw = await c.req.text();
  const body = raw.length > MAX_BODY ? raw.slice(0, MAX_BODY) + "…[truncated]" : raw;
  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((v, k) => (headers[k] = v));

  let hmacValid: boolean | null = null;
  if (ep.hmacSecret) {
    const sig = headers["x-hub-signature-256"] ?? headers["x-signature"] ?? headers["x-signature-256"];
    hmacValid = verifyHmac(raw, ep.hmacSecret, sig);
  }

  const req: ReceivedRequest = {
    id: store.newRequestId(),
    method: c.req.method,
    headers,
    body,
    receivedAt: Date.now(),
    hmacValid,
    deliveries: [],
  };
  await store.record(ep.token, req);

  // If HMAC is configured and fails, store the attempt but do not relay.
  if (ep.hmacSecret && !hmacValid) return c.json({ ok: false, reason: "hmac mismatch" }, 401);

  // Relay in the background so the caller gets a fast 200.
  if (ep.targets.length) {
    void fanOut(ep.targets, c.req.method, raw, headers).then(async (deliveries) => {
      req.deliveries = deliveries;
      await store.save();
    });
  }
  return c.json({ ok: true, id: req.id, relayed: ep.targets.length });
});

app.get("/health", (c) => c.json({ ok: true }));

if (import.meta.main) {
  const port = Number(process.env.PORT ?? 3000);
  console.log(`hookrelay on :${port}`);
  Bun.serve({ port, fetch: app.fetch });
}

export { app, store };
