import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { industrinsPool?: Pool };

const pool =
  globalForDb.industrinsPool ??
  new Pool({
    connectionString: getEnv().databaseUrl,
    max: 3,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.industrinsPool = pool;
}

export const db = drizzle(pool, { schema });

export type Database = typeof db;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type DbOrTx = Database | Transaction;
