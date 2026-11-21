import si from "systeminformation";
import { Collector } from "./Collector.js";
import { History } from "./History.js";

export class NetworkMonitor extends Collector {
  constructor() {
    super();
    this.interfaces = [];
    this.index = 0;
    this.rxHistory = new History(600);
    this.txHistory = new History(600);
    this.state = this.emptyState();
  }

  async init() {
    const list = await si.networkInterfaces().catch(() => []);
    const defaultName = await si.networkInterfaceDefault().catch(() => null);
    this.interfaces = (Array.isArray(list) ? list : [list])
      .filter((i) => !i.internal && i.operstate !== "down")
      .map((i) => ({ name: i.iface, ip: i.ip4 || i.ip6 || "" }));
    this.index = Math.max(0, this.interfaces.findIndex((i) => i.name === defaultName));
    this.state = this.emptyState();
  }

  get current() {
    return this.interfaces[this.index];
  }

  cycle(step) {
    const count = this.interfaces.length;
    if (count < 2) return;
    this.index = (this.index + step + count) % count;
    this.rxHistory.clear();
    this.txHistory.clear();
    this.state = this.emptyState();
  }

  async collect() {
    if (!this.current) return;
    const [stats] = await si.networkStats(this.current.name);
    if (!stats) return;
    this.rxHistory.push(stats.rx_sec ?? 0);
    this.txHistory.push(stats.tx_sec ?? 0);
    this.state = {
      ...this.emptyState(),
      rx: stats.rx_sec ?? 0,
      tx: stats.tx_sec ?? 0,
      rxTotal: stats.rx_bytes,
      txTotal: stats.tx_bytes,
    };
  }

  emptyState() {
    return {
      iface: this.current?.name ?? "none",
      ip: this.current?.ip ?? "",
      rx: 0,
      tx: 0,
      rxTotal: 0,
      txTotal: 0,
      rxHistory: this.rxHistory,
      txHistory: this.txHistory,
    };
  }
}
