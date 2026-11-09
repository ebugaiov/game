export type AdvanceTurnInput = {
  currentSeat: number;
  round: number;
  playerCount: number;
};

export type AdvanceTurnResult = {
  currentSeat: number;
  round: number;
};

export function advanceTurn({
  currentSeat,
  round,
  playerCount,
}: AdvanceTurnInput): AdvanceTurnResult {
  if (playerCount < 1) throw new Error("A game needs at least one player.");

  const nextSeat = (currentSeat + 1) % playerCount;
  return {
    currentSeat: nextSeat,
    round: nextSeat === 0 ? round + 1 : round,
  };
}
