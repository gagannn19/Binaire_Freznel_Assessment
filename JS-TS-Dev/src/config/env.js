import path from "node:path";
import { fileURLToPath } from "node:url";

export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function loadEnv(file = path.join(PROJECT_ROOT, ".env")) {
  try {
    process.loadEnvFile(file);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}
