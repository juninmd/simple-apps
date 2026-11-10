import { test, expect } from "bun:test";
import { TopicStore, slug } from "../src/store";

test("slug normalizes to url-safe", () => {
  expect(slug("My Alerts!")).toBe("my-alerts");
  expect(slug("  deploys  ")).toBe("deploys");
  expect(slug("a__b--c")).toBe("a__b-c");
});

test("create returns token and rejects duplicates", async () => {
  const s = new TopicStore(false);
  const t = await s.create("Alerts", [{ type: "telegram", target: "123" }]);
  expect(t.name).toBe("alerts");
  expect(t.token.length).toBeGreaterThan(10);
  await expect(s.create("alerts", [])).rejects.toThrow("topic exists");
});

test("listing masks the token", async () => {
  const s = new TopicStore(false);
  await s.create("x", []);
  expect(s.list()[0].token).toContain("…");
});

test("record keeps newest first and caps ring", async () => {
  const s = new TopicStore(false);
  const t = await s.create("x", []);
  for (let i = 0; i < 3; i++) {
    await s.record("x", { ts: i, title: String(i), message: "", results: [] });
  }
  expect(s.get("x")!.recent[0].title).toBe("2");
});
