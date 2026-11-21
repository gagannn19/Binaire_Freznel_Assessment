const toRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

export function makeGradient(stops, steps = 101) {
  const rgb = stops.map(toRgb);
  const out = new Array(steps);
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const seg = Math.min(rgb.length - 2, Math.floor(t * (rgb.length - 1)));
    const local = t * (rgb.length - 1) - seg;
    const a = rgb[seg];
    const b = rgb[seg + 1];
    out[i] = toHex([0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * local));
  }
  return out;
}

export const pick = (gradient, t) =>
  gradient[Math.max(0, Math.min(gradient.length - 1, Math.round(t * (gradient.length - 1))))];
