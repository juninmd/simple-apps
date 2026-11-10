import { backoffMs } from "./hmac";
import type { Delivery } from "./store";

const DEFAULT_TIMEOUT_MS = Number(process.env.DELIVERY_TIMEOUT_MS) > 0 ? Number(process.env.DELIVERY_TIMEOUT_MS) : 10_000;
const RETRYABLE = new Set([408, 425, 429]);
const isRetryable = (status: number) => status >= 500 || RETRYABLE.has(status);

// Delivers a body to one target with exponential-backoff retries.
// `sleep` is injectable so tests run instantly.
export async function deliver(
  target: string,
  method: string,
  body: string,
  headers: Record<string, string>,
  maxAttempts = 3,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Delivery> {
  let lastErr = "";
  let lastStatus = 0;
  let retryAfterMs = 0;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(Math.max(backoffMs(attempt - 1), retryAfterMs));
    retryAfterMs = 0;
    try {
      const res = await fetch(target, {
        method: method === "GET" || method === "HEAD" ? "POST" : method,
        headers: { "content-type": headers["content-type"] ?? "application/json", "x-hookrelay": "1" },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
      lastStatus = res.status;
      if (res.ok) return { target, ok: true, status: res.status, attempts: attempt + 1 };
      lastErr = `HTTP ${res.status}`;
      if (!isRetryable(res.status)) return { target, ok: false, status: res.status, attempts: attempt + 1, error: lastErr };
      const secs = Number(res.headers.get("retry-after"));
      if (secs > 0 && (res.status === 429 || res.status === 503)) retryAfterMs = Math.min(secs * 1000, 30_000);
    } catch (err) {
      lastErr = err instanceof Error && err.name === "TimeoutError" ? "timeout" : err instanceof Error ? err.message : String(err);
    }
  }
  return { target, ok: false, status: lastStatus, attempts: maxAttempts, error: lastErr };
}

export async function fanOut(
  targets: string[],
  method: string,
  body: string,
  headers: Record<string, string>,
): Promise<Delivery[]> {
  return Promise.all(targets.map((t) => deliver(t, method, body, headers)));
}
