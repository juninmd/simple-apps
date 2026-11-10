import { test, expect, mock, afterEach } from "bun:test";
import { verifyHmac, backoffMs } from "../src/hmac";
import { deliver } from "../src/relay";
import { createHmac } from "node:crypto";
import { EndpointStore } from "../src/store";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

test("verifyHmac accepts a correct sha256= signature", () => {
  const body = '{"hello":"world"}';
  const secret = "s3cr3t";
  const sig = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  expect(verifyHmac(body, secret, sig)).toBe(true);
});

test("verifyHmac rejects tampered body and missing signature", () => {
  const secret = "s3cr3t";
  const sig = "sha256=" + createHmac("sha256", secret).update("a").digest("hex");
  expect(verifyHmac("b", secret, sig)).toBe(false);
  expect(verifyHmac("a", secret, undefined)).toBe(false);
});

test("backoff grows exponentially", () => {
  expect(backoffMs(0, 500)).toBe(500);
  expect(backoffMs(1, 500)).toBe(1000);
  expect(backoffMs(2, 500)).toBe(2000);
});

test("deliver retries then succeeds", async () => {
  let n = 0;
  const g = globalThis as any;
  g.fetch = mock(async () => {
    n++;
    if (n < 2) throw new Error("conn refused");
    return new Response("ok", { status: 200 });
  });
  const res = await deliver("https://x.test", "POST", "{}", {}, 3, async () => {});
  expect(res.ok).toBe(true);
  expect(res.attempts).toBe(2);
});

test("deliver gives up after maxAttempts", async () => {
  const g = globalThis as any;
  g.fetch = mock(async () => new Response("no", { status: 500 }));
  const res = await deliver("https://x.test", "POST", "{}", {}, 3, async () => {});
  expect(res.ok).toBe(false);
  expect(res.attempts).toBe(3);
  expect(res.status).toBe(500);
});

test("endpoint store ring buffer keeps newest first", async () => {
  const s = new EndpointStore(false);
  const ep = await s.create("t", []);
  for (let i = 0; i < 3; i++) {
    await s.record(ep.token, {
      id: String(i), method: "POST", headers: {}, body: "", receivedAt: i, hmacValid: null, deliveries: [],
    });
  }
  expect(s.get(ep.token)!.requests[0].id).toBe("2");
});

test("deliver does not retry deterministic 4xx", async () => {
  const g = globalThis as any;
  g.fetch = mock(async () => new Response("nf", { status: 404 }));
  const res = await deliver("https://x.test", "POST", "{}", {}, 3, async () => {});
  expect(res.ok).toBe(false);
  expect(res.attempts).toBe(1);
  expect(res.status).toBe(404);
});

test("deliver retries 503 then succeeds", async () => {
  let n = 0;
  const g = globalThis as any;
  g.fetch = mock(async () => new Response("", { status: ++n < 2 ? 503 : 200 }));
  const res = await deliver("https://x.test", "POST", "{}", {}, 3, async () => {});
  expect(res.ok).toBe(true);
  expect(res.attempts).toBe(2);
});

test("deliver honours Retry-After on 429", async () => {
  let n = 0;
  const slept: number[] = [];
  const g = globalThis as any;
  g.fetch = mock(async () =>
    ++n < 2 ? new Response("", { status: 429, headers: { "retry-after": "2" } }) : new Response("", { status: 200 }),
  );
  await deliver("https://x.test", "POST", "{}", {}, 3, async (ms) => void slept.push(ms));
  expect(slept).toEqual([2000]);
});

test("deliver times out a target that never responds", async () => {
  const g = globalThis as any;
  g.fetch = mock(
    (_u: string, init: RequestInit) =>
      new Promise((_, reject) => init.signal!.addEventListener("abort", () => reject(init.signal!.reason))),
  );
  const res = await deliver("https://x.test", "POST", "{}", {}, 2, async () => {}, 20);
  expect(res.ok).toBe(false);
  expect(res.error).toBe("timeout");
  expect(res.attempts).toBe(2);
});
