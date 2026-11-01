# 💣 minesweep

Classic **Minesweeper** in the browser — three difficulties, first-click-always-safe, flags, timer. Vanilla JS + CSS grid, zero dependencies, no backend.

- Left-click reveals; zero-adjacency cells flood-open their neighbors.
- Right-click (or long-press on touch) plants a flag.
- Mines are placed **after** your first click, excluding it — you never lose on move one.

## Play
```bash
bunx serve .    # or python -m http.server → open index.html
```

## Layout
- `logic.js` — pure engine (`placeMines`, `computeAdjacency`, `floodReveal`, `checkWin`), unit-tested.
- `game.js` — DOM grid + input + timer.
- `index.html` — board + styles.

## Dev
```bash
bun test        # adjacency, flood-fill, safe placement, win detection
```

## Deploy
Static → **GitHub Pages** via `.github/workflows/pages.yml`.

MIT — see [LICENSE](LICENSE).
