import { expect, test } from "bun:test";
import { safeRedirect } from "../src/redirect";

test("rejects protocol-relative and backslash redirects", () => {
  expect(safeRedirect("//evil.example/x")).toBe("/");
  expect(safeRedirect("/\\evil.example")).toBe("/");
});

test("keeps single-slash relative paths", () => {
  expect(safeRedirect("/painel?a=1")).toBe("/painel?a=1");
});

test("rejects control characters", () => {
  expect(safeRedirect("/ok\r\nSet-Cookie: x=1")).toBe("/");
  expect(safeRedirect("/ok\tx")).toBe("/");
});

test("absolute URLs still validated", () => {
  expect(safeRedirect("javascript:alert(1)")).toBe("/");
  expect(safeRedirect("https://app.example.org/x", ".example.org")).toBe("https://app.example.org/x");
});
