import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { loadEnv } from "./load-env";

loadEnv();

const isTest = process.argv.includes("--test");
const connectionString = isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(`${isTest ? "TEST_DATABASE_URL" : "DATABASE_URL"} is not set.`);
}

const pool = new Pool({ connectionString });

try {
  const db = drizzle(pool);
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "src/db/migrations"),
  });
  console.log(`Migrations applied to ${isTest ? "test" : "main"} database.`);
} finally {
  await pool.end();
}
