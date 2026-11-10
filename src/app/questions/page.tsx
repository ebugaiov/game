import type { Metadata } from "next";
import { listCategories } from "@/features/game/server/list-categories";
import { listQuestions } from "@/features/game/server/list-questions";
import { QuestionsManager } from "@/features/game/ui/questions-manager";
import { strings } from "@/features/game/ui/strings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: strings.metadata.questionsTitle,
};

export default async function QuestionsPage() {
  const [categories, questions] = await Promise.all([listCategories(), listQuestions()]);

  return <QuestionsManager initialCategories={categories} initialQuestions={questions} />;
}
