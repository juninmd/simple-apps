import { expect, test } from "bun:test";
import { defang, escapeHtml, truncate } from "../src/sinks";

test("escapeHtml escapes Telegram HTML metacharacters", () => {
  expect(escapeHtml("a < b & c > d")).toBe("a &lt; b &amp; c &gt; d");
});

test("truncate caps length and marks the cut", () => {
  expect(truncate("x".repeat(3000), 2000)).toHaveLength(2000);
  expect(truncate("short", 2000)).toBe("short");
});

test("defang neutralises mass mentions", () => {
  expect(defang("hi @everyone and @here")).not.toContain("@everyone");
});
