// Simplified SM-2. Four-button rating like Anki.
//
// Quality mapping:
//   Again = 0  → forgot. reset repetitions; review again today.
//   Hard  = 3  → got it but painful. small interval bump, ease down.
//   Good  = 4  → got it. standard SM-2 progression.
//   Easy  = 5  → trivial. extra interval bump, ease up.
//
// A card is considered mastered when repetitions >= 5 and ease_factor >= 2.5,
// which in practice means ~4 consecutive Good/Easy reviews on a stable card.

export type Quality = 0 | 3 | 4 | 5;

export const QUALITY = {
  Again: 0,
  Hard: 3,
  Good: 4,
  Easy: 5,
} as const;

export interface SrsState {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string; // ISO timestamp
}

export interface SrsInput {
  ease_factor?: number | null;
  interval_days?: number | null;
  repetitions?: number | null;
}

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const MASTERY_REPS = 5;

export function computeNext(prev: SrsInput, quality: Quality, now: Date = new Date()): SrsState {
  const prevEase = prev.ease_factor ?? DEFAULT_EASE;
  const prevReps = prev.repetitions ?? 0;
  const prevInterval = prev.interval_days ?? 0;

  let ease = prevEase;
  let reps: number;
  let intervalDays: number;

  if (quality === QUALITY.Again) {
    reps = 0;
    intervalDays = 0; // same session — re-show soon
    ease = Math.max(MIN_EASE, prevEase - 0.2);
  } else {
    reps = prevReps + 1;

    if (reps === 1) {
      intervalDays = quality === QUALITY.Easy ? 3 : 1;
    } else if (reps === 2) {
      intervalDays = quality === QUALITY.Hard ? 3 : quality === QUALITY.Easy ? 8 : 6;
    } else {
      const base = Math.max(prevInterval, 1);
      const multiplier =
        quality === QUALITY.Hard ? 1.2 : quality === QUALITY.Easy ? ease * 1.3 : ease;
      intervalDays = Math.round(base * multiplier);
    }

    // Ease adjustment per SM-2.
    const q = quality;
    ease = prevEase + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    ease = Math.max(MIN_EASE, ease);
  }

  const nextReview = new Date(now);
  if (intervalDays <= 0) {
    nextReview.setMinutes(nextReview.getMinutes() + 10); // Again → 10 min
  } else {
    nextReview.setDate(nextReview.getDate() + intervalDays);
  }

  return {
    ease_factor: Number(ease.toFixed(3)),
    interval_days: intervalDays,
    repetitions: reps,
    next_review_at: nextReview.toISOString(),
  };
}

export function isMastered(state: Pick<SrsState, "repetitions" | "ease_factor">): boolean {
  return state.repetitions >= MASTERY_REPS && state.ease_factor >= DEFAULT_EASE;
}
