import { describe, expect, it } from "vitest";
import { selectQuestion, type QuestionCandidate } from "../domain/selection";

type Candidate = QuestionCandidate & { label: string };

const candidates: Candidate[] = [
  { id: "easy-used", difficulty: "easy", label: "easy used" },
  { id: "easy-fresh", difficulty: "easy", label: "easy fresh" },
  { id: "hard-fresh", difficulty: "hard", label: "hard fresh" },
];

const first = () => 0;

describe("selectQuestion", () => {
  it("prefers an unused question matching the difficulty filter", () => {
    const result = selectQuestion({
      candidates,
      usedIds: new Set(["easy-used"]),
      filter: "easy",
      rng: first,
    });
    expect(result?.id).toBe("easy-fresh");
  });

  it("falls back to any unused question in the category", () => {
    const result = selectQuestion({
      candidates,
      usedIds: new Set(["easy-used", "easy-fresh"]),
      filter: "easy",
      rng: first,
    });
    expect(result?.id).toBe("hard-fresh");
  });

  it("reuses a question when every candidate has been used", () => {
    const result = selectQuestion({
      candidates,
      usedIds: new Set(candidates.map((candidate) => candidate.id)),
      filter: "easy",
      rng: first,
    });
    expect(result?.id).toBe("easy-used");
  });

  it("skips the difficulty step when the filter is null", () => {
    const result = selectQuestion({
      candidates,
      usedIds: new Set(["easy-used"]),
      filter: null,
      rng: first,
    });
    expect(result?.id).toBe("easy-fresh");
  });

  it("returns null when the category has no questions at all", () => {
    const result = selectQuestion({
      candidates: [],
      usedIds: new Set(),
      filter: null,
      rng: first,
    });
    expect(result).toBeNull();
  });

  it("uses the injected rng for a uniform choice", () => {
    const result = selectQuestion({
      candidates,
      usedIds: new Set(),
      filter: null,
      rng: () => 0.99,
    });
    expect(result?.id).toBe("hard-fresh");
  });
});
