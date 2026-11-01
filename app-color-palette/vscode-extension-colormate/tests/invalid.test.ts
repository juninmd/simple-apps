import { test, expect } from "bun:test";
import { parseColor, findColors } from "../src/color.js";

const invalid = [
  "rgb(a,b,c)", "rgb(,,)", "rgb(1,2)", "rgb(1,2,3,4,5)", "rgb(1,2,3,)",
  "rgb(50%, 0%, 0%)", "rgba(0,0,0,50%)", "hsl(x,y,z)", "hsl(120deg, 50%, 50%)",
  "hsl(,,)", "hsl(1,2)", "hsl(1,2%,3%,4,5)", "rgb(Infinity,0,0)",
];

test("parseColor returns null for malformed rgb()/hsl()", () => {
  for (const s of invalid) expect(parseColor(s)).toBeNull();
});

test("parseColor never yields NaN", () => {
  for (const s of invalid) {
    const c = parseColor(s);
    expect(c === null || Object.values(c).every(Number.isFinite)).toBe(true);
  }
});

test("findColors skips malformed literals", () => {
  expect(findColors("color: rgb(a,b,c)")).toEqual([]);
});

test("valid forms still parse", () => {
  expect(parseColor("rgb(255, 0, 0)")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  expect(parseColor("rgba(0,0,0,.5)").a).toBe(0.5);
  expect(parseColor("hsl(120, 100%, 50%)")).toMatchObject({ r: 0, g: 255, b: 0 });
});
