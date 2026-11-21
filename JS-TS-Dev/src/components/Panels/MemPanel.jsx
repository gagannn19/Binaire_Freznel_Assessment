import React from "react";
import { Box } from "ink";
import { Panel, Lines } from "../Layout/Panel.jsx";
import { chip, SUP } from "../Layout/chips.js";
import { theme } from "../../styles/theme.js";
import { paint, meter, bold } from "../../utils/ansi.js";
import { sparkline } from "../../utils/graph.js";
import { formatBytes, formatRate, pad } from "../../utils/format.js";

function meterRow(label, value, total, width, gradient) {
  const labelW = 7;
  const valS = formatBytes(value);
  const valW = Math.max(10, valS.length + 1);
  const meterW = width - labelW - valW;
  const pct = total ? (value / total) * 100 : 0;
  return (
    paint(theme.text, pad(label, labelW)) +
    (meterW >= 3 ? meter(pct, meterW, gradient) : " ".repeat(Math.max(0, meterW))) +
    paint(theme.title, valS.padStart(valW))
  );
}

const valueRow = (label, value, width) =>
  paint(theme.text, label) + paint(theme.title, formatBytes(value).padStart(Math.max(0, width - label.length)));

function memLines(mem, width) {
  if (!mem) return [paint(theme.dim, "collecting…")];
  const g = theme.gradient;
  const lines = [
    valueRow("Total:", mem.total, width),
    meterRow("Used", mem.used, mem.total, width, g.used),
    meterRow("Avail", mem.available, mem.total, width, g.available),
    meterRow("Cache", mem.cached, mem.total, width, g.cached),
    meterRow("Free", mem.free, mem.total, width, g.free),
  ];
  if (mem.swapTotal) {
    lines.push("", valueRow("Swap:", mem.swapTotal, width));
    lines.push(meterRow("Used", mem.swapUsed, mem.swapTotal, width, g.swap));
    lines.push(meterRow("Free", mem.swapFree, mem.swapTotal, width, g.free));
  }
  return lines;
}

function diskLines(disk, width) {
  const reads = disk.readHistory.toArray(width);
  const writes = disk.writeHistory.toArray(width);
  const totals = reads.map((r, i) => r + (writes[i] || 0));
  const peak = Math.max(1, ...totals);
  const io = `▼${formatRate(disk.read)} ▲${formatRate(disk.write)}`;
  const lines = [
    sparkline(totals.map((v) => v / peak), width, theme.gradient.io),
    paint(theme.text, "IO ") + paint(theme.title, pad(io, width - 3, "right")),
  ];
  for (const d of disk.disks) {
    const size = formatBytes(d.size);
    lines.push(bold(paint(theme.title, pad(d.name, width - size.length - 1))) + " " + paint(theme.text, size));
    lines.push(meterRow(`Used:${Math.round(d.usedPct)}%`.padEnd(7).slice(0, 7), d.used, d.size, width, theme.gradient.used));
    lines.push(meterRow(`Free:${Math.round(100 - d.usedPct)}%`.padEnd(7).slice(0, 7), d.free, d.size, width, theme.gradient.free));
  }
  if (!disk.disks.length) lines.push(paint(theme.dim, "collecting…"));
  return lines;
}

export function MemPanel({ width, height, snap }) {
  const innerW = width - 2;
  const innerH = height - 2;
  const showDisks = innerW >= 48;
  const memW = showDisks ? Math.floor((innerW - 1) / 2) : innerW;
  const diskW = innerW - memW - 1;
  const divider = Array.from({ length: innerH }, () => paint(theme.box.mem, "│"));

  return (
    <Panel
      width={width}
      height={height}
      color={theme.box.mem}
      title={{
        left: [chip("mem", { sup: SUP[2] })],
        center: showDisks ? [chip("disks")] : [],
        centerAt: 1 + memW,
      }}
    >
      <Box flexDirection="row">
        <Lines lines={memLines(snap.mem, memW).slice(0, innerH)} width={memW} />
        {showDisks && <Lines lines={divider} width={1} />}
        {showDisks && <Lines lines={diskLines(snap.disk, diskW).slice(0, innerH)} width={diskW} />}
      </Box>
    </Panel>
  );
}
