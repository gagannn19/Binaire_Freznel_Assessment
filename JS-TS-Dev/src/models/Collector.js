export class Collector {
  constructor(every = 1) {
    this.every = every;
    this.busy = false;
    this.state = null;
  }

  async init() {}

  async collect() {}

  async run(tick) {
    if (this.busy || tick % this.every !== 0) return;
    this.busy = true;
    try {
      await this.collect();
    } catch {
    } finally {
      this.busy = false;
    }
  }
}
