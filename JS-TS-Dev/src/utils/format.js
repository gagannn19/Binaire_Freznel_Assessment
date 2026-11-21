const UNITS = ["Byte", "KiB", "MiB", "GiB", "TiB", "PiB"];

function scale(bytes) {
  let v = Math.abs(bytes);
  let i = 0;
  while (v >= 1024 && i < UNITS.length - 1) {
    v /= 1024;
    i++;
  }
  return { v, i };
}

const num = (v, i) => (i === 0 ? String(Math.round(v)) : v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2));

export function formatBytes(bytes, { short = false } = {}) {
  if (bytes == null || !Number.isFinite(bytes)) return "-";
  const { v, i } = scale(bytes);
  if (short) return (i === 0 ? String(Math.round(v)) : v >= 10 ? v.toFixed(0) : v.toFixed(1)) + (i === 0 ? "B" : UNITS[i][0]);
  return `${num(v, i)} ${UNITS[i]}`;
}

export const formatRate = (bytesPerSec) => (bytesPerSec == null ? "-" : `${formatBytes(bytesPerSec)}/s`);

const two = (n) => String(n).padStart(2, "0");

export function formatUptime(seconds) {
  const s = Math.floor(seconds || 0);
  const d = Math.floor(s / 86400);
  return `up ${d ? `${d}d ` : ""}${two(Math.floor((s % 86400) / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`;
}

export const formatClock = (date) => `${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}`;

export function truncate(str, width) {
  const s = String(str ?? "");
  if (width <= 0) return "";
  if (s.length <= width) return s;
  return width === 1 ? "…" : s.slice(0, width - 1) + "…";
}

export function pad(str, width, align = "left") {
  const s = truncate(str, width);
  return align === "right" ? s.padStart(width) : s.padEnd(width);
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function niceCeiling(bytes) {
  for (let unit = 1024; unit < 1024 ** 6; unit *= 1024) {
    for (const m of [1, 10, 100]) {
      if (m * unit >= bytes) return m * unit;
    }
  }
  return bytes;
}
