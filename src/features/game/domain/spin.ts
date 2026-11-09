const TAU = Math.PI * 2;
const POINTER_ANGLE = -Math.PI / 2;
const DURATION_MS = 4800;

export type ComputeSpinInput = {
  currentAngle: number;
  sliceCount: number;
  rng: () => number;
};

export type SpinResult = {
  targetSlice: number;
  totalRotation: number;
  durationMs: number;
};

export function computeSpin({ currentAngle, sliceCount, rng }: ComputeSpinInput): SpinResult {
  if (!Number.isInteger(sliceCount) || sliceCount < 1) {
    throw new Error("The wheel needs at least one slice.");
  }

  const sliceAngle = TAU / sliceCount;
  const targetSlice = Math.min(sliceCount - 1, Math.floor(rng() * sliceCount));
  const sliceOffset = (0.2 + rng() * 0.6) * sliceAngle;
  const desiredFinalAngleBase = POINTER_ANGLE - (targetSlice * sliceAngle + sliceOffset);

  const currentMod = currentAngle % TAU;
  let diff = (desiredFinalAngleBase - currentMod) % TAU;
  if (diff <= 0) diff += TAU;

  const extraTurns = (5 + Math.floor(rng() * 4)) * TAU;

  return {
    targetSlice,
    totalRotation: extraTurns + diff,
    durationMs: DURATION_MS,
  };
}

/** Which slice is under the top pointer at the given wheel angle. */
export function sliceAtPointer({
  angle,
  sliceCount,
}: {
  angle: number;
  sliceCount: number;
}): number {
  if (!Number.isInteger(sliceCount) || sliceCount < 1) {
    throw new Error("The wheel needs at least one slice.");
  }

  const sliceAngle = TAU / sliceCount;
  const relative = (POINTER_ANGLE - angle) % TAU;
  const positive = (relative + TAU) % TAU;
  return Math.floor(positive / sliceAngle) % sliceCount;
}
