import { test, expect } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dashboardHtml } from "../src/dashboard";

process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "jobrunner-"));
const { app } = await import("../src/index");

const post = (body: unknown) =>
  app.request("/api/jobs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

test("rejects a job whose method is not an allowed verb", async () => {
  for (const method of ["<img src=x onerror=alert(1)>", "FOO", 123]) {
    const res = await post({ name: "x", url: "https://example.com", method });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid method" });
  }
});

test("dashboard esc() escapes & < > \" '", () => {
  const src = /function esc\(s\)\{.*\}\n/.exec(dashboardHtml)![0];
  const esc = new Function(`${src}return esc;`)() as (s: unknown) => string;
  expect(esc(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
});

test("dashboard escapes method and id in generated HTML", () => {
  expect(dashboardHtml).toContain("esc(j.method)");
  expect(dashboardHtml).not.toMatch(/\+j\.(method|id)\+/);
});

test("dashboard is served with a CSP header", async () => {
  const res = await app.request("/");
  expect(res.headers.get("content-security-policy")).toContain("default-src 'self'");
});
