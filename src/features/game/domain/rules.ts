import type { Difficulty } from "./types";

export const RULES = {
  winScore: 1200,
  maxRounds: 12,
  boardTiles: 20,
  maxPlayers: 20,
  wrongPenalty: 50,
  fiftyFiftyReward: 50,
  bonusReward: 1000,
} as const;

export const BASE_POINTS: Record<Difficulty, number> = {
  easy: 100,
  medium: 150,
  hard: 200,
  expert: 300,
};

export const MOVE_TILES: Record<Difficulty, number> = {
  easy: 1,
  medium: 1,
  hard: 2,
  expert: 2,
};
