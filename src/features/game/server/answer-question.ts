import "server-only";

import { and, eq } from "drizzle-orm";
import { games, players, questions, questionOptions, turns } from "@/db/schema";
import { appErrors } from "@/lib/errors";
import { advanceTurn } from "../domain/turn";
import { evaluateEnd } from "../domain/end";
import { RULES } from "../domain/rules";
import { scoreAnswer } from "../domain/scoring";
import type { AnswerResult } from "../schemas";
import { loadGameSnapshot } from "./snapshot";
import { runGameMutation } from "./run-game-mutation";

export type AnswerQuestionInput = {
  gameId: string;
  turnId: string;
  optionId: string;
};

export async function answerQuestion({
  gameId,
  turnId,
  optionId,
}: AnswerQuestionInput): Promise<AnswerResult> {
  return runGameMutation(gameId, async (tx, game) => {
    const [turn] = await tx
      .select()
      .from(turns)
      .where(and(eq(turns.id, turnId), eq(turns.gameId, gameId)))
      .for("update");
    if (!turn) throw appErrors.notFound("Turn not found.");
    if (turn.answeredAt) throw appErrors.turnAlreadyAnswered();

    const [question] = await tx.select().from(questions).where(eq(questions.id, turn.questionId));
    if (!question) throw appErrors.notFound("Question not found.");

    const [option] = await tx
      .select()
      .from(questionOptions)
      .where(and(eq(questionOptions.id, optionId), eq(questionOptions.questionId, question.id)));
    if (!option) throw appErrors.invalidOption();
    if (turn.hiddenOptionIds.includes(option.id)) throw appErrors.invalidOption();

    const [correctOption] = await tx
      .select({ id: questionOptions.id })
      .from(questionOptions)
      .where(and(eq(questionOptions.questionId, question.id), eq(questionOptions.isCorrect, true)))
      .limit(1);
    if (!correctOption) {
      throw new Error(`Question ${question.id} has no correct option.`);
    }

    const [player] = await tx
      .select()
      .from(players)
      .where(eq(players.id, turn.playerId))
      .for("update");
    if (!player) throw appErrors.notFound("Player not found.");

    const isCorrect = option.isCorrect;
    let pointsDelta: number;
    let positionDelta: number;

    if (turn.source === "bonus") {
      pointsDelta = isCorrect ? RULES.bonusReward : 0;
      positionDelta = 0;
    } else {
      const scored = scoreAnswer({
        difficulty: question.difficulty,
        isCorrect,
        usedFiftyFifty: turn.fiftyFiftyUsed,
      });
      pointsDelta = scored.pointsDelta;
      positionDelta = scored.positionDelta;
    }

    await tx
      .update(turns)
      .set({
        answeredAt: new Date(),
        selectedOptionId: option.id,
        isCorrect,
        pointsDelta,
        positionDelta,
      })
      .where(eq(turns.id, turn.id));

    await tx
      .update(players)
      .set({
        score: player.score + pointsDelta,
        position: player.position + positionDelta,
        bonusLeft: turn.source === "bonus" ? Math.max(0, player.bonusLeft - 1) : player.bonusLeft,
      })
      .where(eq(players.id, player.id));

    if (turn.source !== "bonus") {
      const playerRows = await tx
        .select({ seat: players.seat, score: players.score })
        .from(players)
        .where(eq(players.gameId, gameId));

      const advanced = advanceTurn({
        currentSeat: game.currentSeat,
        round: game.round,
        playerCount: playerRows.length,
      });
      const finishReason = evaluateEnd({
        scores: playerRows.map((row) => row.score),
        round: advanced.round,
      });

      await tx
        .update(games)
        .set({
          currentSeat: advanced.currentSeat,
          round: advanced.round,
          ...(finishReason
            ? {
                status: "finished" as const,
                finishedAt: new Date(),
                finishReason,
              }
            : {}),
        })
        .where(eq(games.id, gameId));
    }

    return {
      turnId: turn.id,
      isCorrect,
      correctOptionId: correctOption.id,
      explanation: question.explanation,
      pointsDelta,
      positionDelta,
      game: await loadGameSnapshot(tx, gameId),
    };
  });
}
