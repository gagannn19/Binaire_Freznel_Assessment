import si from "systeminformation";
import { Collector } from "./Collector.js";
import { History } from "./History.js";

const PROTECTED_PIDS = new Set([0, 1, process.pid]);

export class ProcessMonitor extends Collector {
  constructor() {
    super();
    this.cpuHistory = new Map();
    this.state = { list: [], total: 0 };
  }

  async collect() {
    const { list } = await si.processes();
    const alive = new Set();
    const procs = list.map((p) => {
      alive.add(p.pid);
      let hist = this.cpuHistory.get(p.pid);
      if (!hist) {
        hist = new History(16);
        this.cpuHistory.set(p.pid, hist);
      }
      hist.push((p.cpu || 0) / 100);
      const bin = p.path && !p.command.startsWith("/") ? `${p.path.replace(/\/$/, "")}/${p.command}` : p.command;
      return {
        pid: p.pid,
        ppid: p.parentPid,
        name: p.name || p.command || "?",
        command: [bin, p.params].filter(Boolean).join(" "),
        user: p.user || "",
        state: p.state || "",
        started: p.started || "",
        cpu: p.cpu || 0,
        memPct: p.mem || 0,
        memBytes: (p.memRss || 0) * 1024,
        history: hist,
      };
    });
    for (const pid of this.cpuHistory.keys()) {
      if (!alive.has(pid)) this.cpuHistory.delete(pid);
    }
    this.state = { list: procs, total: procs.length };
  }

  signal(pid, signal = "SIGTERM") {
    if (PROTECTED_PIDS.has(pid)) {
      return { ok: false, message: `Refusing to signal protected pid ${pid}` };
    }
    try {
      process.kill(pid, signal);
      return { ok: true, message: `Sent ${signal} to pid ${pid}` };
    } catch (err) {
      const why = err.code === "EPERM" ? "permission denied" : err.code === "ESRCH" ? "no such process" : err.message;
      return { ok: false, message: `${signal} to ${pid} failed: ${why}` };
    }
  }
}
