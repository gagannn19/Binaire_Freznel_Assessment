import si from "systeminformation";
import { Collector } from "./Collector.js";
import { History } from "./History.js";

export class MemoryMonitor extends Collector {
  constructor() {
    super();
    this.history = new History(600);
    this.state = null;
  }

  async collect() {
    const m = await si.mem();
    const used = m.total - m.available;
    this.history.push(m.total ? used / m.total : 0);
    this.state = {
      total: m.total,
      used,
      available: m.available,
      cached: m.buffcache || m.cached || 0,
      free: m.free,
      swapTotal: m.swaptotal,
      swapUsed: m.swapused,
      swapFree: m.swapfree,
      history: this.history,
    };
  }
}
