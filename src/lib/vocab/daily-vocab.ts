import type { VocabItem } from "@/types/vocab";
import { getDueItems, loadVocabStates } from "./vocab-store";

export const DAILY_VOCAB_LIMIT = 10;

/**
 * Returns the cards a user should study today, capped at DAILY_VOCAB_LIMIT.
 * Priority:
 *   1. Items that are due (sorted internally by nextReviewAt asc).
 *   2. If fewer than the limit are due, top-up with new/high-priority items
 *      ordered by studyPriority desc (most AMIRNET-relevant first).
 */
export function getDailyVocabPool(allItems: VocabItem[]): VocabItem[] {
  const due = getDueItems(allItems, DAILY_VOCAB_LIMIT);
  if (due.length >= DAILY_VOCAB_LIMIT) return due;

  const states = loadVocabStates();
  const dueIds = new Set(due.map((v) => v.id));

  const topUpCandidates = allItems
    .filter((v) => !dueIds.has(v.id))
    .sort((a, b) => {
      const sa = states[a.id];
      const sb = states[b.id];
      const masteredA = sa?.masteryScore === 5 ? 1 : 0;
      const masteredB = sb?.masteryScore === 5 ? 1 : 0;
      if (masteredA !== masteredB) return masteredA - masteredB;
      const pa = a.studyPriority ?? 5;
      const pb = b.studyPriority ?? 5;
      return pb - pa;
    });

  return [...due, ...topUpCandidates].slice(0, DAILY_VOCAB_LIMIT);
}

/**
 * Convenience: counts how many items are still due today. Used by widgets
 * that want to display the *pending* number (separately from today's task,
 * which is always exactly DAILY_VOCAB_LIMIT cards).
 */
export function getDailyDueRemaining(allItems: VocabItem[]): number {
  return getDueItems(allItems, allItems.length).length;
}
