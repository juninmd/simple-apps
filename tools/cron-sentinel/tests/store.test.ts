import { test, expect } from "bun:test";
import { CheckStore, computeStatus } from "../src/store";

const base = { periodSec: 100, graceSec: 20 };

test("computeStatus: new until first ping", () => {
  expect(computeStatus({ lastPing: null, ...base }, 1000)).toBe("new");
});

test("computeStatus: up within period", () => {
  const now = 1_000_000;
  expect(computeStatus({ lastPing: now - 50_000, ...base }, now)).toBe("up");
});

test("computeStatus: late within grace", () => {
  const now = 1_000_000;
  expect(computeStatus({ lastPing: now - 110_000, ...base }, now)).toBe("late");
});

test("computeStatus: down past grace", () => {
  const now = 1_000_000;
  expect(computeStatus({ lastPing: now - 130_000, ...base }, now)).toBe("down");
});

test("ping resets to up and increments count", async () => {
  const s = new CheckStore(false);
  const c = await s.create("job", 100, 20);
  expect(c.status).toBe("new");
  await s.ping(c.id);
  const listed = s.list()[0];
  expect(listed.status).toBe("up");
  expect(listed.pings).toBe(1);
});

test("reconcile reports new->down transition", async () => {
  const s = new CheckStore(false);
  const c = await s.create("job", 100, 20);
  // 200s later with no ping -> down
  const changes = await s.reconcile(c.createdAt + 500_000);
  // never pinged stays "new" (lastPing null) — should NOT alert
  expect(changes.length).toBe(0);
  await s.ping(c.id, c.createdAt);
  const changes2 = await s.reconcile(c.createdAt + 500_000);
  expect(changes2[0].to).toBe("down");
});

test("reconcile reports down->up recovery after a ping", async () => {
  const s = new CheckStore(false);
  const c = await s.create("job", 100, 20);
  const t0 = c.createdAt;
  await s.ping(c.id, t0);
  await s.reconcile(t0 + 1_000); // settle persisted status to up
  expect((await s.reconcile(t0 + 500_000))[0]).toMatchObject({ from: "up", to: "down" });
  await s.ping(c.id, t0 + 500_000);
  const changes = await s.reconcile(t0 + 500_001);
  expect(changes.length).toBe(1);
  expect(changes[0]).toMatchObject({ from: "down", to: "up" });
});

test("reconcile reports late->up after a ping", async () => {
  const s = new CheckStore(false);
  const c = await s.create("job", 100, 20);
  const t0 = c.createdAt;
  await s.ping(c.id, t0);
  await s.reconcile(t0 + 1_000); // settle persisted status to up
  expect((await s.reconcile(t0 + 110_000))[0]).toMatchObject({ from: "up", to: "late" });
  await s.ping(c.id, t0 + 110_000);
  expect((await s.reconcile(t0 + 110_001))[0]).toMatchObject({ from: "late", to: "up" });
});
