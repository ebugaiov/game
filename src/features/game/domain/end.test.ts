import { describe, expect, it } from "vitest";
import { evaluateEnd, pickWinner } from "../domain/end";

describe("evaluateEnd", () => {
  it("ends at the win score", () => {
    expect(evaluateEnd({ scores: [0, 1200, 50], round: 2 })).toBe("score_target");
  });

  it("ends when the round counter passes 12", () => {
    expect(evaluateEnd({ scores: [10, 20], round: 13 })).toBe("round_limit");
    expect(evaluateEnd({ scores: [10, 20], round: 12 })).toBeNull();
  });

  it("prefers the score target over the round limit", () => {
    expect(evaluateEnd({ scores: [1200], round: 13 })).toBe("score_target");
  });

  it("does not end below both thresholds", () => {
    expect(evaluateEnd({ scores: [1199, 0], round: 12 })).toBeNull();
  });
});

describe("pickWinner", () => {
  it("picks the highest score", () => {
    const winner = pickWinner([
      { id: "a", seat: 0, score: 400 },
      { id: "b", seat: 1, score: 900 },
      { id: "c", seat: 2, score: 100 },
    ]);
    expect(winner.id).toBe("b");
  });

  it("breaks ties by the lowest seat", () => {
    const winner = pickWinner([
      { id: "a", seat: 2, score: 500 },
      { id: "b", seat: 0, score: 500 },
      { id: "c", seat: 1, score: 500 },
    ]);
    expect(winner.id).toBe("b");
  });

  it("handles negative scores", () => {
    const winner = pickWinner([
      { id: "a", seat: 0, score: -100 },
      { id: "b", seat: 1, score: -50 },
    ]);
    expect(winner.id).toBe("b");
  });

  it("rejects an empty list", () => {
    expect(() => pickWinner([])).toThrow();
  });
});
