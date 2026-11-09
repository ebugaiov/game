import { loadEnv } from "../src/db/load-env";

loadEnv();

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL must be set to run the integration tests.");
}

// The app's db client reads DATABASE_URL; tests always point it at the test DB.
process.env.DATABASE_URL = testDatabaseUrl;
