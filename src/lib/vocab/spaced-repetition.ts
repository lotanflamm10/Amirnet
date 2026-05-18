export interface VocabReviewState {
  itemId: string;
  masteryScore: number; // 0–5
  timesSeen: number;
  timesKnown: number;
  timesMissed: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  reviewIntervalDays: number;
  starred: boolean;
  needsReview: boolean;
}

// Spaced repetition intervals by mastery score
const INTERVALS: Record<number, number> = {
  0: 0,
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function defaultReviewState(itemId: string): VocabReviewState {
  return {
    itemId,
    masteryScore: 0,
    timesSeen: 0,
    timesKnown: 0,
    timesMissed: 0,
    lastReviewedAt: null,
    nextReviewAt: null,
    reviewIntervalDays: 0,
    starred: false,
    needsReview: false,
  };
}

export function afterKnown(state: VocabReviewState): VocabReviewState {
  const newScore = Math.min(5, state.masteryScore + 1);
  const intervalDays = INTERVALS[newScore] ?? 30;
  return {
    ...state,
    masteryScore: newScore,
    timesSeen: state.timesSeen + 1,
    timesKnown: state.timesKnown + 1,
    lastReviewedAt: new Date().toISOString(),
    nextReviewAt: addDays(intervalDays),
    reviewIntervalDays: intervalDays,
  };
}

export function afterMissed(state: VocabReviewState): VocabReviewState {
  const newScore = Math.max(0, state.masteryScore - 1);
  // Missed: interval 0 (due immediately) or 1 day if score > 0
  const intervalDays = newScore === 0 ? 0 : 1;
  return {
    ...state,
    masteryScore: newScore,
    timesSeen: state.timesSeen + 1,
    timesMissed: state.timesMissed + 1,
    lastReviewedAt: new Date().toISOString(),
    nextReviewAt: addDays(intervalDays),
    reviewIntervalDays: intervalDays,
  };
}

export function isDue(state: VocabReviewState): boolean {
  if (state.nextReviewAt === null) return true;
  return new Date(state.nextReviewAt) <= new Date();
}

export function getProgressLabel(
  masteryScore: number
): "New" | "Learning" | "Strong" | "Mastered" {
  if (masteryScore === 0) return "New";
  if (masteryScore <= 2) return "Learning";
  if (masteryScore <= 4) return "Strong";
  return "Mastered";
}
