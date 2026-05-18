import path from 'path';
import fs from 'fs';
import type { Page } from 'playwright';
import { config } from './config';
import type { StudentMemory, LocalStorageSnapshot, PreviousRunResults } from './types';

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 200);
}

export function createStudentMemory(previous?: PreviousRunResults): StudentMemory {
  const memory: StudentMemory = {
    visitedRoutes: [],
    clickedActions: [],
    questionsSeen: {},
    questionsSeenByRoute: {},
    answersSubmitted: [],
    vocabWordsSeen: {},
    practiceFlowsCompleted: [],
    practiceFlowsStuck: [],
    localStorageSnapshots: [],
    duplicateQuestionsDetected: [],
    duplicateWordsDetected: [],
  };

  if (previous) {
    // Seed from previous run so the returning-student comparison is meaningful
    for (const [text, count] of Object.entries(previous.studentMemory.questionsSeen)) {
      memory.questionsSeen[text] = count;
    }
    for (const [word, count] of Object.entries(previous.studentMemory.vocabWordsSeen)) {
      memory.vocabWordsSeen[word] = count;
    }
  }

  return memory;
}

/** Record a question text. Returns true if this was already seen (duplicate). */
export function recordQuestion(memory: StudentMemory, text: string, route: string): boolean {
  const normalized = normalizeText(text);
  if (normalized.length < 5) return false;

  const prev = memory.questionsSeen[normalized] ?? 0;
  memory.questionsSeen[normalized] = prev + 1;

  if (!memory.questionsSeenByRoute[route]) {
    memory.questionsSeenByRoute[route] = [];
  }
  memory.questionsSeenByRoute[route].push(normalized);

  if (prev > 0) {
    const existing = memory.duplicateQuestionsDetected.find(d => d.text === normalized);
    if (existing) {
      existing.count = prev + 1;
    } else {
      memory.duplicateQuestionsDetected.push({ text: normalized, count: prev + 1, route });
    }
    return true;
  }
  return false;
}

/** Record a vocab word. Returns true if already seen this session. */
export function recordVocabWord(memory: StudentMemory, word: string, route: string): boolean {
  const normalized = normalizeText(word);
  if (normalized.length < 1) return false;

  const prev = memory.vocabWordsSeen[normalized] ?? 0;
  memory.vocabWordsSeen[normalized] = prev + 1;

  if (prev > 0) {
    const existing = memory.duplicateWordsDetected.find(d => d.word === normalized);
    if (existing) {
      existing.count = prev + 1;
    } else {
      memory.duplicateWordsDetected.push({ word: normalized, count: prev + 1, route });
    }
    return true;
  }
  return false;
}

/** Capture a localStorage snapshot for the 5 tracked keys. */
export async function snapshotLocalStorage(
  page: Page,
  route: string,
  flowName: string,
  timing: 'before' | 'after'
): Promise<Record<string, unknown>> {
  const keys: Record<string, unknown> = {};

  for (const key of config.localStorageKeysToSnapshot) {
    try {
      const raw = await page.evaluate((k: string): string | null => {
        try {
          return window.localStorage.getItem(k);
        } catch {
          return null;
        }
      }, key);

      if (raw === null) {
        keys[key] = null;
      } else {
        try {
          keys[key] = JSON.parse(raw);
        } catch {
          keys[key] = raw;
        }
      }
    } catch {
      keys[key] = null;
    }
  }
  return keys;
}

/** Record a snapshot into memory. */
export function recordSnapshot(
  memory: StudentMemory,
  snapshot: Omit<LocalStorageSnapshot, 'capturedAt'>
): void {
  memory.localStorageSnapshots.push({
    capturedAt: new Date().toISOString(),
    ...snapshot,
  });
}

/** Persist memory to disk — call after every flow for crash safety. */
export function saveMemory(memory: StudentMemory, filePath: string): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(memory, null, 2), 'utf-8');
  } catch (err) {
    console.error('[memory] Failed to save:', err);
  }
}

/** Load a previous run's results for returning-student mode. */
export function loadPreviousResults(filePath: string): PreviousRunResults | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (data.studentMemory) return data as unknown as PreviousRunResults;
    return null;
  } catch {
    return null;
  }
}

/**
 * Build the localStorage injection map for returning-student mode.
 * Seeds amirnet-qhistory-v1 with the vocab words seen previously.
 * The question IDs are not available from text alone, but vocabWords can be injected.
 */
export function buildReturningInjectionMap(previous: PreviousRunResults): Record<string, string> {
  const map: Record<string, string> = {};

  // Inject recentVocabWords so the app avoids re-showing them within a short window
  const recentVocabWords = Object.keys(previous.studentMemory.vocabWordsSeen).slice(0, 10);
  const historyState = {
    recent: [],
    simSeen: [],
    practiceSeen: [],
    sentenceHashes: [],
    answerPattern: [],
    recentVocabWords,
  };
  map['amirnet-qhistory-v1'] = JSON.stringify(historyState);

  return map;
}

/** Check if a question text was seen in a previous run. */
export function wasSeenInPreviousRun(memory: StudentMemory, text: string): boolean {
  const normalized = normalizeText(text);
  // Questions from previous run were seeded with count >= 1
  // During current run they get incremented further
  // So if count > 1 at first recording time, it means it was pre-seeded
  return (memory.questionsSeen[normalized] ?? 0) > 1;
}

/** Return how many unique questions have been seen this session (excluding seeds). */
export function uniqueQuestionsThisSession(memory: StudentMemory, previous?: PreviousRunResults): number {
  if (!previous) return Object.keys(memory.questionsSeen).length;
  const prevKeys = new Set(Object.keys(previous.studentMemory.questionsSeen));
  return Object.keys(memory.questionsSeen).filter(k => !prevKeys.has(k)).length;
}
