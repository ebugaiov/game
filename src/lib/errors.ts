export const ERROR_CODES = [
  "validation_error",
  "invalid_option",
  "not_found",
  "game_finished",
  "pending_turn_exists",
  "no_pending_turn",
  "turn_already_answered",
  "bonus_exhausted",
  "time_not_elapsed",
  "no_questions_available",
  "internal_error",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, status: number, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export const appErrors = {
  validation: (message = "The request is invalid.") =>
    new AppError("validation_error", 400, message),
  invalidOption: () => new AppError("invalid_option", 400, "The selected option is not valid."),
  notFound: (message = "The requested resource was not found.") =>
    new AppError("not_found", 404, message),
  gameFinished: () => new AppError("game_finished", 409, "The game has already finished."),
  pendingTurnExists: () =>
    new AppError("pending_turn_exists", 409, "A question is already waiting for an answer."),
  noPendingTurn: () => new AppError("no_pending_turn", 409, "There is no pending turn."),
  turnAlreadyAnswered: () =>
    new AppError("turn_already_answered", 409, "The turn has already been answered."),
  bonusExhausted: () =>
    new AppError("bonus_exhausted", 409, "The player has no bonus question left."),
  timeNotElapsed: () =>
    new AppError("time_not_elapsed", 409, "The match timer has not run out yet."),
  noQuestionsAvailable: () =>
    new AppError("no_questions_available", 409, "No question is available for this category."),
} as const;
