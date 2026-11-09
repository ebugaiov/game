import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok", db: "up" });
  } catch (error) {
    console.error("Health check failed", error);
    return Response.json({ status: "error", db: "down" }, { status: 503 });
  }
}
