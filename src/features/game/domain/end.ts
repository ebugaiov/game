import { RULES } from "./rules";
import type { FinishReason } from "./types";

export type EvaluateEndInput = {
  scores: readonly number[];
  round: number;
};

export function evaluateEnd({ scores, round }: EvaluateEndInput): FinishReason | null {
  if (scores.some((score) => score >= RULES.winScore)) return "score_target";
  if (round > RULES.maxRounds) return "round_limit";
  return null;
}

export type WinnerCandidate = {
  seat: number;
  score: number;
};

export function pickWinner<Player extends WinnerCandidate>(players: readonly Player[]): Player {
  if (players.length === 0) throw new Error("Cannot pick a winner from an empty player list.");

  return players.reduce((winner, player) => {
    if (player.score > winner.score) return player;
    if (player.score === winner.score && player.seat < winner.seat) return player;
    return winner;
  });
}
