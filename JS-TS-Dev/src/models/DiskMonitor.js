import path from "node:path";
import si from "systeminformation";
import { Collector } from "./Collector.js";
import { History } from "./History.js";

const HIDDEN_MOUNT = /^(\/System\/Volumes\/(?!Data$)|\/private\/var\/vm|\/dev|\/proc|\/sys|\/run|\/snap\/|\/boot\/efi)/;
const HIDDEN_TYPE = /^(tmpfs|devtmpfs|overlay|squashfs|autofs|devfs|nullfs)$/i;
const FS_EVERY = 5;

export class DiskMonitor extends Collector {
  constructor() {
    super();
    this.readHistory = new History(600);
    this.writeHistory = new History(600);
    this.disks = [];
    this.count = 0;
    this.state = { disks: [], read: null, write: null, readHistory: this.readHistory, writeHistory: this.writeHistory };
  }

  async collect() {
    const needSizes = this.count++ % FS_EVERY === 0;
    const [sizes, io] = await Promise.all([
      needSizes ? si.fsSize() : null,
      si.fsStats().catch(() => null),
    ]);
    if (sizes) this.disks = DiskMonitor.normalize(sizes);
    const read = io?.rx_sec ?? null;
    const write = io?.wx_sec ?? null;
    if (read != null) this.readHistory.push(read);
    if (write != null) this.writeHistory.push(write);
    this.state = { disks: this.disks, read, write, readHistory: this.readHistory, writeHistory: this.writeHistory };
  }

  static normalize(list) {
    const seen = new Set();
    const out = [];
    const sorted = [...list].sort((a, b) => (a.mount === "/" ? -1 : b.mount === "/" ? 1 : 0));
    for (const d of sorted) {
      if (!d.size || HIDDEN_MOUNT.test(d.mount) || HIDDEN_TYPE.test(d.type || "")) continue;
      const key = `${d.size}:${d.available}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const used = Math.max(0, d.size - d.available);
      out.push({
        name: d.mount === "/" ? "root" : path.basename(d.mount) || d.mount,
        mount: d.mount,
        size: d.size,
        used,
        free: d.available,
        usedPct: (used / d.size) * 100,
      });
    }
    return out;
  }
}
