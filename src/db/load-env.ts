import { existsSync, readFileSync } from "node:fs";

/**
 * Minimal `.env` loader used by CLI scripts (seed, migrate) and by `getEnv()`.
 * Next.js loads `.env` on its own for the app runtime; this keeps the scripts
 * independent of that behaviour without pulling in another dependency.
 */
export function loadEnv(): void {
  for (const file of [".env", ".env.local"]) {
    if (!existsSync(file)) continue;

    const contents = readFileSync(file, "utf8");
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line.length === 0 || line.startsWith("#")) continue;

      const separator = line.indexOf("=");
      if (separator === -1) continue;

      const key = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}
