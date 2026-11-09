import { execFileSync } from "node:child_process";
import { loadEnv } from "../src/db/load-env";

export default function setup() {
  loadEnv();

  if (!process.env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL must be set to run the integration tests.");
  }

  const env = {
    ...process.env,
    DATABASE_URL: process.env.TEST_DATABASE_URL,
  };

  execFileSync("pnpm", ["db:migrate:test"], { stdio: "inherit", env });
  execFileSync("pnpm", ["db:seed:test"], { stdio: "inherit", env });
}
