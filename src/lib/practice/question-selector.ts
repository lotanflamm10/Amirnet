import type { Question } from "@/types/questions";
import questionsRaw from "@/data/seed/questions.json";
import hardAddon from "@/data/seed/hard_questions_addon.json";
import expandedAddon from "@/data/seed/questions_expanded.json";
import skillBoostersRaw from "@/data/seed/skill_booster_questions.json";
import {
  getRecentIds,
  getSimSeenIds,
  getPracticeSeenIds,
  getRecentSentenceHashes,
  hashSentence,
} from "./question-history";

export type SessionMode =
  | "sentenceCompletion"
  | "restatements"
  | "grammar"
  | "wordFormation"
  | "reading"
  | "lectureQuestions"
  | "textCompletion"
  | "writingTask"
  | "mixed"
  | "smartReview"
  // Skill booster modes
  | "vocabularyInContext"
  | "synonymRecognition"
  | "antonymRecognition"
  | "connectorPractice"
  | "restatementMini"
  | "sentenceLogic"
  | "distractorTrap"
  | "academicPhrase";

export type DifficultyFilter = "adaptive" | "easy" | "medium" | "hard";

// Maps SessionMode → questions.json key
const MODE_TO_KEY: Record<string, string> = {
  sentenceCompletion: "sentenceCompletion",
  restatements:       "paraphrasing",
  grammar:            "grammar",
  wordFormation:      "wordFormation",
  reading:            "reading",
  lectureQuestions:   "lectureQuestions",
  textCompletion:     "textCompletion",
  writingTask:        "writingTask",
};

// Maps skill booster mode → skill_booster_questions.json key
export const SKILL_BOOSTER_KEYS: Record<string, string> = {
  vocabularyInContext: "vocabularyInContext",
  synonymRecognition:  "synonymRecognition",
  antonymRecognition:  "antonymRecognition",
  connectorPractice:   "connectorPractice",
  restatementMini:     "restatementMini",
  sentenceLogic:       "sentenceLogic",
  distractorTrap:      "distractorTrap",
  academicPhrase:      "academicPhrase",
};

export const SKILL_BOOSTER_MODE_IDS = Object.keys(SKILL_BOOSTER_KEYS) as SessionMode[];

// Grammar removed — moved to pilot. Mixed uses these keys only.
const MIXED_KEYS = ["sentenceCompletion", "paraphrasing", "wordFormation", "textCompletion"];

// Weighted proportions for core categories in mixed mode (sums to 80)
const MIXED_WEIGHTS: Record<string, number> = {
  sentenceCompletion: 30,
  paraphrasing:       25,
  wordFormation:      15,
  textCompletion:     10,
};

// Skill booster categories included in mixed (up to 25% of session)
const MIXED_BOOSTER_KEYS = ["vocabularyInContext", "synonymRecognition", "connectorPractice", "sentenceLogic"];
const MIXED_BOOSTER_WEIGHT = 20; // 20% from skill boosters

type QuestionsData = Record<string, Question[]>;

// Source JSONs are static — merge them once on module load and reuse.
let MERGED_DATA: QuestionsData | null = null;
function mergeData(): QuestionsData {
  if (MERGED_DATA) return MERGED_DATA;
  const sources = [
    questionsRaw as unknown as QuestionsData,
    hardAddon    as unknown as QuestionsData,
    expandedAddon as unknown as QuestionsData,
  ];
  const merged: QuestionsData = {};

  for (const src of sources) {
    for (const [key, items] of Object.entries(src)) {
      if (!merged[key]) merged[key] = [];
      const seenIds = new Set<string>(merged[key].map((q) => q.id));
      for (const q of items as Question[]) {
        if (!seenIds.has(q.id)) {
          merged[key].push(q);
          seenIds.add(q.id);
        }
      }
    }
  }
  MERGED_DATA = merged;
  return merged;
}

function getSkillBoosterData(): QuestionsData {
  return skillBoostersRaw as unknown as QuestionsData;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick up to `limit` questions, skipping any whose stem was already used. */
function deduplicateByHash(questions: Question[], limit: number): Question[] {
  const usedHashes = new Set<string>();
  const result: Question[] = [];
  for (const q of questions) {
    const h = hashSentence(q.text);
    if (usedHashes.has(h)) continue;
    usedHashes.add(h);
    result.push(q);
    if (result.length >= limit) break;
  }
  return result;
}

function resolveDifficulty(
  filter: DifficultyFilter,
  recentAccuracy: number
): "easy" | "medium" | "hard" {
  if (filter !== "adaptive") return filter;
  if (recentAccuracy > 75) return "hard";
  if (recentAccuracy < 40) return "easy";
  return "medium";
}

/** Apply anti-repetition: exclude hard-excluded IDs and recently-seen sentence hashes. */
function antiRepeat(pool: Question[], hardExclude: Set<string>): Question[] {
  const recentIds    = getRecentIds(15);
  const recentHashes = getRecentSentenceHashes(20);

  return pool.filter((q) => {
    if (hardExclude.has(q.id))                         return false;
    if (recentIds.has(q.id))                           return false;
    if (recentHashes.has(hashSentence(q.text)))        return false;
    return true;
  });
}

function sampleFromPool(
  pool: Question[],
  target: number,
  resolvedDifficulty: "easy" | "medium" | "hard",
  excludeIds: Set<string>
): Question[] {
  const filtered = antiRepeat(pool, excludeIds);
  let byDiff   = filtered.filter((q) => q.difficulty === resolvedDifficulty);
  if (byDiff.length < target) byDiff = filtered;
  const shuffled = shuffle(byDiff);

  // Deduplicate by sentence hash within this sample
  const usedHashes = new Set<string>();
  const selected: Question[] = [];
  for (const q of shuffled) {
    const h = hashSentence(q.text);
    if (usedHashes.has(h)) continue;
    usedHashes.add(h);
    selected.push(q);
    if (selected.length >= target) break;
  }
  return selected;
}

/**
 * Mixed mode: weighted sampling — 80% core AMIRNET categories + 20% skill boosters.
 */
function selectMixed(
  data: QuestionsData,
  boosterData: QuestionsData,
  resolvedDifficulty: "easy" | "medium" | "hard",
  count: number,
  excludeIds: Set<string>
): Question[] {
  const collected: Question[] = [];

  // --- Core categories (80% of session) ---
  const coreTotal = Object.values(MIXED_WEIGHTS).reduce((a, b) => a + b, 0);
  const coreTarget = Math.round((coreTotal / (coreTotal + MIXED_BOOSTER_WEIGHT)) * count);

  const coreTargets = Object.entries(MIXED_WEIGHTS).map(([key, w]) => ({
    key,
    target: Math.round((w / coreTotal) * coreTarget),
  }));
  const coreDiff = coreTarget - coreTargets.reduce((s, t) => s + t.target, 0);
  if (coreDiff !== 0) coreTargets[0].target += coreDiff;

  for (const { key, target } of coreTargets) {
    collected.push(...sampleFromPool(data[key] ?? [], target, resolvedDifficulty, excludeIds));
  }

  // --- Skill boosters (up to 20% of session) ---
  const boosterTarget = count - coreTarget;
  if (boosterTarget > 0) {
    const allBoosters: Question[] = MIXED_BOOSTER_KEYS.flatMap(
      (k) => boosterData[k] ?? []
    );
    collected.push(...sampleFromPool(allBoosters, boosterTarget, resolvedDifficulty, excludeIds));
  }

  // Fallback fill if we fell short
  if (collected.length < count) {
    const seenIds = new Set(collected.map((q) => q.id));
    const allCore: Question[] = MIXED_KEYS.flatMap((k) => data[k] ?? []);
    const fallback = allCore.filter((q) => !seenIds.has(q.id) && !excludeIds.has(q.id));
    collected.push(...shuffle(fallback).slice(0, count - collected.length));
  }

  return shuffle(collected).slice(0, count);
}

export function selectQuestions(
  mode: SessionMode,
  difficulty: DifficultyFilter,
  count: number,
  excludeIds?: Set<string>,
  recentAccuracy?: number
): Question[] {
  const data              = mergeData();
  const boosterData       = getSkillBoosterData();
  const accuracy          = recentAccuracy ?? 60;
  const resolvedDifficulty = resolveDifficulty(difficulty, accuracy);
  const hardExclude        = excludeIds ?? new Set<string>();

  // Mixed mode: core + skill boosters
  if (mode === "mixed") {
    return selectMixed(data, boosterData, resolvedDifficulty, count, hardExclude);
  }

  // Skill booster modes
  if (mode in SKILL_BOOSTER_KEYS) {
    const key  = SKILL_BOOSTER_KEYS[mode];
    const pool = boosterData[key] ?? [];
    return sampleFromPool(pool, count, resolvedDifficulty, hardExclude);
  }

  // Standard modes
  let pool: Question[] = [];

  if (mode === "smartReview") {
    for (const key of Object.keys(data)) pool = pool.concat(data[key] ?? []);
    // Also include skill boosters in smart review
    for (const key of Object.values(SKILL_BOOSTER_KEYS)) {
      pool = pool.concat(boosterData[key] ?? []);
    }
  } else {
    const dataKey = MODE_TO_KEY[mode];
    if (dataKey) pool = data[dataKey] ?? [];
  }

  // Anti-repetition pass
  const filtered     = antiRepeat(pool, hardExclude);
  let byDifficulty = filtered.filter((q) => q.difficulty === resolvedDifficulty);

  if (byDifficulty.length < count) byDifficulty = filtered;

  if (byDifficulty.length < count) {
    const recentIds = getRecentIds(15);
    byDifficulty = pool.filter((q) => !hardExclude.has(q.id) && !recentIds.has(q.id));
  }

  if (byDifficulty.length < count) {
    byDifficulty = pool.filter((q) => !hardExclude.has(q.id));
  }

  return deduplicateByHash(shuffle(byDifficulty), count);
}

/**
 * Simulation-specific selector: prioritizes questions never seen in any simulation.
 */
export function selectSimulationQuestions(count: number): Question[] {
  const data        = mergeData();
  const simSeen     = getSimSeenIds();
  const recentIds   = getRecentIds(15);
  const recentHashes = getRecentSentenceHashes(20);

  const simKeys = ["sentenceCompletion", "paraphrasing", "wordFormation", "textCompletion"];
  const fullPool: Question[] = simKeys.flatMap((k) => data[k] ?? []);

  let pool = fullPool.filter((q) => {
    if (simSeen.has(q.id))                             return false;
    if (recentIds.has(q.id))                           return false;
    if (recentHashes.has(hashSentence(q.text)))        return false;
    return true;
  });

  if (pool.length < count) {
    pool = fullPool.filter((q) => !simSeen.has(q.id) && !recentIds.has(q.id));
  }
  if (pool.length < count) {
    const strictRecent = getRecentIds(10);
    pool = fullPool.filter((q) => !simSeen.has(q.id) && !strictRecent.has(q.id));
  }
  if (pool.length < count) {
    pool = fullPool.filter((q) => !simSeen.has(q.id));
  }
  if (pool.length < count) {
    pool = fullPool.filter((q) => !recentIds.has(q.id));
  }

  return deduplicateByHash(shuffle(pool), count);
}

/** Count available skill booster questions per mode. */
export function getSkillBoosterCount(mode: SessionMode): number {
  const key = SKILL_BOOSTER_KEYS[mode];
  if (!key) return 0;
  const data = getSkillBoosterData();
  return (data[key] ?? []).length;
}
