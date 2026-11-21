import { theme } from "../styles/theme.js";
import { pick } from "./gradient.js";

const cache = new Map();
export function fg(hex) {
  let code = cache.get(hex);
  if (!code) {
    const n = parseInt(hex.slice(1), 16);
    code = `\x1b[38;2;${(n >> 16) & 255};${(n >> 8) & 255};${n & 255}m`;
    cache.set(hex, code);
  }
  return code;
}
export const RESET = "\x1b[39m";
export const BOLD = "\x1b[1m";
export const UNBOLD = "\x1b[22m";

export const paint = (hex, text) => (text ? fg(hex) + text + RESET : "");
export const bold = (text) => BOLD + text + UNBOLD;

export function paintCells(cells) {
  let out = "";
  let current = null;
  for (const { ch, color } of cells) {
    if (color !== current) {
      out += fg(color);
      current = color;
    }
    out += ch;
  }
  return current ? out + RESET : out;
}

function meterCells(percent, width, gradient, { empty = theme.meterEmpty, ch = "■" } = {}) {
  const w = Math.max(0, width);
  const filled = Math.round((Math.max(0, Math.min(100, percent || 0)) / 100) * w);
  const cells = new Array(w);
  for (let i = 0; i < w; i++) {
    cells[i] = i < filled ? { ch, color: pick(gradient, w > 1 ? i / (w - 1) : 1) } : { ch, color: empty };
  }
  return cells;
}

export const meter = (percent, width, gradient, opts) => paintCells(meterCells(percent, width, gradient, opts));
