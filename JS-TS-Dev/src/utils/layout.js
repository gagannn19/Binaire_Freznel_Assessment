import { clamp } from "./format.js";

export const MIN_COLS = 60;
export const MIN_ROWS = 18;

export function computeLayout(cols, rows, boxes) {
  if (cols < MIN_COLS || rows < MIN_ROWS) return { tooSmall: true };
  const bottomBoxes = boxes.mem || boxes.net || boxes.proc;
  const cpuH = boxes.cpu ? (bottomBoxes ? clamp(Math.round(rows * 0.34), 8, rows - 10) : rows) : 0;
  const bottomH = rows - cpuH;
  const L = { tooSmall: false, cpu: { w: cols, h: cpuH } };
  if (!bottomBoxes) return L;

  const side = boxes.mem && boxes.net;
  if (cols >= 100 || !boxes.proc) {
    L.mode = "wide";
    const leftW = boxes.proc ? (boxes.mem || boxes.net ? clamp(Math.round(cols * 0.45), 44, cols - 44) : 0) : cols;
    const memH = boxes.mem ? (boxes.net ? Math.round(bottomH * 0.58) : bottomH) : 0;
    if (boxes.mem) L.mem = { w: leftW, h: memH };
    if (boxes.net) L.net = { w: leftW, h: bottomH - memH };
    if (boxes.proc) L.proc = { w: cols - leftW, h: bottomH };
  } else {
    L.mode = "narrow";
    const midH = boxes.mem || boxes.net ? Math.max(8, Math.round(bottomH * 0.42)) : 0;
    const memW = side ? Math.floor(cols / 2) : cols;
    if (boxes.mem) L.mem = { w: memW, h: midH };
    if (boxes.net) L.net = { w: side ? cols - memW : cols, h: midH };
    L.proc = { w: cols, h: bottomH - midH };
  }
  return L;
}
