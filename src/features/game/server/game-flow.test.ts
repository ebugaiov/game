import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MOVE_TILES, RULES } from "../domain/rules";
import { adjustScore } from "./adjust-score";
import { answerQuestion } from "./answer-question";
import { drawBonus } from "./draw-bonus";
import { finishGame } from "./finish-game";
import { getGameSnapshot } from "./get-game-snapshot";
import { useFiftyFifty } from "./use-fifty-fifty";
import {
  correctOptionId,
  createTestGame,
  drawTestQuestion,
  expireGame,
  resetGames,
} from "../../../../tests/helpers";

beforeEach(async () => {
  await resetGames();
});

afterEach(async () => {
  await resetGames();
});

describe("game flow", () => {
  it("creates, draws, uses 50/50, answers correctly and advances the turn", async () => {
    const created = await createTestGame();

    expect(created.status).toBe("in_progress");
    expect(created.currentSeat).toBe(0);
    expect(created.round).toBe(1);
    expect(created.players).toHaveLength(2);
    expect(created.pendingTurn).toBeNull();

    const drawn = await drawTestQuestion(created.id);
    const pending = drawn.pendingTurn;
    expect(pending).not.toBeNull();
    if (!pending) throw new Error("Expected a pending turn.");

    expect(pending.source).toBe("category");
    expect(pending.playerId).toBe(created.players[0]!.id);
    expect(pending.hiddenOptionIds).toEqual([]);
    expect(pending.question.options).toHaveLength(4);

    const fiftyFifty = await useFiftyFifty({ gameId: created.id, turnId: pending.id });
    const hidden = fiftyFifty.pendingTurn?.hiddenOptionIds ?? [];
    expect(hidden).toHaveLength(2);

    const correctId = await correctOptionId(pending.question.id);
    expect(hidden).not.toContain(correctId);

    const result = await answerQuestion({
      gameId: created.id,
      turnId: pending.id,
      optionId: correctId,
    });

    expect(result.isCorrect).toBe(true);
    expect(result.correctOptionId).toBe(correctId);
    expect(result.explanation.length).toBeGreaterThan(0);
    expect(result.pointsDelta).toBe(RULES.fiftyFiftyReward);
    expect(result.positionDelta).toBe(MOVE_TILES[pending.question.difficulty]);

    expect(result.game.currentSeat).toBe(1);
    expect(result.game.round).toBe(1);
    expect(result.game.pendingTurn).toBeNull();

    const playerOne = result.game.players.find((player) => player.seat === 0);
    expect(playerOne?.score).toBe(RULES.fiftyFiftyReward);
    expect(playerOne?.position).toBe(MOVE_TILES[pending.question.difficulty]);
  });

  it("rejects drawing a question while a turn is already pending", async () => {
    const created = await createTestGame();
    await drawTestQuestion(created.id);

    await expect(drawTestQuestion(created.id, "masterclass")).rejects.toMatchObject({
      code: "pending_turn_exists",
      status: 409,
    });
  });

  it("finalizes an expired game as time_up and persists it before rejecting", async () => {
    const created = await createTestGame();
    const drawn = await drawTestQuestion(created.id);
    const pending = drawn.pendingTurn;
    if (!pending) throw new Error("Expected a pending turn.");

    await expireGame(created.id);

    await expect(
      answerQuestion({
        gameId: created.id,
        turnId: pending.id,
        optionId: await correctOptionId(pending.question.id),
      }),
    ).rejects.toMatchObject({ code: "game_finished", status: 409 });

    const after = await getGameSnapshot(created.id);
    expect(after.status).toBe("finished");
    expect(after.finish?.reason).toBe("time_up");
  });

  it("lets exactly one of two concurrent answers to the same turn succeed", async () => {
    const created = await createTestGame();
    const drawn = await drawTestQuestion(created.id);
    const pending = drawn.pendingTurn;
    if (!pending) throw new Error("Expected a pending turn.");

    const optionId = await correctOptionId(pending.question.id);
    const attempts = await Promise.allSettled([
      answerQuestion({ gameId: created.id, turnId: pending.id, optionId }),
      answerQuestion({ gameId: created.id, turnId: pending.id, optionId }),
    ]);

    const fulfilled = attempts.filter((attempt) => attempt.status === "fulfilled");
    const rejected = attempts.filter((attempt) => attempt.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const rejection = rejected[0] as PromiseRejectedResult;
    expect(rejection.reason).toMatchObject({ code: "turn_already_answered", status: 409 });
  });

  it("never sends the correct option or the explanation before an answer", async () => {
    const created = await createTestGame();
    const drawn = await drawTestQuestion(created.id);
    const pending = drawn.pendingTurn;
    if (!pending) throw new Error("Expected a pending turn.");

    const serialized = JSON.stringify(drawn.pendingTurn);
    expect(serialized).not.toContain("isCorrect");
    expect(serialized).not.toContain("explanation");

    for (const option of pending.question.options) {
      expect(Object.keys(option).sort()).toEqual(["id", "position", "text"]);
    }
  });

  it("awards the bonus reward without moving, advancing or ending the game", async () => {
    const created = await createTestGame({ players: ["Sven Svarvare", "Gunnar Gjutare"] });
    await adjustScore({
      gameId: created.id,
      playerId: created.players[0]!.id,
      newScore: RULES.winScore,
    });

    const drawn = await drawBonus({ gameId: created.id });
    const pending = drawn.pendingTurn;
    if (!pending) throw new Error("Expected a pending bonus turn.");
    expect(pending.source).toBe("bonus");
    expect(pending.question.kind).toBe("bonus");

    const result = await answerQuestion({
      gameId: created.id,
      turnId: pending.id,
      optionId: await correctOptionId(pending.question.id),
    });

    expect(result.isCorrect).toBe(true);
    expect(result.pointsDelta).toBe(RULES.bonusReward);
    expect(result.positionDelta).toBe(0);

    const scorer = result.game.players.find((player) => player.seat === 0);
    expect(scorer?.score).toBe(RULES.winScore + RULES.bonusReward);
    expect(scorer?.position).toBe(0);
    expect(scorer?.bonusLeft).toBe(0);

    // Quirk preserved: the end check does not run after a bonus answer.
    expect(result.game.status).toBe("in_progress");
    expect(result.game.currentSeat).toBe(0);
    expect(result.game.round).toBe(1);
  });

  it("runs the end check after the next regular answer", async () => {
    const created = await createTestGame({ players: ["Sven Svarvare", "Gunnar Gjutare"] });
    await adjustScore({
      gameId: created.id,
      playerId: created.players[0]!.id,
      newScore: RULES.winScore,
    });

    const drawn = await drawTestQuestion(created.id);
    const pending = drawn.pendingTurn;
    if (!pending) throw new Error("Expected a pending turn.");

    const result = await answerQuestion({
      gameId: created.id,
      turnId: pending.id,
      optionId: await correctOptionId(pending.question.id),
    });

    expect(result.game.status).toBe("finished");
    expect(result.game.finish?.reason).toBe("score_target");
  });

  it("rejects finishing before the timer has elapsed and keeps the game running", async () => {
    const created = await createTestGame({ timeLimitMinutes: 10 });
    const drawn = await drawTestQuestion(created.id);

    await expect(finishGame({ gameId: created.id })).rejects.toMatchObject({
      code: "time_not_elapsed",
      status: 409,
    });

    const after = await getGameSnapshot(created.id);
    expect(after.status).toBe("in_progress");
    expect(after.pendingTurn?.id).toBe(drawn.pendingTurn?.id);
  });
});
