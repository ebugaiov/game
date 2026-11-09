import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { loadEnv } from "./load-env";
import * as schema from "./schema";
import { seedData, type BonusQuestionSeed, type QuestionSeed } from "./seed-data";

loadEnv();

const isTest = process.argv.includes("--test");
const connectionString = isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(`${isTest ? "TEST_DATABASE_URL" : "DATABASE_URL"} is not set.`);
}

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

async function upsertQuestionOptions(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  questionId: string,
  question: QuestionSeed | BonusQuestionSeed,
): Promise<void> {
  // Clear the flag first so moving the correct option can never trip the
  // one-correct-option partial unique index mid-update.
  await tx
    .update(schema.questionOptions)
    .set({ isCorrect: false })
    .where(eq(schema.questionOptions.questionId, questionId));

  for (const [position, option] of question.options.entries()) {
    await tx
      .insert(schema.questionOptions)
      .values({
        questionId,
        position,
        text: option.text,
        isCorrect: option.isCorrect,
      })
      .onConflictDoUpdate({
        target: [schema.questionOptions.questionId, schema.questionOptions.position],
        set: { text: option.text, isCorrect: option.isCorrect },
      });
  }
}

try {
  await db.transaction(async (tx) => {
    for (const category of seedData.categories) {
      await tx
        .insert(schema.categories)
        .values(category)
        .onConflictDoUpdate({
          target: schema.categories.id,
          set: {
            name: category.name,
            color: category.color,
            icon: category.icon,
            sortOrder: category.sortOrder,
          },
        });
    }

    const upsertQuestions = async (
      questions: QuestionSeed[] | BonusQuestionSeed[],
      kind: "regular" | "bonus",
    ) => {
      for (const question of questions) {
        const categoryId = "categoryId" in question ? question.categoryId : null;
        const [row] = await tx
          .insert(schema.questions)
          .values({
            seedKey: question.seedKey,
            kind,
            categoryId,
            difficulty: question.difficulty,
            prompt: question.prompt,
            explanation: question.explanation,
          })
          .onConflictDoUpdate({
            target: schema.questions.seedKey,
            set: {
              kind,
              categoryId,
              difficulty: question.difficulty,
              prompt: question.prompt,
              explanation: question.explanation,
            },
          })
          .returning({ id: schema.questions.id });

        if (!row) throw new Error(`Failed to upsert question ${question.seedKey}.`);
        await upsertQuestionOptions(tx, row.id, question);
      }
    };

    await upsertQuestions(seedData.questions, "regular");
    await upsertQuestions(seedData.bonusQuestions, "bonus");
  });

  console.log(
    `Seed complete: ${seedData.categories.length} categories, ` +
      `${seedData.questions.length} questions, ${seedData.bonusQuestions.length} bonus questions.`,
  );
} finally {
  await pool.end();
}
