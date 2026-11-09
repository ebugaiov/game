import { describe, expect, it } from "vitest";
import { BASE_POINTS, MOVE_TILES, RULES } from "../domain/rules";
import { scoreAnswer } from "../domain/scoring";
import { DIFFICULTIES } from "../domain/types";

describe("scoreAnswer", () => {
  it.each(DIFFICULTIES)(
    "awards the base points and movement for a correct %s answer",
    (difficulty) => {
      expect(scoreAnswer({ difficulty, isCorrect: true, usedFiftyFifty: false })).toEqual({
        pointsDelta: BASE_POINTS[difficulty],
        positionDelta: MOVE_TILES[difficulty],
      });
    },
  );

  it.each(DIFFICULTIES)(
    "awards a flat 50 and the normal movement when 50/50 was used (%s)",
    (difficulty) => {
      expect(scoreAnswer({ difficulty, isCorrect: true, usedFiftyFifty: true })).toEqual({
        pointsDelta: RULES.fiftyFiftyReward,
        positionDelta: MOVE_TILES[difficulty],
      });
    },
  );

  it.each(DIFFICULTIES)("penalises a wrong %s answer with -50 and no movement", (difficulty) => {
    expect(scoreAnswer({ difficulty, isCorrect: false, usedFiftyFifty: false })).toEqual({
      pointsDelta: -RULES.wrongPenalty,
      positionDelta: 0,
    });
  });

  it("keeps the wrong-answer penalty even after 50/50", () => {
    expect(scoreAnswer({ difficulty: "hard", isCorrect: false, usedFiftyFifty: true })).toEqual({
      pointsDelta: -50,
      positionDelta: 0,
    });
  });

  it("matches the legacy point table", () => {
    expect(BASE_POINTS).toEqual({ easy: 100, medium: 150, hard: 200, expert: 300 });
    expect(MOVE_TILES).toEqual({ easy: 1, medium: 1, hard: 2, expert: 2 });
  });
});
