export const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const FINISH_REASONS = ["score_target", "round_limit", "time_up"] as const;
export type FinishReason = (typeof FINISH_REASONS)[number];

export const TURN_SOURCES = ["wheel", "category", "bonus"] as const;
export type TurnSource = (typeof TURN_SOURCES)[number];
