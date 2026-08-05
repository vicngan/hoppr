import { TAG_OPPOSITES, type Tag } from './tags';

/** One recorded answer, used to avoid repeats and to explain the profile. */
export type AnswerRecord = {
  questionId: string;
  optionId: string;
  at: number;
};

/**
 * The learning core. `weights` maps a tag → confidence in [-1, 1] that the user
 * leans toward it. Everything else (rankings, next questions, the You screen)
 * derives from this.
 */
export type TasteProfile = {
  weights: Partial<Record<Tag, number>>;
  answers: AnswerRecord[];
};

export const emptyProfile = (): TasteProfile => ({ weights: {}, answers: [] });

const clamp = (n: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, n));

/** Learning rate — how far one answer can move a tag. */
const LR = 0.34;

/**
 * Apply an option's tag deltas to the profile (immutably). Positive deltas move
 * a tag up; its opposite (if any) is gently pushed the other way so the profile
 * stays coherent (liking "quiet" implies disliking "lively").
 */
export function applyDeltas(
  profile: TasteProfile,
  deltas: Partial<Record<Tag, number>>,
  record: AnswerRecord,
): TasteProfile {
  const weights = { ...profile.weights };
  for (const [tag, delta] of Object.entries(deltas) as [Tag, number][]) {
    weights[tag] = clamp((weights[tag] ?? 0) + delta * LR);
    const opp = TAG_OPPOSITES[tag];
    if (opp && deltas[opp] == null) {
      weights[opp] = clamp((weights[opp] ?? 0) - delta * LR * 0.6);
    }
  }
  return { weights, answers: [...profile.answers, record] };
}

/** Sorted, thresholded traits for display ("what we're fairly sure of"). */
export function confidentTraits(profile: TasteProfile, min = 0.12) {
  return (Object.entries(profile.weights) as [Tag, number][])
    .filter(([, w]) => w >= min)
    .sort((a, b) => b[1] - a[1]);
}

/**
 * How well a place's tags line up with the profile, as a normalized 0..1 fit.
 * Averages the profile weight over the place's tags, then maps [-1,1] → [0,1].
 */
export function tasteFit(profile: TasteProfile, placeTags: Tag[]): number {
  if (placeTags.length === 0) return 0.5;
  let sum = 0;
  for (const t of placeTags) sum += profile.weights[t] ?? 0;
  const avg = sum / placeTags.length;
  return (avg + 1) / 2;
}

/** Whether we've learned anything yet (drives empty-state copy). */
export function hasSignal(profile: TasteProfile): boolean {
  return profile.answers.length > 0;
}
