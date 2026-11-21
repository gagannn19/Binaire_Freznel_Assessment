import { pick } from "./gradient.js";
import { paintCells } from "./ansi.js";

const UP = " ▁▂▃▄▅▆▇█";

export function graphRows(values, width, height, gradient, { inverted = false } = {}) {
  const rows = [];
  if (width <= 0 || height <= 0) return rows;
  const start = values.length - width;
  const levels = new Float64Array(width);
  for (let c = 0; c < width; c++) {
    const i = start + c;
    levels[c] = i >= 0 ? Math.max(0, Math.min(1, values[i])) * height * 8 : -1;
  }
  for (let r = 0; r < height; r++) {
    const base = inverted ? r * 8 : (height - 1 - r) * 8;
    const isBaseline = inverted ? r === 0 : r === height - 1;
    let text = "";
    for (let c = 0; c < width; c++) {
      const lv = levels[c];
      const fill = lv - base;
      if (lv < 0 || fill <= 0) {
        text += isBaseline && lv > 0 ? (inverted ? "▔" : "▁") : " ";
      } else if (fill >= 8) {
        text += "█";
      } else if (inverted) {
        text += fill >= 4 ? "▀" : "▔";
      } else {
        text += UP[Math.max(1, Math.round(fill))];
      }
    }
    const pos = inverted ? r : height - 1 - r;
    rows.push({ text, color: pick(gradient, (pos + 1) / height) });
  }
  return rows;
}

export function sparkline(values, width, gradient) {
  if (width <= 0) return "";
  const cells = [];
  const start = values.length - width;
  for (let c = 0; c < width; c++) {
    const i = start + c;
    if (i < 0) {
      cells.push({ ch: " ", color: gradient[0] });
      continue;
    }
    const v = Math.max(0, Math.min(1, values[i]));
    cells.push({ ch: UP[Math.max(v > 0 ? 1 : 0, Math.round(v * 8))], color: pick(gradient, v) });
  }
  return paintCells(cells);
}
