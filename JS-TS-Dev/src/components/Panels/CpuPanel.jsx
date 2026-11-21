import React from "react";
import { Box } from "ink";
import { Panel, Lines } from "../Layout/Panel.jsx";
import { chip, rawChip, SUP } from "../Layout/chips.js";
import { theme } from "../../styles/theme.js";
import { paint, meter } from "../../utils/ansi.js";
import { pick } from "../../utils/gradient.js";
import { graphRows, sparkline } from "../../utils/graph.js";
import { formatClock, formatUptime, pad, truncate } from "../../utils/format.js";

function coreLine(label, load, temp, history, width, showTemp) {
  const tempW = showTemp ? 6 : 0;
  const sparkW = history && width >= 22 ? 5 : 0;
  const meterW = Math.max(1, width - 9 - tempW - (sparkW ? sparkW + 1 : 0));

  let line = paint(theme.text, pad(label, 3)) + " " + meter(load, meterW, theme.gradient.cpu);
  if (sparkW) line += " " + sparkline(history.toArray(sparkW), sparkW, theme.gradient.cpu);
  line += paint(pick(theme.gradient.cpu, load / 100), " " + `${Math.round(load)}%`.padStart(4));
  if (showTemp) {
    const text = temp == null ? "  -- " : `${Math.round(temp)}°C`.padStart(5);
    line += paint(temp == null ? theme.dim : pick(theme.gradient.temp, temp / 100), " " + text);
  }
  return line;
}

function coresBoxSize(cpu, innerW, innerH) {
  if (innerW < 60 || innerH < 4) return null;
  const showTemp = cpu.temp != null || cpu.cores.some((c) => c.temp != null);
  const lineW = showTemp ? 30 : 24;
  const height = Math.min(innerH, cpu.cores.length + 4);
  const rows = Math.max(1, height - 4);
  const columns = Math.ceil(cpu.cores.length / rows) || 1;
  const width = Math.min(Math.floor(innerW * 0.45), columns * (lineW + 1) + 1);
  return { width, height };
}

function CoresBox({ cpu, width, height }) {
  const innerW = width - 2;
  const showTemp = cpu.temp != null || cpu.cores.some((c) => c.temp != null);
  const rows = Math.max(0, height - 4);
  const columns = rows ? Math.ceil(cpu.cores.length / rows) || 1 : 1;
  const colW = Math.floor((innerW - (columns - 1)) / columns);

  const lines = [coreLine("CPU", cpu.total, cpu.temp, null, innerW, showTemp)];
  for (let r = 0; r < Math.min(rows, cpu.cores.length); r++) {
    const parts = [];
    for (let c = 0; c < columns; c++) {
      const i = c * rows + r;
      const core = cpu.cores[i];
      if (core) parts.push(coreLine(`C${i}`, core.load, core.temp, core.history, colW, showTemp));
    }
    lines.push(parts.join(" "));
  }
  const loadAvg = cpu.loadAvg.map((v) => v.toFixed(2).padStart(6)).join("");
  lines.push(paint(theme.text, "Load AVG:") + paint(theme.title, pad(loadAvg, innerW - 9, "right")));

  return (
    <Panel
      width={width}
      height={height}
      color={theme.box.cpu}
      title={{
        left: [chip(truncate(cpu.brand, Math.max(4, innerW - 12)), { bold: true })],
        right: cpu.ghz ? [chip(`${cpu.ghz.toFixed(1)} GHz`)] : [],
      }}
    >
      <Lines lines={lines} width={innerW} />
    </Panel>
  );
}

export function CpuPanel({ width, height, snap, now }) {
  const { cpu, mem, battery, interval } = snap;
  const innerW = width - 2;
  const innerH = height - 2;
  const box = coresBoxSize(cpu, innerW, innerH);
  const graphW = box ? innerW - box.width - 1 : innerW;
  const graphH = Math.max(1, innerH - 1);

  const showMem = mem && graphH >= 5;
  const cpuH = showMem ? Math.ceil((graphH - 1) * 0.6) : graphH;
  const memH = showMem ? graphH - 1 - cpuH : 0;

  const lines = graphRows(cpu.history.toArray(graphW), graphW, cpuH, theme.gradient.cpu).map((r) => paint(r.color, r.text));
  if (showMem) {
    const label = "cpu ▲▼ mem";
    lines.push(paint(theme.graphText, label.padStart(Math.floor((graphW + label.length) / 2))));
    const memRows = graphRows(mem.history.toArray(graphW), graphW, memH, theme.gradient.used, { inverted: true });
    for (const r of memRows) lines.push(paint(r.color, r.text));
  }
  lines.push(paint(theme.dim, formatUptime(cpu.uptime)));

  const right = [];
  if (battery.present) {
    const icon = battery.charging ? "▲" : "▼";
    right.push(chip(`BAT${icon} ${battery.percent}%`));
  }
  right.push(
    rawChip([
      { text: "- ", color: theme.hotkey },
      { text: `${interval}ms`, color: theme.title },
      { text: " +", color: theme.hotkey },
    ]),
  );

  return (
    <Panel
      width={width}
      height={height}
      color={theme.box.cpu}
      title={{
        left: [chip("cpu", { sup: SUP[1] }), chip("menu", { hot: 0 })],
        center: [chip(formatClock(now), { bold: true })],
        right,
      }}
    >
      <Box flexDirection="row">
        <Lines lines={lines} width={graphW} />
        {box && (
          <Box marginLeft={1} flexShrink={0}>
            <CoresBox cpu={cpu} width={box.width} height={box.height} />
          </Box>
        )}
      </Box>
    </Panel>
  );
}
