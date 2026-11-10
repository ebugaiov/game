import { listCategories } from "@/features/game/server/list-categories";
import { route } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = route(async () => Response.json(await listCategories()));
