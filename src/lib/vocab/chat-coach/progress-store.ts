"use client";

import {
  safeGetItem,
  safeSetItem,
  userKey,
} from "@/lib/storage/user-storage";

const LEGACY_KEY = "amirnet-chat-coach-progress-v1";
const k = () => userKey(LEGACY_KEY);

export interface ChatCoachWordProgress {
  wordId: string;
  timesSeen: number;
  timesCorrect: number;
  timesWrong: number;
  /** Ever produced a wrong/blank/partial outcome (sticky across resets). */
  everFailed: boolean;
  /** Currently flagged for review. Flips true on any miss, false on isKnown. */
  activeWeak: boolean;
  currentStreak: number;
  bestStreak: number;
  lastSeenAt: string;
  lastWrongAt: string | null;
  lastCorrectAt: string | null;
  /** Next time this word is eligible for the Weak queue. ISO. */
  nextReviewAt: string;
  /** True once timesCorrect>=3 AND currentStreak>=3 AND wrongs<=corrects. */
  isKnown: boolean;
}

export type ChatCoachStore = Record<string, ChatCoachWordProgress>;

export function loadChatCoachStore(): ChatCoachStore {
  const raw = safeGetItem(k());
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as ChatCoachStore;
    }
    return {};
  } catch {
    return {};
  }
}

export function saveChatCoachStore(store: ChatCoachStore): void {
  safeSetItem(k(), JSON.stringify(store));
}

export function getOrInitWord(store: ChatCoachStore, wordId: string): ChatCoachWordProgress {
  const existing = store[wordId];
  if (existing) return existing;
  const now = new Date().toISOString();
  return {
    wordId,
    timesSeen: 0,
    timesCorrect: 0,
    timesWrong: 0,
    everFailed: false,
    activeWeak: false,
    currentStreak: 0,
    bestStreak: 0,
    lastSeenAt: now,
    lastWrongAt: null,
    lastCorrectAt: null,
    nextReviewAt: now,
    isKnown: false,
  };
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Compute the next-review schedule for a streak count. 1→1d, 2→3d, 3+→7d. */
export function nextReviewFromStreak(nowIso: string, streak: number): string {
  if (streak <= 1) return addDays(nowIso, 1);
  if (streak === 2) return addDays(nowIso, 3);
  return addDays(nowIso, 7);
}

/** Re-evaluate isKnown after a streak update. */
function recomputeIsKnown(p: ChatCoachWordProgress): boolean {
  return (
    p.timesCorrect >= 3 &&
    p.currentStreak >= 3 &&
    p.timesWrong <= p.timesCorrect
  );
}

export function applyMiss(
  store: ChatCoachStore,
  wordId: string,
  nowIso = new Date().toISOString(),
): ChatCoachWordProgress {
  const cur = getOrInitWord(store, wordId);
  const next: ChatCoachWordProgress = {
    ...cur,
    timesSeen: cur.timesSeen + 1,
    timesWrong: cur.timesWrong + 1,
    everFailed: true,
    activeWeak: true,
    currentStreak: 0,
    lastSeenAt: nowIso,
    lastWrongAt: nowIso,
    nextReviewAt: nowIso,
    isKnown: false,
  };
  store[wordId] = next;
  return next;
}

/**
 * Apply a correct answer. Returns the next progress AND a flag indicating
 * whether isKnown flipped from false → true on this call, so the caller can
 * bridge to unknown-words-store.markKnown exactly once.
 */
export function applyHit(
  store: ChatCoachStore,
  wordId: string,
  nowIso = new Date().toISOString(),
): { next: ChatCoachWordProgress; knownTransition: boolean } {
  const cur = getOrInitWord(store, wordId);
  const newStreak = cur.currentStreak + 1;
  const tentative: ChatCoachWordProgress = {
    ...cur,
    timesSeen: cur.timesSeen + 1,
    timesCorrect: cur.timesCorrect + 1,
    currentStreak: newStreak,
    bestStreak: Math.max(cur.bestStreak, newStreak),
    lastSeenAt: nowIso,
    lastCorrectAt: nowIso,
    nextReviewAt: nextReviewFromStreak(nowIso, newStreak),
  };
  const becameKnown = recomputeIsKnown(tentative);
  const next: ChatCoachWordProgress = {
    ...tentative,
    isKnown: becameKnown,
    // Once known, leave the active-weak flag off so the Weak queue stops
    // serving it. A future miss will flip both back.
    activeWeak: becameKnown ? false : tentative.activeWeak,
  };
  const knownTransition = !cur.isKnown && becameKnown;
  store[wordId] = next;
  return { next, knownTransition };
}

export function clearChatCoachStore(): void {
  safeSetItem(k(), "{}");
}
