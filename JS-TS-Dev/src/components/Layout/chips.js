import { theme } from "../../styles/theme.js";

export function chip(label, { hot = -1, sup = "", active = true, color, bold = false } = {}) {
  const base = color || (active ? theme.title : theme.inactive);
  const parts = [];
  if (sup) parts.push({ text: sup, color: theme.hotkey });
  if (hot >= 0 && hot < label.length) {
    if (hot > 0) parts.push({ text: label.slice(0, hot), color: base, bold });
    parts.push({ text: label[hot], color: theme.hotkey, bold: true });
    if (hot < label.length - 1) parts.push({ text: label.slice(hot + 1), color: base, bold });
  } else {
    parts.push({ text: label, color: base, bold });
  }
  return { parts };
}

export const rawChip = (parts) => ({ parts });

export const chipWidth = (c) => c.parts.reduce((n, p) => n + p.text.length, 0) + 2;

export const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵"];
