import { z } from "zod";
import { loadEnv } from "@/db/load-env";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  TEST_DATABASE_URL: z.url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = {
  databaseUrl: string;
  testDatabaseUrl: string | null;
  nodeEnv: "development" | "test" | "production";
};

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;

  loadEnv();
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${details}`);
  }

  cached = {
    databaseUrl: parsed.data.DATABASE_URL,
    testDatabaseUrl: parsed.data.TEST_DATABASE_URL ?? null,
    nodeEnv: parsed.data.NODE_ENV,
  };
  return cached;
}
