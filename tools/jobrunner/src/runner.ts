import type { Job, Run } from "./store";

// Executes a job's HTTP request once and returns a Run record.
// `now` is injected for deterministic tests.
export async function execute(job: Job, timeoutMs = 30_000, now = () => Date.now()): Promise<Run> {
  const started = now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(job.url, {
      method: job.method,
      headers: job.headers,
      body: job.method === "GET" || job.method === "HEAD" ? undefined : job.body,
      signal: ctrl.signal,
    });
    return { ts: started, ok: res.ok, status: res.status, ms: now() - started };
  } catch (err) {
    return {
      ts: started,
      ok: false,
      status: 0,
      ms: now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}
