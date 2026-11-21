export class History {
  constructor(size) {
    this.size = size;
    this.values = [];
  }

  push(value) {
    this.values.push(Number.isFinite(value) ? value : 0);
    if (this.values.length > this.size) this.values.shift();
  }

  toArray(count = this.values.length) {
    return this.values.slice(-count);
  }

  clear() {
    this.values = [];
  }
}
