// Minesweeper core logic — pure, index-based (idx = r*cols + c). No DOM.

export function neighbors(idx, rows, cols) {
  const r = Math.floor(idx / cols);
  const c = idx % cols;
  const out = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push(nr * cols + nc);
    }
  return out;
}

/** Place `count` mines, never on `excludeIdx`. rng() → [0,1). Returns a Set of indices. */
export function placeMines(rows, cols, count, excludeIdx, rng = Math.random) {
  const candidates = [];
  for (let i = 0; i < rows * cols; i++) if (i !== excludeIdx) candidates.push(i);
  // Fisher-Yates using rng, then take the first `count`.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return new Set(candidates.slice(0, Math.min(count, candidates.length)));
}

/** Adjacent-mine count for every cell (mines themselves get -1). */
export function computeAdjacency(rows, cols, mineSet) {
  const adj = new Array(rows * cols).fill(0);
  for (let i = 0; i < rows * cols; i++) {
    if (mineSet.has(i)) {
      adj[i] = -1;
      continue;
    }
    adj[i] = neighbors(i, rows, cols).filter((n) => mineSet.has(n)).length;
  }
  return adj;
}

/**
 * Reveal from `start`, flood-filling through zero-adjacency cells.
 * Mutates and returns the `revealed` Set. Won't cross flagged/mine cells.
 */
export function floodReveal(rows, cols, adj, start, revealed = new Set(), flagged = new Set()) {
  const stack = [start];
  while (stack.length) {
    const idx = stack.pop();
    if (revealed.has(idx) || flagged.has(idx)) continue;
    if (adj[idx] === -1) continue; // never auto-reveal a mine
    revealed.add(idx);
    if (adj[idx] === 0) {
      for (const n of neighbors(idx, rows, cols)) if (!revealed.has(n)) stack.push(n);
    }
  }
  return revealed;
}

/** Win = every non-mine cell revealed. */
export function checkWin(rows, cols, mineSet, revealed) {
  return revealed.size === rows * cols - mineSet.size;
}
