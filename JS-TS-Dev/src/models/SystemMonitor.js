import { EventEmitter } from "node:events";
import { CpuMonitor } from "./CpuMonitor.js";
import { MemoryMonitor } from "./MemoryMonitor.js";
import { DiskMonitor } from "./DiskMonitor.js";
import { NetworkMonitor } from "./NetworkMonitor.js";
import { BatteryMonitor } from "./BatteryMonitor.js";
import { ProcessMonitor } from "./ProcessMonitor.js";

const MIN_INTERVAL = 250;
const MAX_INTERVAL = 10000;

export class SystemMonitor extends EventEmitter {
  constructor(interval = 1500) {
    super();
    this.cpu = new CpuMonitor();
    this.mem = new MemoryMonitor();
    this.disk = new DiskMonitor();
    this.net = new NetworkMonitor();
    this.battery = new BatteryMonitor();
    this.proc = new ProcessMonitor();
    this.collectors = [this.cpu, this.mem, this.disk, this.net, this.battery, this.proc];
    this.interval = interval;
    this.tick = 0;
    this.timer = null;
    this.running = false;
  }

  async start() {
    if (this.running) return;
    this.running = true;
    await Promise.allSettled(this.collectors.map((c) => c.init()));
    if (this.running) this.loop();
  }

  stop() {
    this.running = false;
    clearTimeout(this.timer);
  }

  setInterval(ms) {
    this.interval = Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, ms));
    this.refresh();
  }

  refresh() {
    this.emit("update", this.snapshot());
  }

  async loop() {
    const started = Date.now();
    await Promise.allSettled(this.collectors.map((c) => c.run(this.tick)));
    this.tick++;
    if (!this.running) return;
    this.refresh();
    const wait = Math.max(50, this.interval - (Date.now() - started));
    this.timer = setTimeout(() => this.loop(), wait);
  }

  snapshot() {
    return {
      interval: this.interval,
      cpu: this.cpu.state,
      mem: this.mem.state,
      disk: this.disk.state,
      net: this.net.state,
      battery: this.battery.state,
      proc: this.proc.state,
    };
  }
}
