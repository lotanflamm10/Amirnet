import type { VocabItem } from "@/types/vocab";
import { loadVocabStates } from "./vocab-store";
import { getCurrentUserId } from "@/lib/storage/user-storage";

export const DAILY_VOCAB_LIMIT = 10;

/**
 * Tiny deterministic PRNG (mulberry32). Used to shuffle the daily vocab
 * top-up pool with a seed that is stable for a single day (so refreshing
 * mid-session does not scramble the order) but rotates each day so a new
 * user does not see the same A-Z-looking list every visit.
 *
 * Also exported so the swipe trainer can apply the same per-user/per-day
 * shuffle to the cold-start pool (no SRS state) without re-implementing
 * the math.
 */
export function mulberry32(seed: number): () => number {
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
export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
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
 *
 * Two distinct "due" buckets:
 *   • TRULY due — items whose SRS schedule has an explicit `nextReviewAt`
 *     in the past. These represent the user's real review queue and are
 *     served first, in oldest-overdue order (returning users see their
 *     normal SRS order).
 *   • NEW / unseen — items with no SRS state (or null `nextReviewAt`).
 *     For a brand-new user this is essentially the entire vocab corpus.
 *     We shuffle these with a per-user/per-day seed so the cold-start deck
 *     doesn't read as a long alphabetical "a*" run.
 *
 * The two buckets are concatenated (truly-due first, then shuffled new)
 * and sliced to DAILY_VOCAB_LIMIT. If the user has ≥10 truly-due items,
 * the new-item shuffle never fires — exactly the "returning user keeps
 * normal order" contract.
 */
export function getDailyVocabPool(
  allItems: VocabItem[],
  userId?: string | null,
): VocabItem[] {
  const states = loadVocabStates();
  const now = Date.now();

  // Truly-due: explicit nextReviewAt that has already passed. Sort
  // oldest-overdue first so the SRS spirit is preserved for return visits.
  const trulyDue: VocabItem[] = [];
  for (const item of allItems) {
    const state = states[item.id];
    if (!state?.nextReviewAt) continue;
    const t = new Date(state.nextReviewAt).getTime();
    if (Number.isFinite(t) && t <= now) trulyDue.push(item);
  }
  trulyDue.sort((a, b) => {
    const ta = new Date(states[a.id]!.nextReviewAt!).getTime();
    const tb = new Date(states[b.id]!.nextReviewAt!).getTime();
    return ta - tb;
  });

  if (trulyDue.length >= DAILY_VOCAB_LIMIT) {
    return trulyDue.slice(0, DAILY_VOCAB_LIMIT);
  }

  // Top-up: items with no SRS state at all OR null nextReviewAt. These are
  // the "new to me" cards. Bucket by (mastered, studyPriority) and shuffle
  // WITHIN each bucket using a per-user/per-day seed. Without the seed
  // every visitor on the same day would see the same deck; without the
  // user component every user would see the same deck on the same day.
  const dueIds = new Set(trulyDue.map((v) => v.id));
  const uid = userId ?? getCurrentUserId() ?? "anon";
  const baseSeed = hashString(`${uid}|${todayKey()}`);

  const buckets = new Map<string, VocabItem[]>();
  for (const v of allItems) {
    if (dueIds.has(v.id)) continue;
    const state = states[v.id];
    // Skip items that are scheduled in the future — they're not due yet.
    if (state?.nextReviewAt) {
      const t = new Date(state.nextReviewAt).getTime();
      if (Number.isFinite(t) && t > now) continue;
    }
    const mastered = state?.masteryScore === 5 ? 1 : 0;
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
    topUpCandidates.push(...seededShuffle(items, baseSeed + hashString(key)));
  }

  return [...trulyDue, ...topUpCandidates].slice(0, DAILY_VOCAB_LIMIT);
}

/**
 * Convenience: counts how many items are still pending today. This is the
 * union of truly-due items + unseen/new items — i.e. anything `isDue` would
 * still return for. Used by widgets that want a "pending" stat.
 */
export function getDailyDueRemaining(allItems: VocabItem[]): number {
  const states = loadVocabStates();
  const now = Date.now();
  let count = 0;
  for (const item of allItems) {
    const state = states[item.id];
    if (!state) { count++; continue; }
    if (!state.nextReviewAt) { count++; continue; }
    const t = new Date(state.nextReviewAt).getTime();
    if (Number.isFinite(t) && t <= now) count++;
  }
  return count;
}
