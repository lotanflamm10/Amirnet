import type { Question, ReadingPassage } from "@/types/questions";

import questionsRaw from "@/data/seed/questions.json";
import hardAddon from "@/data/seed/hard_questions_addon.json";
import expandedAddon from "@/data/seed/questions_expanded.json";

import gen1 from "@/data/seed/_gen_reading_1.json";
import gen2 from "@/data/seed/_gen_reading_2.json";
import gen3 from "@/data/seed/_gen_reading_3.json";
import gen4 from "@/data/seed/_gen_reading_4.json";
import gen5 from "@/data/seed/_gen_reading_5.json";
import gen6 from "@/data/seed/_gen_reading_6.json";
import gen7 from "@/data/seed/_gen_reading_7.json";
import gen8 from "@/data/seed/_gen_reading_8.json";

import genA1 from "@/data/seed/_gen_reading_a_part1.json";
import genB1 from "@/data/seed/_gen_reading_b_part1.json";
import genB2 from "@/data/seed/_gen_reading_b_part2.json";

import genSimA from "@/data/seed/_gen_reading_sim_a.json";
import genSimB from "@/data/seed/_gen_reading_sim_b.json";
import genSimC from "@/data/seed/_gen_reading_sim_c.json";
import genSimD from "@/data/seed/_gen_reading_sim_d.json";
import genSimE from "@/data/seed/_gen_reading_sim_e.json";
import genSimF from "@/data/seed/_gen_reading_sim_f.json";

import {
  validateForSimulation,
  validateForPractice,
  PRACTICE_MIN_QUESTIONS,
  PRACTICE_MAX_QUESTIONS,
  SIMULATION_MIN_QUESTIONS,
} from "./passage-validator";

/** Default for simulation; practice rounds may use 3–5 (see PRACTICE_*). */
export const READING_QUESTIONS_PER_PASSAGE = SIMULATION_MIN_QUESTIONS; // 5

export type ReadingMode = "practice" | "simulation";

export interface PassageBundle {
  passage: ReadingPassage;
  questions: Question[];
}

type ReadingShape =
  | Question[]
  | { reading?: Question[] }
  | Record<string, unknown>;

function asReadingQuestions(src: ReadingShape): Question[] {
  if (Array.isArray(src)) {
    return src.filter((q): q is Question => Boolean(q?.passage?.id));
  }
  if (src && typeof src === "object" && Array.isArray((src as { reading?: unknown }).reading)) {
    const arr = (src as { reading: unknown[] }).reading;
    return arr.filter(
      (q): q is Question => Boolean((q as Question | undefined)?.passage?.id),
    );
  }
  return [];
}

let PASSAGES: Map<string, PassageBundle> | null = null;

function buildIndex(): Map<string, PassageBundle> {
  const map = new Map<string, PassageBundle>();
  const seenQuestionIds = new Set<string>();

  const allSources: ReadingShape[] = [
    questionsRaw as unknown as ReadingShape,
    hardAddon as unknown as ReadingShape,
    expandedAddon as unknown as ReadingShape,
    gen1 as unknown as ReadingShape,
    gen2 as unknown as ReadingShape,
    gen3 as unknown as ReadingShape,
    gen4 as unknown as ReadingShape,
    gen5 as unknown as ReadingShape,
    gen6 as unknown as ReadingShape,
    gen7 as unknown as ReadingShape,
    gen8 as unknown as ReadingShape,
    genA1 as unknown as ReadingShape,
    genB1 as unknown as ReadingShape,
    genB2 as unknown as ReadingShape,
    genSimA as unknown as ReadingShape,
    genSimB as unknown as ReadingShape,
    genSimC as unknown as ReadingShape,
    genSimD as unknown as ReadingShape,
    genSimE as unknown as ReadingShape,
    genSimF as unknown as ReadingShape,
  ];

  for (const src of allSources) {
    for (const q of asReadingQuestions(src)) {
      if (!q.passage) continue;
      if (seenQuestionIds.has(q.id)) continue;
      seenQuestionIds.add(q.id);

      const pid = q.passage.id;
      const existing = map.get(pid);
      if (existing) {
        existing.questions.push(q);
      } else {
        map.set(pid, { passage: q.passage, questions: [q] });
      }
    }
  }

  for (const [pid, bundle] of map) {
    if (!bundle.passage.body || bundle.questions.length === 0) {
      map.delete(pid);
    }
  }

  return map;
}

function getIndex(): Map<string, PassageBundle> {
  if (!PASSAGES) PASSAGES = buildIndex();
  return PASSAGES;
}

export function listPassageIds(): string[] {
  return [...getIndex().keys()];
}

export function getPassageById(passageId: string): PassageBundle | null {
  return getIndex().get(passageId) ?? null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function orderQuestions(questions: Question[]): Question[] {
  const rank: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
  return [...questions].sort((a, b) => {
    const da = rank[a.difficulty] ?? 1;
    const db = rank[b.difficulty] ?? 1;
    if (da !== db) return da - db;
    return a.id.localeCompare(b.id);
  });
}

// Lazy-evaluated, cached partitions of the global passage pool.
let SIM_POOL: PassageBundle[] | null = null;
let PRACTICE_POOL: PassageBundle[] | null = null;

function getSimulationPool(): PassageBundle[] {
  if (SIM_POOL) return SIM_POOL;
  const all = [...getIndex().values()];
  const ok: PassageBundle[] = [];
  const rejected: { id: string; reasons: string[] }[] = [];
  for (const b of all) {
    const r = validateForSimulation(b);
    if (r.ok) ok.push(b);
    else rejected.push({ id: b.passage.id, reasons: r.reasons });
  }
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production" && rejected.length > 0) {
    // eslint-disable-next-line no-console
    console.debug(
      `[reading] ${rejected.length}/${all.length} passages do not meet simulation criteria`,
      rejected.slice(0, 5),
    );
  }
  SIM_POOL = ok;
  return ok;
}

function getPracticePool(): PassageBundle[] {
  if (PRACTICE_POOL) return PRACTICE_POOL;
  const all = [...getIndex().values()];
  const ok: PassageBundle[] = [];
  for (const b of all) {
    if (validateForPractice(b).ok) ok.push(b);
  }
  PRACTICE_POOL = ok;
  return ok;
}

interface SelectOptions {
  /** Defaults to "practice" for backwards compatibility. */
  mode?: ReadingMode;
  /** Override question count (practice only). Ignored for simulation. */
  questionCount?: number;
}

/**
 * Pick one passage for the given mode.
 *
 * - `practice` (default): picks any passage that has 3+ questions and ~60+
 *   words. Exposes 3–5 questions (defaults to 5; caller may pass
 *   `questionCount`). 1–2 paragraphs are allowed.
 * - `simulation`: enforces ≥3 paragraphs, ≥5 questions and ≥180 words to
 *   match real AMIRAM exam quality. Always returns exactly 5 questions.
 *
 * Falls back to the full passage pool when the strict pool is empty so the
 * UI never deadlocks on a fresh install.
 */
export function selectReadingPassage(
  seenPassageIds: Set<string> = new Set(),
  options: SelectOptions = {},
): PassageBundle | null {
  const mode: ReadingMode = options.mode ?? "practice";
  const index = getIndex();
  if (index.size === 0) return null;

  const strictPool = mode === "simulation" ? getSimulationPool() : getPracticePool();
  const fallbackPool = [...index.values()];

  const tryPool = (pool: PassageBundle[]): PassageBundle | null => {
    if (pool.length === 0) return null;
    const unseen = pool.filter((b) => !seenPassageIds.has(b.passage.id));
    const source = unseen.length > 0 ? unseen : pool;
    return shuffle(source)[0] ?? null;
  };

  const pick = tryPool(strictPool) ?? tryPool(fallbackPool);
  if (!pick) return null;

  // Clamp questions to the mode's target count.
  const orderedQs = orderQuestions(pick.questions);
  let target: number;
  if (mode === "simulation") {
    target = SIMULATION_MIN_QUESTIONS;
  } else {
    const requested = options.questionCount ?? PRACTICE_MAX_QUESTIONS;
    target = Math.max(
      PRACTICE_MIN_QUESTIONS,
      Math.min(PRACTICE_MAX_QUESTIONS, requested, orderedQs.length),
    );
  }

  const questions = orderedQs.slice(0, target);
  return { passage: pick.passage, questions };
}

// ─── Recently-seen-passages history (localStorage) ──────────────────────────
const HISTORY_KEY = "amirnet-reading-passages-v1";
const HISTORY_WINDOW = 20;

interface ReadingHistory {
  recent: string[];
}

function loadReadingHistory(): ReadingHistory {
  if (typeof window === "undefined") return { recent: [] };
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return { recent: [] };
    const parsed = JSON.parse(raw) as Partial<ReadingHistory>;
    return { recent: Array.isArray(parsed.recent) ? parsed.recent : [] };
  } catch {
    return { recent: [] };
  }
}

function saveReadingHistory(h: ReadingHistory): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
  } catch {
    // quota — silent
  }
}

export function getRecentReadingPassageIds(): Set<string> {
  return new Set(loadReadingHistory().recent);
}

export function recordReadingPassageSeen(passageId: string): void {
  const h = loadReadingHistory();
  const next = [passageId, ...h.recent.filter((id) => id !== passageId)].slice(
    0,
    HISTORY_WINDOW,
  );
  saveReadingHistory({ recent: next });
}
