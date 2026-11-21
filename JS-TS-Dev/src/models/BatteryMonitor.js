import si from "systeminformation";
import { Collector } from "./Collector.js";

export class BatteryMonitor extends Collector {
  constructor() {
    super(10);
    this.state = { present: false };
  }

  async collect() {
    const b = await si.battery();
    this.state = {
      present: Boolean(b.hasBattery),
      percent: b.percent ?? 0,
      charging: Boolean(b.isCharging),
      ac: Boolean(b.acConnected),
    };
  }
}
