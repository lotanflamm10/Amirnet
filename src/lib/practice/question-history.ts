/**
 * Global question history tracker — prevents repetition across all modes.
 * Stores seen question IDs, sentence hashes, answer patterns, and vocab words in localStorage.
 */

const HISTORY_KEY   = "amirnet-qhistory-v1";
const MAX_RECENT    = 100;  // soft-filter rolling window
const MAX_SIM_SEEN  = 2000; // all questions ever seen in simulation
const MAX_PRACTICE  = 500;  // recent practice questions

interface HistoryState {
  recent:           string[];  // ring buffer, newest first
  simSeen:          string[];  // all IDs seen in any simulation
  practiceSeen:     string[];  // recent IDs seen in practice/challenge/review
  sentenceHashes:   string[];  // recent normalized sentence hashes (last 30)
  answerPattern:    number[];  // last 15 answer indices (for pattern detection)
  recentVocabWords: string[];  // last 10 target vocabulary words (no same word within 5 Q)
}

function emptyHistory(): HistoryState {
  return { recent: [], simSeen: [], practiceSeen: [], sentenceHashes: [], answerPattern: [], recentVocabWords: [] };
}

export function loadHistory(): HistoryState {
  if (typeof window === "undefined") return emptyHistory();
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw
      ? { ...emptyHistory(), ...(JSON.parse(raw) as Partial<HistoryState>) }
      : emptyHistory();
  } catch {
    return emptyHistory();
  }
}

function saveHistory(h: HistoryState): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch { /* quota */ }
}

/** Normalize question text to a short hash for similarity detection. */
export function hashSentence(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 10)
    .join(" ");
}

/** Record a question as seen. Call after each question is answered. */
export function recordSeen(
  id: string,
  mode: "simulation" | "practice",
  sentenceText: string,
  answerIndex: number,
  vocabWords?: string[]
): void {
  const h = loadHistory();

  h.recent = [id, ...h.recent.filter(x => x !== id)].slice(0, MAX_RECENT);

  if (mode === "simulation") {
    if (!h.simSeen.includes(id)) {
      h.simSeen = [...h.simSeen, id].slice(-MAX_SIM_SEEN);
    }
  } else {
    h.practiceSeen = [id, ...h.practiceSeen.filter(x => x !== id)].slice(0, MAX_PRACTICE);
  }

  const hash = hashSentence(sentenceText);
  h.sentenceHashes = [hash, ...h.sentenceHashes].slice(0, 30);

  h.answerPattern = [...h.answerPattern, answerIndex].slice(-15);

  // Track vocabulary words — no same word within last 5 questions
  if (vocabWords && vocabWords.length > 0) {
    const normalized = vocabWords.map(w => w.toLowerCase().trim());
    h.recentVocabWords = [...normalized, ...h.recentVocabWords].slice(0, 10);
  }

  saveHistory(h);
}

/** IDs to hard-exclude from the current selection (last N recent). */
export function getRecentIds(strictWindow = 10): Set<string> {
  const h = loadHistory();
  return new Set(h.recent.slice(0, strictWindow));
}

/** All IDs ever seen in simulations. */
export function getSimSeenIds(): Set<string> {
  return new Set(loadHistory().simSeen);
}

/** Recent practice-seen IDs (last 100). */
export function getPracticeSeenIds(window = 100): Set<string> {
  const h = loadHistory();
  return new Set(h.practiceSeen.slice(0, window));
}

/** Recent sentence hashes (last 20). */
export function getRecentSentenceHashes(window = 20): Set<string> {
  const h = loadHistory();
  return new Set(h.sentenceHashes.slice(0, window));
}

/** Returns the last N vocabulary words seen (for anti-repetition). */
export function getRecentVocabWords(window = 5): Set<string> {
  const h = loadHistory();
  return new Set(h.recentVocabWords.slice(0, window).map(w => w.toLowerCase()));
}

/** True if this word appeared in the last 5 questions. */
export function isVocabWordRecentlySeen(word: string): boolean {
  return getRecentVocabWords(5).has(word.toLowerCase().trim());
}

/** Detect if a specific answer index is overused in recent history. */
export function isAnswerIndexOverused(index: number): boolean {
  const h = loadHistory();
  if (h.answerPattern.length < 8) return false;
  const recent = h.answerPattern.slice(-8);
  const count = recent.filter(i => i === index).length;
  return count >= 5;
}

/** Check if a question's sentence is too similar to recently seen ones. */
export function isSentenceTooSimilar(questionText: string): boolean {
  const hash = hashSentence(questionText);
  return getRecentSentenceHashes(15).has(hash);
}

/** Reset simulation history (e.g. when starting a new simulation series). */
export function clearSimHistory(): void {
  const h = loadHistory();
  h.simSeen = [];
  saveHistory(h);
}
