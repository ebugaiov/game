import { describe, expect, it } from "vitest";
import { advanceTurn } from "../domain/turn";

describe("advanceTurn", () => {
  it("moves to the next seat without changing the round", () => {
    expect(advanceTurn({ currentSeat: 1, round: 3, playerCount: 4 })).toEqual({
      currentSeat: 2,
      round: 3,
    });
  });

  it("wraps to seat 0 and increments the round", () => {
    expect(advanceTurn({ currentSeat: 3, round: 3, playerCount: 4 })).toEqual({
      currentSeat: 0,
      round: 4,
    });
  });

  it("advances the round every turn in a one-player game", () => {
    expect(advanceTurn({ currentSeat: 0, round: 1, playerCount: 1 })).toEqual({
      currentSeat: 0,
      round: 2,
    });
  });

  it("rejects an empty game", () => {
    expect(() => advanceTurn({ currentSeat: 0, round: 1, playerCount: 0 })).toThrow();
  });
});
