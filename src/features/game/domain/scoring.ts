import { BASE_POINTS, MOVE_TILES, RULES } from "./rules";
import type { Difficulty } from "./types";

export type ScoreAnswerInput = {
  difficulty: Difficulty;
  isCorrect: boolean;
  usedFiftyFifty: boolean;
};

export type ScoreAnswerResult = {
  pointsDelta: number;
  positionDelta: number;
};

export function scoreAnswer({
  difficulty,
  isCorrect,
  usedFiftyFifty,
}: ScoreAnswerInput): ScoreAnswerResult {
  if (!isCorrect) {
    return { pointsDelta: -RULES.wrongPenalty, positionDelta: 0 };
  }

  return {
    pointsDelta: usedFiftyFifty ? RULES.fiftyFiftyReward : BASE_POINTS[difficulty],
    positionDelta: MOVE_TILES[difficulty],
  };
}
