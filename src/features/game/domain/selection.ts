import type { Difficulty } from "./types";

export type QuestionCandidate = {
  id: string;
  difficulty: Difficulty;
};

export type SelectQuestionInput<Candidate extends QuestionCandidate> = {
  candidates: readonly Candidate[];
  usedIds: ReadonlySet<string>;
  filter: Difficulty | null;
  rng: () => number;
};

function pickRandom<Candidate>(candidates: readonly Candidate[], rng: () => number): Candidate {
  const index = Math.min(candidates.length - 1, Math.floor(rng() * candidates.length));
  return candidates[Math.max(0, index)]!;
}

/**
 * Three-step fallback from the original game:
 *   1. category + difficulty filter, unused
 *   2. category, any difficulty, unused
 *   3. category, any difficulty (reuse)
 */
export function selectQuestion<Candidate extends QuestionCandidate>({
  candidates,
  usedIds,
  filter,
  rng,
}: SelectQuestionInput<Candidate>): Candidate | null {
  const inCategory = candidates;

  if (filter !== null) {
    const filtered = inCategory.filter(
      (candidate) => candidate.difficulty === filter && !usedIds.has(candidate.id),
    );
    if (filtered.length > 0) return pickRandom(filtered, rng);
  }

  const unused = inCategory.filter((candidate) => !usedIds.has(candidate.id));
  if (unused.length > 0) return pickRandom(unused, rng);

  if (inCategory.length > 0) return pickRandom(inCategory, rng);
  return null;
}
