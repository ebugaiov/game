import { notFound } from "next/navigation";
import { getGameSnapshot } from "@/features/game/server/get-game-snapshot";
import { listCategories } from "@/features/game/server/list-categories";
import { gameIdSchema } from "@/features/game/schemas";
import { GameBoard } from "@/features/game/ui/game-board";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

type GamePageProps = {
  params: Promise<{ id: string }>;
};

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params;
  const parsedId = gameIdSchema.safeParse(id);
  if (!parsedId.success) notFound();

  const [snapshot, categories] = await Promise.all([
    getGameSnapshot(parsedId.data),
    listCategories(),
  ]).catch((error: unknown) => {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  });

  return <GameBoard initialSnapshot={snapshot} categories={categories} />;
}
