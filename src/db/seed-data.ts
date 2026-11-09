import { z } from "zod";
import categoriesJson from "../../data/seed/categories.json";
import bonusQuestionsJson from "../../data/seed/bonus-questions.json";
import questionsJson from "../../data/seed/questions.json";

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const difficultySchema = z.enum(["easy", "medium", "hard", "expert"]);

const optionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

const optionsSchema = z
  .array(optionSchema)
  .length(4)
  .refine((options) => options.filter((option) => option.isCorrect).length === 1, {
    message: "Each question must have exactly one correct option.",
  });

export const categorySeedSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: hexColorSchema,
  icon: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
});

const questionBaseSchema = z.object({
  seedKey: z.string().min(1),
  difficulty: difficultySchema,
  prompt: z.string().min(1),
  explanation: z.string().min(1),
  options: optionsSchema,
});

export const questionSeedSchema = questionBaseSchema.extend({
  categoryId: z.string().min(1),
});

export const bonusQuestionSeedSchema = questionBaseSchema
  .extend({
    difficulty: z.literal("expert"),
  })
  .strict();

export type CategorySeed = z.infer<typeof categorySeedSchema>;
export type QuestionSeed = z.infer<typeof questionSeedSchema>;
export type BonusQuestionSeed = z.infer<typeof bonusQuestionSeedSchema>;

const categories = categorySeedSchema.array().length(12).parse(categoriesJson);
const questions = questionSeedSchema.array().parse(questionsJson);
const bonusQuestions = bonusQuestionSeedSchema.array().parse(bonusQuestionsJson);

const categoryIds = new Set(categories.map((category) => category.id));
if (categoryIds.size !== categories.length) {
  throw new Error("Seed categories contain duplicate ids.");
}

const sortOrders = new Set(categories.map((category) => category.sortOrder));
if (sortOrders.size !== categories.length) {
  throw new Error("Seed categories contain duplicate sort orders.");
}

const seedKeys = new Set<string>();
for (const question of [...questions, ...bonusQuestions]) {
  if (seedKeys.has(question.seedKey)) {
    throw new Error(`Duplicate seed key: ${question.seedKey}`);
  }
  seedKeys.add(question.seedKey);
}

for (const question of questions) {
  if (!categoryIds.has(question.categoryId)) {
    throw new Error(
      `Question ${question.seedKey} references unknown category ${question.categoryId}.`,
    );
  }
}

export const seedData = { categories, questions, bonusQuestions };
