import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { categories } from "@/db/schema";
import { createQuestionSchema, type CreateQuestionInput } from "../schemas";
import { createQuestion } from "./create-question";
import { deactivateQuestion } from "./deactivate-question";
import { listQuestions } from "./list-questions";
import { createTestGame, drawTestQuestion } from "../../../../tests/helpers";

const TEST_CATEGORY_ID = "test_kategori";

const OPTION_TEXTS = [
  "Igår svarvade han axeln.",
  "Igår han svarvade axeln.",
  "Igår svarvade axeln han.",
  "Han igår svarvade axeln.",
];

function buildOptions(correctIndex = 0) {
  return OPTION_TEXTS.map((text, index) => ({ text, isCorrect: index === correctIndex }));
}

type RegularQuestionInput = Extract<CreateQuestionInput, { kind: "regular" }>;

function regularQuestion(overrides: Partial<RegularQuestionInput> = {}): RegularQuestionInput {
  return {
    kind: "regular",
    categoryId: "huvudsats",
    difficulty: "medium",
    prompt: "Vilken mening följer V2-regeln?",
    explanation: "Det finita verbet står på andra plats.",
    options: buildOptions(1),
    ...overrides,
  };
}

async function cleanup(): Promise<void> {
  await db.execute(sql`truncate table "games" cascade`);
  await db.execute(sql`delete from "questions" where "seed_key" is null`);
  await db.execute(sql`delete from "categories" where "id" = ${TEST_CATEGORY_ID}`);
}

beforeEach(async () => {
  await cleanup();
});

afterEach(async () => {
  await cleanup();
});

describe("question authoring", () => {
  it("creates a regular question with four options and lists it as user-authored", async () => {
    const created = await createQuestion(regularQuestion());

    expect(created.origin).toBe("user");
    expect(created.kind).toBe("regular");
    expect(created.categoryId).toBe("huvudsats");
    expect(created.isActive).toBe(true);
    expect(created.options.map((option) => option.position)).toEqual([0, 1, 2, 3]);
    expect(created.options.filter((option) => option.isCorrect)).toHaveLength(1);
    expect(created.options[1]?.isCorrect).toBe(true);

    const listed = await listQuestions();
    expect(listed.some((question) => question.id === created.id)).toBe(true);
  });

  it("creates a bonus question without a category", async () => {
    const created = await createQuestion({
      kind: "bonus",
      difficulty: "expert",
      prompt: "Vilken form är passiv supinum?",
      explanation: "Passiv supinum slutar på -ts.",
      options: buildOptions(2),
    });

    expect(created.kind).toBe("bonus");
    expect(created.categoryId).toBeNull();
    expect(created.difficulty).toBe("expert");
    expect(created.origin).toBe("user");
  });

  it("rejects an unknown category", async () => {
    await expect(
      createQuestion(regularQuestion({ categoryId: "finns_inte" })),
    ).rejects.toMatchObject({ code: "not_found", status: 404 });
  });

  it("retires a question so it disappears from the list", async () => {
    const created = await createQuestion(regularQuestion());

    const retired = await deactivateQuestion(created.id);
    expect(retired.isActive).toBe(false);

    const listed = await listQuestions();
    expect(listed.some((question) => question.id === created.id)).toBe(false);

    // Idempotent: retiring twice is not an error.
    await expect(deactivateQuestion(created.id)).resolves.toMatchObject({ isActive: false });
  });

  it("returns not_found when retiring an unknown question", async () => {
    await expect(deactivateQuestion("00000000-0000-4000-8000-000000000000")).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    });
  });

  it("draws a newly created question from its category", async () => {
    await db.insert(categories).values({
      id: TEST_CATEGORY_ID,
      name: "Testkategori",
      color: "#123456",
      icon: "🧪",
      sortOrder: 99,
    });

    const created = await createQuestion(
      regularQuestion({ categoryId: TEST_CATEGORY_ID, difficulty: "easy" }),
    );

    const game = await createTestGame();
    const drawn = await drawTestQuestion(game.id, TEST_CATEGORY_ID);

    expect(drawn.pendingTurn?.question.id).toBe(created.id);
    expect(drawn.pendingTurn?.question.options).toHaveLength(4);

    // A pending snapshot must never leak the answer or the explanation.
    const serialized = JSON.stringify(drawn);
    expect(serialized).not.toContain("isCorrect");
    expect(serialized).not.toContain("explanation");
  });
});

describe("createQuestionSchema", () => {
  it("accepts a valid regular question", () => {
    expect(createQuestionSchema.safeParse(regularQuestion()).success).toBe(true);
  });

  it("accepts a valid bonus question", () => {
    expect(
      createQuestionSchema.safeParse({
        kind: "bonus",
        difficulty: "expert",
        prompt: "Fråga?",
        explanation: "Förklaring.",
        options: buildOptions(3),
      }).success,
    ).toBe(true);
  });

  it.each([
    {
      label: "zero correct options",
      options: buildOptions(0).map((option) => ({ ...option, isCorrect: false })),
    },
    {
      label: "two correct options",
      options: buildOptions(0).map((option, index) => ({ ...option, isCorrect: index < 2 })),
    },
    { label: "three options", options: buildOptions(0).slice(0, 3) },
    {
      label: "five options",
      options: [...buildOptions(0), { text: "Femte", isCorrect: false }],
    },
  ])("rejects $label", ({ options }) => {
    expect(createQuestionSchema.safeParse(regularQuestion({ options })).success).toBe(false);
  });

  it("rejects a bonus question with a category", () => {
    expect(
      createQuestionSchema.safeParse({
        kind: "bonus",
        difficulty: "expert",
        categoryId: "huvudsats",
        prompt: "Fråga?",
        explanation: "Förklaring.",
        options: buildOptions(0),
      }).success,
    ).toBe(false);
  });

  it("rejects a bonus question that is not expert level", () => {
    expect(
      createQuestionSchema.safeParse({
        kind: "bonus",
        difficulty: "hard",
        prompt: "Fråga?",
        explanation: "Förklaring.",
        options: buildOptions(0),
      }).success,
    ).toBe(false);
  });

  it("rejects blank text", () => {
    expect(
      createQuestionSchema.safeParse(regularQuestion({ prompt: "   ", options: buildOptions(0) }))
        .success,
    ).toBe(false);
  });
});
