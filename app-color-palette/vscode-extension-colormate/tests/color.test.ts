import { test, expect } from "bun:test";
import { parseColor, toHex, toRgb, toHsl, convert, findColors } from "../src/color.js";

test("parseColor: hex forms", () => {
  expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  expect(parseColor("#ff0000")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  expect(parseColor("#00ff0080").a).toBeCloseTo(0.502, 2);
  expect(parseColor("nope")).toBeNull();
});

test("parseColor: rgb and hsl", () => {
  expect(parseColor("rgb(255, 0, 0)")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  expect(parseColor("rgba(0,0,0,0.5)").a).toBe(0.5);
  const red = parseColor("hsl(0, 100%, 50%)");
  expect(red.r).toBe(255);
  expect(red.g).toBe(0);
  expect(red.b).toBe(0);
});

test("toHex / toRgb / toHsl formatting", () => {
  const c = { r: 255, g: 0, b: 0, a: 1 };
  expect(toHex(c)).toBe("#ff0000");
  expect(toRgb(c)).toBe("rgb(255, 0, 0)");
  expect(toHsl(c)).toBe("hsl(0, 100%, 50%)");
  expect(toHex({ r: 0, g: 255, b: 0, a: 0.5 })).toBe("#00ff0080");
});

test("convert round-trips hex↔hsl for primary colors", () => {
  expect(convert("#00ff00", "hsl")).toBe("hsl(120, 100%, 50%)");
  expect(convert("hsl(240, 100%, 50%)", "hex")).toBe("#0000ff");
  expect(convert("bad", "hex")).toBeNull();
});

test("findColors locates literals in a stylesheet", () => {
  const css = "a{color:#ff0000;background:rgb(0,0,0);border:hsl(120,50%,50%)}";
  const found = findColors(css).map((c) => c.match);
  expect(found).toEqual(["#ff0000", "rgb(0,0,0)", "hsl(120,50%,50%)"]);
});
