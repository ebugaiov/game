import "server-only";

import { db } from "@/db/client";
import { categories } from "@/db/schema";
import type { CategoryDto } from "../schemas";

export async function listCategories(): Promise<CategoryDto[]> {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      icon: categories.icon,
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .orderBy(categories.sortOrder);
}
