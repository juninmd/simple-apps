import { test, expect } from "bun:test";
import { neighbors, placeMines, computeAdjacency, floodReveal, checkWin } from "../logic.js";

test("neighbors respects grid bounds", () => {
  // 3x3 grid. Corner 0 → [1,3,4]; center 4 → all 8.
  expect(neighbors(0, 3, 3).sort((a, b) => a - b)).toEqual([1, 3, 4]);
  expect(neighbors(4, 3, 3).length).toBe(8);
  expect(neighbors(8, 3, 3).sort((a, b) => a - b)).toEqual([4, 5, 7]);
});

test("computeAdjacency counts surrounding mines", () => {
  // 3x3, mine at center (idx 4).
  const mines = new Set([4]);
  const adj = computeAdjacency(3, 3, mines);
  expect(adj[4]).toBe(-1);
  expect(adj[0]).toBe(1); // corner touches center
  expect(adj.filter((v) => v === 1).length).toBe(8);
});

test("placeMines honors count and exclusion", () => {
  const mines = placeMines(5, 5, 6, 12, () => 0.5);
  expect(mines.size).toBe(6);
  expect(mines.has(12)).toBe(false); // first click always safe
});

test("floodReveal expands through zeros, stops at numbers", () => {
  // 3x3, single mine at corner 8. Reveal from opposite corner 0.
  const mines = new Set([8]);
  const adj = computeAdjacency(3, 3, mines);
  const revealed = floodReveal(3, 3, adj, 0);
  // Everything except the mine should be revealed (only one mine, flood reaches all).
  expect(revealed.has(8)).toBe(false);
  expect(revealed.size).toBe(8);
});

test("floodReveal on a bordered number reveals just that cell", () => {
  const mines = new Set([1]); // 3x3, mine at idx 1
  const adj = computeAdjacency(3, 3, mines);
  // idx 0 is adjacent to the mine (adj>0) → only itself.
  const revealed = floodReveal(3, 3, adj, 0);
  expect([...revealed]).toEqual([0]);
});

test("checkWin when all non-mines revealed", () => {
  const mines = new Set([8]);
  const revealed = new Set([0, 1, 2, 3, 4, 5, 6, 7]);
  expect(checkWin(3, 3, mines, revealed)).toBe(true);
  revealed.delete(7);
  expect(checkWin(3, 3, mines, revealed)).toBe(false);
});
