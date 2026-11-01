# 🎨 colormate

A **VS Code extension** that shows a small **color swatch** next to every `hex` / `rgb()` / `hsl()` literal in the file, and **converts the selected color** between formats with one command.

## Use
- Swatches appear automatically as you edit.
- Select a color and run **colormate: Converter cor selecionada** (`Ctrl+Alt+K`) → pick `hex`, `rgb`, or `hsl` and it's replaced in place.

Handles `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()/rgba()`, `hsl()/hsla()` — alpha is preserved across conversions.

## Layout
- `src/color.js` — pure parse/convert (`parseColor`, `toHex/toRgb/toHsl`, `findColors`), tested.
- `extension.js` — swatch decorations + convert command.

## Dev
```bash
bun test
# F5 for the Extension Development Host, or: npx @vscode/vsce package
```

MIT.
