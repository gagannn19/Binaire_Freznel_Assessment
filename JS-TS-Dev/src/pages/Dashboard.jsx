import React, { useMemo, useState } from "react";
import { Box, Text, useApp, useInput, useWindowSize } from "ink";
import { SystemMonitor } from "../models/SystemMonitor.js";
import { ProcessTable, SORT_KEYS, DEFAULT_SORT } from "../models/ProcessTable.js";
import { useSystemSnapshot } from "../hooks/useSystemSnapshot.js";
import { useClock } from "../hooks/useClock.js";
import { useFlash } from "../hooks/useFlash.js";
import { computeLayout, MIN_COLS, MIN_ROWS } from "../utils/layout.js";
import { theme } from "../styles/theme.js";
import { CpuPanel } from "../components/Panels/CpuPanel.jsx";
import { MemPanel } from "../components/Panels/MemPanel.jsx";
import { NetPanel } from "../components/Panels/NetPanel.jsx";
import { ProcPanel, procListHeight } from "../components/Panels/ProcPanel.jsx";
import { HelpMenu } from "../components/Panels/HelpMenu.jsx";

const BOX_KEYS = { 1: "cpu", 2: "mem", 3: "net", 4: "proc" };
const INTERVAL_STEP = 250;

export function Dashboard({ user, onSignOut }) {
  const { exit } = useApp();
  const { columns, rows } = useWindowSize();
  const monitor = useMemo(() => new SystemMonitor(1500), []);
  const snap = useSystemSnapshot(monitor);
  const now = useClock();
  const [flash, showFlash] = useFlash();

  const [boxes, setBoxes] = useState({ cpu: true, mem: true, net: true, proc: true });
  const [menu, setMenu] = useState(false);
  const [procOpts, setProcOpts] = useState({ sortIndex: DEFAULT_SORT, reverse: false, tree: false, filter: "" });
  const [filterEditing, setFilterEditing] = useState(false);
  const [sel, setSel] = useState(-1);
  const [offset, setOffset] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const layout = computeLayout(columns, rows, boxes);
  const procRows = useMemo(() => ProcessTable.build(snap.proc.list, procOpts), [snap.proc, procOpts]);
  const prompt = confirm ? `Send ${confirm.signal} to "${confirm.name}" (pid ${confirm.pid})?  y = yes · n/esc = cancel` : null;
  const listH = layout.proc ? procListHeight(layout.proc.h, { infoOpen, prompt }) : 1;

  const maxSel = procRows.length - 1;
  const curSel = Math.min(sel, maxSel);
  let curOffset = Math.min(offset, Math.max(0, procRows.length - listH));
  if (curSel >= 0 && curSel < curOffset) curOffset = curSel;
  if (curSel >= curOffset + listH) curOffset = curSel - listH + 1;
  curOffset = Math.max(0, curOffset);

  const moveSel = (next) => {
    const s = Math.max(-1, Math.min(maxSel, next));
    setSel(s);
    let o = curOffset;
    if (s >= 0 && s < o) o = s;
    if (s >= o + listH) o = s - listH + 1;
    setOffset(Math.max(0, o));
  };

  const askSignal = (signal) => {
    const entry = procRows[curSel];
    if (!entry) return showFlash({ ok: false, text: "Select a process first (↑/↓)" });
    setConfirm({ pid: entry.proc.pid, name: entry.proc.name, signal });
  };

  const quit = () => {
    monitor.stop();
    exit();
  };

  useInput((input, key) => {
    if (key.ctrl && input === "c") return quit();

    if (confirm) {
      if (input === "y" || input === "Y") {
        const res = monitor.proc.signal(confirm.pid, confirm.signal);
        showFlash({ ok: res.ok, text: res.message });
        setConfirm(null);
      } else if (input === "n" || input === "N" || key.escape) {
        setConfirm(null);
      }
      return;
    }
    if (filterEditing) {
      if (key.return) setFilterEditing(false);
      else if (key.escape) {
        setFilterEditing(false);
        setProcOpts((o) => ({ ...o, filter: "" }));
      } else if (key.backspace || key.delete) setProcOpts((o) => ({ ...o, filter: o.filter.slice(0, -1) }));
      else if (input && !key.ctrl && !key.meta) {
        const clean = input.replace(/[\x00-\x1f\x7f]/g, "");
        if (clean) setProcOpts((o) => ({ ...o, filter: o.filter + clean }));
      }
      moveSel(-1);
      return;
    }
    if (menu) {
      if (input === "q") return quit();
      if (input === "m" || key.escape || key.return) setMenu(false);
      return;
    }

    if (input === "q") return quit();
    if (input === "m") return setMenu(true);
    if (key.escape) {
      if (infoOpen) setInfoOpen(false);
      else moveSel(-1);
      return;
    }
    if (BOX_KEYS[input]) {
      const name = BOX_KEYS[input];
      const next = { ...boxes, [name]: !boxes[name] };
      if (Object.values(next).some(Boolean)) setBoxes(next);
      return;
    }
    if (input === "+" || input === "=") return monitor.setInterval(monitor.interval + INTERVAL_STEP);
    if (input === "-" || input === "_") return monitor.setInterval(monitor.interval - INTERVAL_STEP);
    if (input === "L") return onSignOut();

    if (input === "b" || input === "n") {
      monitor.net.cycle(input === "n" ? 1 : -1);
      return monitor.refresh();
    }

    if (!layout.proc) return;
    if (key.upArrow) return moveSel(curSel <= 0 ? 0 : curSel - 1);
    if (key.downArrow) return moveSel(curSel + 1);
    if (key.pageUp) return moveSel(curSel - listH);
    if (key.pageDown) return moveSel(Math.max(0, curSel) + listH);
    if (key.home) return moveSel(0);
    if (key.end) return moveSel(maxSel);
    if (key.leftArrow || key.rightArrow) {
      const d = key.rightArrow ? 1 : -1;
      return setProcOpts((o) => ({ ...o, sortIndex: (o.sortIndex + d + SORT_KEYS.length) % SORT_KEYS.length }));
    }
    if (input === "r") return setProcOpts((o) => ({ ...o, reverse: !o.reverse }));
    if (input === "e") return setProcOpts((o) => ({ ...o, tree: !o.tree }));
    if (input === "f") return setFilterEditing(true);
    if (input === "i" || key.return) {
      if (curSel < 0) moveSel(0);
      return setInfoOpen((v) => !v);
    }
    if (input === "t") return askSignal("SIGTERM");
    if (input === "k") return askSignal("SIGKILL");
  });

  if (layout.tooSmall) {
    return (
      <Box width={columns} height={rows} flexDirection="column" alignItems="center" justifyContent="center">
        <Text color={theme.title} bold>Terminal size too small</Text>
        <Text color={theme.text}>
          Width = <Text color={columns < MIN_COLS ? theme.error : theme.ok}>{columns}</Text> Height ={" "}
          <Text color={rows < MIN_ROWS ? theme.error : theme.ok}>{rows}</Text>
        </Text>
        <Text color={theme.dim}>Needed for current config: {MIN_COLS} x {MIN_ROWS}</Text>
      </Box>
    );
  }

  const procView = {
    rows: procRows,
    total: snap.proc.total,
    sel: curSel,
    offset: curOffset,
    opts: procOpts,
    filterEditing,
    prompt,
    infoOpen,
    status: flash,
  };

  const mem = layout.mem && <MemPanel width={layout.mem.w} height={layout.mem.h} snap={snap} />;
  const net = layout.net && <NetPanel width={layout.net.w} height={layout.net.h} snap={snap} />;
  const proc = layout.proc && <ProcPanel width={layout.proc.w} height={layout.proc.h} view={procView} />;

  return (
    <Box width={columns} height={rows} flexDirection="column">
      {layout.cpu.h > 0 && (
        <CpuPanel width={columns} height={layout.cpu.h} snap={snap} now={now} />
      )}
      {layout.mode === "wide" ? (
        <Box flexDirection="row">
          {(mem || net) && (
            <Box flexDirection="column">
              {mem}
              {net}
            </Box>
          )}
          {proc}
        </Box>
      ) : (
        <Box flexDirection="column">
          <Box flexDirection="row">
            {mem}
            {net}
          </Box>
          {proc}
        </Box>
      )}
      {menu && <HelpMenu width={columns} height={rows} user={user} />}
    </Box>
  );
}
