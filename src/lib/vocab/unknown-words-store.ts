import type {
  UnknownWord,
  UnknownWordSource,
  UnknownWordStatus,
} from "@/types/unknown-words";

const STORAGE_KEY = "amirnet-unknown-words-v1";

/** Normalize a word or phrase to a stable id (lowercase, single-space, trim). */
export function normalizeWordKey(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function load(): Record<string, UnknownWord> {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, UnknownWord>;
    }
    return {};
  } catch {
    return {};
  }
}

function save(state: Record<string, UnknownWord>): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded — fail silently.
  }
}

export interface AddUnknownWordInput {
  word: string;
  translation: string;
  source?: UnknownWordSource;
  status?: UnknownWordStatus;
}

/**
 * Insert (or dedupe-update) an unknown word. Returns the stored entry.
 * If an entry with the same id already exists, only `translation` is
 * refreshed (to allow improved lookups) and `reviewCount` is incremented.
 */
export function addUnknownWord(input: AddUnknownWordInput): UnknownWord {
  const id = normalizeWordKey(input.word);
  if (!id) {
    return {
      id: "",
      word: input.word,
      translation: input.translation,
      source: input.source ?? "manual",
      addedAt: new Date().toISOString(),
      status: input.status ?? "unknown",
      reviewCount: 0,
    };
  }
  const state = load();
  const now = new Date().toISOString();
  const existing = state[id];

  const next: UnknownWord = existing
    ? {
        ...existing,
        translation: input.translation || existing.translation,
        reviewCount: existing.reviewCount + 1,
        status: input.status ?? existing.status,
        lastReviewedAt: now,
      }
    : {
        id,
        word: input.word.trim(),
        translation: input.translation,
        source: input.source ?? "manual",
        addedAt: now,
        status: input.status ?? "unknown",
        reviewCount: 0,
      };

  state[id] = next;
  save(state);
  return next;
}

export function markKnown(id: string): void {
  const state = load();
  const entry = state[id];
  if (!entry) return;
  state[id] = {
    ...entry,
    status: "known",
    reviewCount: entry.reviewCount + 1,
    lastReviewedAt: new Date().toISOString(),
  };
  save(state);
}

export function markUnknown(id: string): void {
  const state = load();
  const entry = state[id];
  if (!entry) return;
  state[id] = {
    ...entry,
    status: "unknown",
    lastReviewedAt: new Date().toISOString(),
  };
  save(state);
}

export function removeUnknownWord(id: string): void {
  const state = load();
  if (!state[id]) return;
  delete state[id];
  save(state);
}

/** Returns all entries, most recently added first. */
export function listUnknownWords(): UnknownWord[] {
  const state = load();
  return Object.values(state).sort((a, b) => {
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });
}

/** Returns just the entries that are still flagged as unknown. */
export function listOnlyUnknown(): UnknownWord[] {
  return listUnknownWords().filter((w) => w.status === "unknown");
}

export function hasUnknownWord(word: string): boolean {
  const id = normalizeWordKey(word);
  if (!id) return false;
  return Boolean(load()[id]);
}

export function getUnknownWord(word: string): UnknownWord | null {
  const id = normalizeWordKey(word);
  if (!id) return null;
  return load()[id] ?? null;
}

export function clearAllUnknownWords(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}
