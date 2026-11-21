import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export class SessionStore {
  constructor(dir = path.join(os.homedir(), ".config", "binaire-monitor")) {
    this.file = path.join(dir, "session.json");
  }

  load() {
    try {
      return JSON.parse(fs.readFileSync(this.file, "utf8"));
    } catch {
      return {};
    }
  }

  save(data) {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify(data), { mode: 0o600 });
    } catch {
    }
  }
}
