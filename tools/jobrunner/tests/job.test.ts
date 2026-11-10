import { test, expect, mock } from "bun:test";
import { JobStore, isDue } from "../src/store";
import { execute } from "../src/runner";

test("isDue respects enabled flag and schedule", () => {
  expect(isDue({ enabled: true, nextRun: 1000 }, 1000)).toBe(true);
  expect(isDue({ enabled: true, nextRun: 2000 }, 1000)).toBe(false);
  expect(isDue({ enabled: false, nextRun: 0 }, 9999)).toBe(false);
});

test("create clamps interval to >=5s and enables", async () => {
  const s = new JobStore(false);
  const j = await s.create({ name: "j", url: "https://x", intervalSec: 1 });
  expect(j.intervalSec).toBe(5);
  expect(j.enabled).toBe(true);
});

test("applyRun schedules next fire and records history", async () => {
  const s = new JobStore(false);
  const j = await s.create({ name: "j", url: "https://x", intervalSec: 60 });
  const now = 1_000_000;
  const updated = await s.applyRun(j.id, { ts: now, ok: true, status: 200, ms: 12 }, now);
  expect(updated!.nextRun).toBe(now + 60_000);
  expect(updated!.runs).toBe(1);
  expect(updated!.history[0].status).toBe(200);
  expect(updated!.lastOk).toBe(true);
});

test("toggle flips enabled and reschedules on enable", async () => {
  const s = new JobStore(false);
  const j = await s.create({ name: "j", url: "https://x", intervalSec: 60 });
  expect(await s.toggle(j.id)).toBe(false);
  expect(await s.toggle(j.id)).toBe(true);
  expect(await s.toggle("nope")).toBeNull();
});

test("execute reports failure without throwing", async () => {
  const g = globalThis as any;
  g.fetch = mock(async () => {
    throw new Error("refused");
  });
  const run = await execute({ url: "https://x", method: "GET", headers: {} } as any);
  expect(run.ok).toBe(false);
  expect(run.error).toBe("refused");
});

test("execute marks 2xx ok", async () => {
  const g = globalThis as any;
  g.fetch = mock(async () => new Response("ok", { status: 204 }));
  const run = await execute({ url: "https://x", method: "GET", headers: {} } as any);
  expect(run.ok).toBe(true);
  expect(run.status).toBe(204);
});
