// Pure color parsing/conversion — no vscode dependency, unit-testable.
// Internal representation: { r, g, b (0-255), a (0-1) }.

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const h2 = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");

const NUM = /^[+-]?(\d+\.?\d*|\.\d+)$/;
// Strict number: NaN for empty/unknown-suffix strings (unlike unary +).
const num = (str, pct) => (NUM.test(pct ? str.replace(/%$/, "") : str) ? parseFloat(str) : NaN);
const args = (body) => {
  const parts = body.split(",").map((x) => x.trim());
  return parts.length === 3 || parts.length === 4 ? parts : null;
};
const finite = (c) => (Object.values(c).every(Number.isFinite) ? c : null);

function parseColor(input) {
  const s = String(input).trim().toLowerCase();

  // hex
  let m = /^#([0-9a-f]{3,8})$/.exec(s);
  if (m) {
    const h = m[1];
    if (h.length === 3) return { r: p(h[0]), g: p(h[1]), b: p(h[2]), a: 1 };
    if (h.length === 4) return { r: p(h[0]), g: p(h[1]), b: p(h[2]), a: p(h[3]) / 255 };
    if (h.length === 6) return { r: hx(h, 0), g: hx(h, 2), b: hx(h, 4), a: 1 };
    if (h.length === 8) return { r: hx(h, 0), g: hx(h, 2), b: hx(h, 4), a: hx(h, 6) / 255 };
    return null;
  }
  // rgb / rgba
  m = /^rgba?\(([^)]+)\)$/.exec(s);
  if (m) {
    const parts = args(m[1]);
    if (!parts) return null;
    return finite({
      r: clamp(num(parts[0]), 0, 255),
      g: clamp(num(parts[1]), 0, 255),
      b: clamp(num(parts[2]), 0, 255),
      a: parts[3] === undefined ? 1 : clamp(num(parts[3]), 0, 1),
    });
  }
  // hsl / hsla
  m = /^hsla?\(([^)]+)\)$/.exec(s);
  if (m) {
    const parts = args(m[1]);
    if (!parts) return null;
    const [h, sat, lig] = [num(parts[0]), num(parts[1], true), num(parts[2], true)];
    if (Number.isNaN(h + sat + lig)) return null;
    const rgb = hslToRgb(h, sat, lig);
    return finite({ ...rgb, a: parts[3] === undefined ? 1 : clamp(num(parts[3]), 0, 1) });
  }
  return null;
}

const p = (c) => parseInt(c + c, 16);
const hx = (h, i) => parseInt(h.slice(i, i + 2), 16);

function toHex({ r, g, b, a }) {
  const base = `#${h2(r)}${h2(g)}${h2(b)}`;
  return a < 1 ? base + h2(a * 255) : base;
}

function toRgb({ r, g, b, a }) {
  const R = Math.round(r), G = Math.round(g), B = Math.round(b);
  return a < 1 ? `rgba(${R}, ${G}, ${B}, ${round(a)})` : `rgb(${R}, ${G}, ${B})`;
}

function rgbToHsl({ r, g, b }) {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const mm = l - c / 2;
  let rgb = [0, 0, 0];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return { r: Math.round((rgb[0] + mm) * 255), g: Math.round((rgb[1] + mm) * 255), b: Math.round((rgb[2] + mm) * 255) };
}

function toHsl(color) {
  const { h, s, l } = rgbToHsl(color);
  return color.a < 1 ? `hsla(${h}, ${s}%, ${l}%, ${round(color.a)})` : `hsl(${h}, ${s}%, ${l}%)`;
}

const round = (n) => Math.round(n * 100) / 100;

function convert(input, target) {
  const c = parseColor(input);
  if (!c) return null;
  return target === "hex" ? toHex(c) : target === "rgb" ? toRgb(c) : target === "hsl" ? toHsl(c) : null;
}

const FIND_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)/g;

/** Find color literals in text → { match, index, length }. */
function findColors(text) {
  const out = [];
  FIND_RE.lastIndex = 0;
  for (let m = FIND_RE.exec(text); m; m = FIND_RE.exec(text)) {
    if (parseColor(m[0])) out.push({ match: m[0], index: m.index, length: m[0].length });
  }
  return out;
}

module.exports = { parseColor, toHex, toRgb, toHsl, rgbToHsl, hslToRgb, convert, findColors };
