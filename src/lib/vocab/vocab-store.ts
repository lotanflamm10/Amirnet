import type { VocabItem } from "@/types/vocab";
import {
  VocabReviewState,
  defaultReviewState,
  afterKnown,
  afterMissed,
  isDue,
} from "./spaced-repetition";
import { userKey, safeGetItem, safeSetItem } from "@/lib/storage/user-storage";

const LEGACY_KEY = "amirnet-vocab-v1";
const k = () => userKey(LEGACY_KEY);

export function loadVocabStates(): Record<string, VocabReviewState> {
  const raw = safeGetItem(k());
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, VocabReviewState>;
  } catch {
    return {};
  }
}

export function saveVocabStates(
  states: Record<string, VocabReviewState>
): void {
  safeSetItem(k(), JSON.stringify(states));
}

export function getOrCreateState(itemId: string): VocabReviewState {
  const states = loadVocabStates();
  if (states[itemId]) return states[itemId];
  return defaultReviewState(itemId);
}

export function markKnown(itemId: string): void {
  const states = loadVocabStates();
  const current = states[itemId] ?? defaultReviewState(itemId);
  states[itemId] = afterKnown(current);
  saveVocabStates(states);
}

export function markMissed(itemId: string): void {
  const states = loadVocabStates();
  const current = states[itemId] ?? defaultReviewState(itemId);
  states[itemId] = afterMissed(current);
  saveVocabStates(states);
}

export function restoreState(itemId: string, state: VocabReviewState): void {
  const states = loadVocabStates();
  states[itemId] = state;
  saveVocabStates(states);
}

export function toggleStar(itemId: string): void {
  const states = loadVocabStates();
  const current = states[itemId] ?? defaultReviewState(itemId);
  states[itemId] = { ...current, starred: !current.starred };
  saveVocabStates(states);
}

export function getDueItems(
  allItems: VocabItem[],
  limit = 20
): VocabItem[] {
  const states = loadVocabStates();
  const due = allItems.filter((item) => {
    const state = states[item.id] ?? defaultReviewState(item.id);
    return isDue(state);
  });
  // Sort by nextReviewAt ascending (nulls first = new items first)
  due.sort((a, b) => {
    const sa = states[a.id];
    const sb = states[b.id];
    const na = sa?.nextReviewAt ? new Date(sa.nextReviewAt).getTime() : 0;
    const nb = sb?.nextReviewAt ? new Date(sb.nextReviewAt).getTime() : 0;
    return na - nb;
  });
  return due.slice(0, limit);
}

export function getStarredItems(allItems: VocabItem[]): VocabItem[] {
  const states = loadVocabStates();
  return allItems.filter((item) => {
    const state = states[item.id];
    return state?.starred === true;
  });
}

export function getWeakItems(allItems: VocabItem[]): VocabItem[] {
  const states = loadVocabStates();
  return allItems.filter((item) => {
    const state = states[item.id];
    if (!state) return false;
    return state.timesSeen >= 3 && state.timesMissed > state.timesKnown;
  });
}

// Words missed at least once — used for "study list" feature
export function getMissedItems(allItems: VocabItem[]): VocabItem[] {
  const states = loadVocabStates();
  return allItems
    .filter((item) => (states[item.id]?.timesMissed ?? 0) > 0)
    .sort((a, b) => (states[b.id]?.timesMissed ?? 0) - (states[a.id]?.timesMissed ?? 0));
}

export function getVocabStats(allItems: VocabItem[]): {
  total: number;
  mastered: number;
  learning: number;
  newCount: number;
  dueCount: number;
  starredCount: number;
  weakCount: number;
} {
  const states = loadVocabStates();
  let mastered = 0;
  let learning = 0;
  let newCount = 0;
  let dueCount = 0;
  let starredCount = 0;
  let weakCount = 0;

  for (const item of allItems) {
    const state = states[item.id] ?? defaultReviewState(item.id);
    if (state.masteryScore === 5) mastered++;
    else if (state.masteryScore >= 1) learning++;
    else newCount++;
    if (isDue(state)) dueCount++;
    if (state.starred) starredCount++;
    if (state.timesSeen >= 3 && state.timesMissed > state.timesKnown) weakCount++;
  }

  return {
    total: allItems.length,
    mastered,
    learning,
    newCount,
    dueCount,
    starredCount,
    weakCount,
  };
}

export type { VocabReviewState };
