"use client";

import type { VocabItem } from "@/types/vocab";
import { hashString, seededShuffle, todayKey } from "@/lib/vocab/daily-vocab";
import { getCurrentUserId } from "@/lib/storage/user-storage";
import { loadChatCoachStore, type ChatCoachStore } from "./progress-store";

export type ChatCoachMode = "new10" | "weak" | "mixed" | "activeWeak" | "allFailed";

export const BATCH_SIZE = 10;

const DIFFICULTY_RANK: Record<string, number> = {
  medium: 0,
  hard: 1,
  easy: 2,
};

function isUnseen(store: ChatCoachStore, id: string): boolean {
  const s = store[id];
  return !s || s.timesSeen === 0;
}

function seed(mode: ChatCoachMode): number {
  const uid = getCurrentUserId() ?? "anon";
  return hashString(`${uid}|${todayKey()}|${mode}`);
}

/**
 * Return up to BATCH_SIZE items for the requested mode. Deterministic per
 * (user, day, mode) via the same seed pattern as the daily-vocab shuffle.
 */
export function selectBatch(allItems: VocabItem[], mode: ChatCoachMode): VocabItem[] {
  const store = loadChatCoachStore();
  switch (mode) {
    case "new10":
      return selectNew(allItems, store);
    case "weak":
      return selectWeak(allItems, store, { allowFill: true });
    case "activeWeak":
      return selectWeak(allItems, store, { allowFill: false });
    case "mixed":
      return selectMixed(allItems, store);
    case "allFailed":
      return selectAllFailed(allItems, store);
  }
}

function selectNew(allItems: VocabItem[], store: ChatCoachStore): VocabItem[] {
  const pool = allItems.filter((v) => isUnseen(store, v.id));
  // Bucket by (difficulty rank, word length desc-bucket) — selectionseededShuffle
  // happens WITHIN buckets so the harder/longer items reliably surface first
  // each day without becoming totally predictable.
  const buckets = new Map<string, VocabItem[]>();
  for (const v of pool) {
    const dRank = DIFFICULTY_RANK[v.difficulty] ?? 2;
    const lenBucket = v.word.length >= 8 ? 0 : v.word.length >= 5 ? 1 : 2;
    const key = `${dRank}|${lenBucket}`;
    const arr = buckets.get(key);
    if (arr) arr.push(v);
    else buckets.set(key, [v]);
  }
  const baseSeed = seed("new10");
  const sortedKeys = Array.from(buckets.keys()).sort();
  const out: VocabItem[] = [];
  for (const key of sortedKeys) {
    const items = buckets.get(key);
    if (!items) continue;
    out.push(...seededShuffle(items, baseSeed + hashString(key)));
    if (out.length >= BATCH_SIZE) break;
  }
  return out.slice(0, BATCH_SIZE);
}

function selectWeak(
  allItems: VocabItem[],
  store: ChatCoachStore,
  { allowFill }: { allowFill: boolean },
): VocabItem[] {
  const weak = allItems.filter((v) => store[v.id]?.activeWeak === true);
  weak.sort((a, b) => {
    const sa = store[a.id]!;
    const sb = store[b.id]!;
    const na = new Date(sa.nextReviewAt).getTime();
    const nb = new Date(sb.nextReviewAt).getTime();
    if (na !== nb) return na - nb;
    if (sa.timesWrong !== sb.timesWrong) return sb.timesWrong - sa.timesWrong;
    const la = sa.lastWrongAt ? new Date(sa.lastWrongAt).getTime() : 0;
    const lb = sb.lastWrongAt ? new Date(sb.lastWrongAt).getTime() : 0;
    return lb - la;
  });

  if (!allowFill || weak.length >= BATCH_SIZE) return weak.slice(0, BATCH_SIZE);

  const fillNeeded = BATCH_SIZE - weak.length;
  const newPool = selectNew(allItems, store).slice(0, fillNeeded);
  // Dedupe in case (improbably) a word is in both pools.
  const ids = new Set(weak.map((v) => v.id));
  const filtered = newPool.filter((v) => !ids.has(v.id));
  return [...weak, ...filtered].slice(0, BATCH_SIZE);
}

function selectMixed(allItems: VocabItem[], store: ChatCoachStore): VocabItem[] {
  const weakTarget = Math.round(BATCH_SIZE * 0.7); // 7
  const seenCorrectTarget = BATCH_SIZE - weakTarget; // 3

  const weakPool = allItems.filter((v) => store[v.id]?.activeWeak === true);
  const knownPool = allItems.filter((v) => {
    const s = store[v.id];
    return s && !s.activeWeak && s.timesCorrect > 0;
  });

  const baseSeed = seed("mixed");
  const weakSlice = seededShuffle(weakPool, baseSeed).slice(0, weakTarget);
  const knownSlice = seededShuffle(knownPool, baseSeed + 1).slice(0, seenCorrectTarget);

  const out = [...weakSlice, ...knownSlice];
  if (out.length >= BATCH_SIZE) return out.slice(0, BATCH_SIZE);

  // Underfilled — top up from new pool, exactly like the spec said.
  const ids = new Set(out.map((v) => v.id));
  const fill = selectNew(allItems, store).filter((v) => !ids.has(v.id));
  return [...out, ...fill].slice(0, BATCH_SIZE);
}

function selectAllFailed(allItems: VocabItem[], store: ChatCoachStore): VocabItem[] {
  const pool = allItems.filter((v) => store[v.id]?.everFailed === true);
  pool.sort((a, b) => {
    const sa = store[a.id]!;
    const sb = store[b.id]!;
    if (sa.timesWrong !== sb.timesWrong) return sb.timesWrong - sa.timesWrong;
    const la = sa.lastWrongAt ? new Date(sa.lastWrongAt).getTime() : 0;
    const lb = sb.lastWrongAt ? new Date(sb.lastWrongAt).getTime() : 0;
    return lb - la;
  });
  return pool.slice(0, BATCH_SIZE);
}

export interface ChatCoachStats {
  knownCount: number;
  weakCount: number;
  everFailedCount: number;
}

export function getChatCoachStats(): ChatCoachStats {
  const store = loadChatCoachStore();
  let knownCount = 0;
  let weakCount = 0;
  let everFailedCount = 0;
  for (const entry of Object.values(store)) {
    if (entry.isKnown) knownCount++;
    if (entry.activeWeak) weakCount++;
    if (entry.everFailed) everFailedCount++;
  }
  return { knownCount, weakCount, everFailedCount };
}
