import React from "react";
import { Box, Text } from "ink";
import { Panel, Lines } from "../Layout/Panel.jsx";
import { chip, rawChip, SUP } from "../Layout/chips.js";
import { theme } from "../../styles/theme.js";
import { paint, meter } from "../../utils/ansi.js";
import { pick } from "../../utils/gradient.js";
import { sparkline } from "../../utils/graph.js";
import { formatBytes, pad, truncate } from "../../utils/format.js";
import { SORT_KEYS } from "../../models/ProcessTable.js";

export const INFO_HEIGHT = 6;

export function procListHeight(height, { infoOpen, prompt }) {
  return Math.max(1, height - 2 - 1 - (infoOpen ? INFO_HEIGHT : 0) - (prompt ? 1 : 0));
}

function columns(w) {
  const c = { pid: 7, mem: 6, cpu: 6, graph: w >= 56 ? 5 : 0, user: w >= 72 ? 10 : 0 };
  const fixed = c.pid + 1 + c.mem + 1 + c.cpu + (c.graph ? c.graph + 1 : 0) + (c.user ? c.user + 1 : 0);
  const rest = Math.max(4, w - fixed);
  c.program = rest >= 34 ? Math.min(22, Math.max(14, Math.round(rest * 0.32))) : rest;
  c.command = rest >= 34 ? rest - c.program - 1 : 0;
  return c;
}

function header(c, sortId) {
  const h = (label, width, id, align) => {
    const text = pad(label, width, align);
    return id === sortId ? paint(theme.hotkey, text) : paint(theme.title, text);
  };
  let s = h("Pid:", c.pid, "pid", "right") + " " + h("Program:", c.program, "program");
  if (c.command) s += " " + h("Command:", c.command, "command");
  if (c.user) s += " " + h("User:", c.user, "user");
  s += " " + h("MemB", c.mem, "memory", "right");
  s += " " + h("Cpu%", c.cpu + (c.graph ? c.graph + 1 : 0), "cpu", "right");
  return s;
}

function row(entry, c) {
  const p = entry.proc;
  const cpu = p.cpu;
  const cpuS = cpu >= 100 ? cpu.toFixed(0) : cpu.toFixed(1);
  let s = paint(theme.graphText, pad(String(p.pid), c.pid, "right")) + " ";
  s += paint(theme.dim, entry.prefix) + paint(theme.title, pad(p.name, c.program - entry.prefix.length));
  if (c.command) s += " " + paint(theme.graphText, pad(p.command, c.command));
  if (c.user) s += " " + paint(theme.text, pad(p.user, c.user));
  s += " " + paint(theme.text, pad(formatBytes(p.memBytes, { short: true }), c.mem, "right"));
  if (c.graph) {
    const hist = p.history.toArray(c.graph).map((v) => Math.min(1, v));
    s += " " + sparkline(hist, c.graph, theme.gradient.process);
  }
  s += " " + paint(pick(theme.gradient.process, Math.min(1, cpu / 100)), pad(cpuS, c.cpu - 1, "right"));
  return s;
}

function InfoBox({ entry, width }) {
  const w = width - 2;
  if (!entry) {
    return (
      <Panel width={width} height={INFO_HEIGHT} color={theme.box.proc} title={{ left: [chip("info", { hot: 0 })] }}>
        <Text color={theme.dim}>Select a process with ↑/↓ to see details.</Text>
      </Panel>
    );
  }
  const p = entry.proc;
  const cpu = p.cpu;
  const kv = (k, v) => paint(theme.dim, k) + paint(theme.title, v);
  const half = Math.floor(w / 2);
  const lines = [
    `${kv("Status: ", p.state || "?")}   ${kv("User: ", truncate(p.user, 16))}   ${kv("Parent: ", String(p.ppid))}   ${kv("Started: ", p.started)}`,
    paint(theme.dim, "CPU ") + meter(Math.min(100, cpu), Math.max(4, half - 12), theme.gradient.process) +
      paint(theme.title, ` ${cpu.toFixed(1)}%`.padEnd(8)) +
      paint(theme.dim, " MEM ") + meter(p.memPct, Math.max(4, half - 20), theme.gradient.used) +
      paint(theme.title, ` ${formatBytes(p.memBytes)}`),
    paint(theme.dim, "CMD ") + paint(theme.text, truncate(p.command, w * 2 - 4).slice(0, w - 4)),
    paint(theme.text, "    " + truncate(p.command, w * 2 - 4).slice(w - 4)),
  ];
  return (
    <Panel
      width={width}
      height={INFO_HEIGHT}
      color={theme.box.proc}
      title={{ left: [chip("info", { hot: 0 }), chip(`${p.name} (${p.pid})`, { bold: true })] }}
    >
      <Lines lines={lines} width={w} />
    </Panel>
  );
}

export function ProcPanel({ width, height, view }) {
  const { rows, total, sel, offset, opts, filterEditing, prompt, infoOpen, status } = view;
  const innerW = width - 2;
  const listH = procListHeight(height, { infoOpen, prompt });
  const c = columns(innerW);
  const sortKey = SORT_KEYS[opts.sortIndex];
  const selected = sel >= 0 ? rows[sel] : null;

  const filterChip = filterEditing || opts.filter
    ? rawChip([
        { text: "f", color: theme.hotkey },
        { text: "ilter: ", color: theme.title },
        { text: truncate(opts.filter, Math.max(4, innerW - 60)), color: theme.warn },
        { text: filterEditing ? "█" : "", color: theme.title },
      ])
    : chip("filter", { hot: 0 });

  const body = [];
  for (let i = 0; i < listH; i++) {
    const idx = offset + i;
    const entry = rows[idx];
    if (!entry) {
      body.push(<Text key={i}> </Text>);
      continue;
    }
    const line = row(entry, c);
    body.push(
      idx === sel ? (
        <Text key={i} wrap="truncate" backgroundColor={theme.selectedBg} bold>
          {line + " ".repeat(Math.max(0, innerW))}
        </Text>
      ) : (
        <Text key={i} wrap="truncate">
          {line}
        </Text>
      ),
    );
  }

  const footerRight = [chip(`${sel + 1}/${rows.length}${rows.length !== total ? ` (${total})` : ""}`)];
  const footerLeft = status
    ? [chip(status.text, { color: status.ok ? theme.ok : theme.error })]
    : [
        rawChip([
          { text: "↑ ", color: theme.hotkey },
          { text: "select", color: theme.title },
          { text: " ↓", color: theme.hotkey },
        ]),
        chip("info", { hot: 0, active: sel >= 0 }),
        chip("terminate", { hot: 0, active: sel >= 0 }),
        chip("kill", { hot: 0, active: sel >= 0 }),
      ];

  return (
    <Panel
      width={width}
      height={height}
      color={theme.box.proc}
      title={{
        left: [chip("proc", { sup: SUP[4] }), filterChip],
        right: [
          chip("reverse", { hot: 0, active: opts.reverse }),
          chip("tree", { hot: 3, active: opts.tree }),
          rawChip([
            { text: "< ", color: theme.hotkey },
            { text: sortKey.label, color: theme.title },
            { text: " >", color: theme.hotkey },
          ]),
        ],
      }}
      footer={{ left: footerLeft, right: footerRight }}
    >
      {infoOpen && <InfoBox entry={selected} width={innerW} />}
      {prompt && (
        <Text wrap="truncate" backgroundColor={theme.selectedBg} color={theme.selectedFg} bold>
          {pad(` ${prompt}`, innerW)}
        </Text>
      )}
      <Text wrap="truncate">{header(c, sortKey.id)}</Text>
      <Box flexDirection="column">{body}</Box>
    </Panel>
  );
}
