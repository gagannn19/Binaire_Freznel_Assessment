import os from "node:os";
import si from "systeminformation";
import { Collector } from "./Collector.js";
import { History } from "./History.js";

function validTemp(t) {
  return typeof t === "number" && t > 0 && t < 150 ? t : null;
}

export class CpuMonitor extends Collector {
  constructor() {
    super();
    this.history = new History(600);
    this.coreHistory = [];
    this.brand = "CPU";
    this.speed = null;
    this.state = this.build({ currentLoad: 0, cpus: [] }, {}, {});
  }

  async init() {
    const cpu = await si.cpu().catch(() => null);
    if (!cpu) return;
    this.brand = cpu.brand || cpu.manufacturer || "CPU";
    this.speed = cpu.speed || null;
  }

  async collect() {
    const [load, temp, speed] = await Promise.all([
      si.currentLoad(),
      si.cpuTemperature().catch(() => ({})),
      si.cpuCurrentSpeed().catch(() => ({})),
    ]);
    this.state = this.build(load, temp, speed);
  }

  build(load, temp, speed) {
    const total = load.currentLoad ?? 0;
    if (load.cpus.length) this.history.push(total / 100);

    const cores = load.cpus.map((c, i) => {
      if (!this.coreHistory[i]) this.coreHistory[i] = new History(32);
      this.coreHistory[i].push(c.load / 100);
      return { load: c.load, temp: validTemp(temp.cores?.[i]), history: this.coreHistory[i] };
    });

    return {
      brand: this.brand,
      total,
      cores,
      history: this.history,
      temp: validTemp(temp.main),
      ghz: speed.avg || this.speed,
      loadAvg: os.loadavg(),
      uptime: os.uptime(),
    };
  }
}
