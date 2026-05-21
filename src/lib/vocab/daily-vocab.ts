import type { VocabItem } from "@/types/vocab";
import { getDueItems, loadVocabStates } from "./vocab-store";

export const DAILY_VOCAB_LIMIT = 10;

/**
 * Tiny deterministic PRNG (mulberry32). Used to shuffle the daily vocab
 * top-up pool with a seed that is stable for a single day (so refreshing
 * mid-session does not scramble the order) but rotates each day so a new
 * user does not see the same A-Z-looking list every visit.
 */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns YYYY-MM-DD for today in the user's local timezone, used as a
 * stable per-day seed.
 */
function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const a = [...items];
  const rand = mulberry32(seed || 1);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Returns the cards a user should study today, capped at DAILY_VOCAB_LIMIT.
 * Priority:
 *   1. Items that are due (sorted internally by nextReviewAt asc).
 *   2. If fewer than the limit are due, top-up with new/high-priority items.
 *      We bucket by studyPriority (desc) and shuffle WITHIN each bucket with
 *      a per-day seed. Without the shuffle, the seed JSON's alphabetical
 *      order leaks through — new users see "abbreviate, abdomen, ability,
 *      …" which feels mechanical and discouraging.
 */
export function getDailyVocabPool(allItems: VocabItem[]): VocabItem[] {
  const due = getDueItems(allItems, DAILY_VOCAB_LIMIT);
  if (due.length >= DAILY_VOCAB_LIMIT) return due;

  const states = loadVocabStates();
  const dueIds = new Set(due.map((v) => v.id));
  const seed = hashString(todayKey());

  // Bucket remaining items by (mastered, studyPriority). Within each bucket
  // the order is randomized using today's seed.
  const buckets = new Map<string, VocabItem[]>();
  for (const v of allItems) {
    if (dueIds.has(v.id)) continue;
    const mastered = states[v.id]?.masteryScore === 5 ? 1 : 0;
    const priority = v.studyPriority ?? 5;
    const key = `${mastered}|${priority}`;
    const arr = buckets.get(key);
    if (arr) arr.push(v);
    else buckets.set(key, [v]);
  }

  // Sort bucket KEYS: not mastered first (mastered=0), then highest priority.
  const sortedKeys = Array.from(buckets.keys()).sort((a, b) => {
    const [ma, pa] = a.split("|").map(Number);
    const [mb, pb] = b.split("|").map(Number);
    if (ma !== mb) return ma - mb;
    return pb - pa;
  });

  const topUpCandidates: VocabItem[] = [];
  for (const key of sortedKeys) {
    const items = buckets.get(key);
    if (!items) continue;
    topUpCandidates.push(...seededShuffle(items, seed + hashString(key)));
  }

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
