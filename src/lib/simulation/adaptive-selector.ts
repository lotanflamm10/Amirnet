import type { Question } from "@/types/questions";
import type { SectionConfig } from "./simulation-config";
import { hashSentence } from "@/lib/practice/question-history";
import {
  selectReadingPassage,
  getRecentReadingPassageIds,
  recordReadingPassageSeen,
} from "@/lib/reading/reading-passages";

type RawQFile = Record<string, Question[]>;

const TYPE_KEY_MAP: Record<string, string> = {
  sentenceCompletion: "sentenceCompletion",
  restatements:       "paraphrasing",
  reading:            "reading",
  grammar:            "grammar",
  wordFormation:      "wordFormation",
  textCompletion:     "textCompletion",
  lectureQuestions:   "lectureQuestions",
  writingTask:        "writingTask",
};

export function selectAdaptiveQuestions(
  section: SectionConfig,
  questionsData: RawQFile,
  previousAccuracy?: number,
  excludeIds: Set<string> = new Set(),
  excludeHashes: Set<string> = new Set()
): Question[] {
  // Reading sections in a simulation must always serve ONE coherent passage
  // of 5 questions (matching real AMIRAM exam format). We bypass the
  // shuffled per-question pool here and delegate to the passage selector,
  // which enforces ≥3 paragraphs + 5 questions.
  if (section.type === "reading") {
    const seen = getRecentReadingPassageIds();
    const bundle = selectReadingPassage(seen, { mode: "simulation" });
    if (bundle) {
      recordReadingPassageSeen(bundle.passage.id);
      // Always attach the passage to each question so the SimulationRunner
      // shows the passage above each question.
      return bundle.questions.map((q) => ({ ...q, passage: bundle.passage }));
    }
    // Fall through to legacy per-question selection if no bundle is available.
  }

  const key = TYPE_KEY_MAP[section.type] ?? section.type;
  const pool: Question[] = (questionsData[key] ?? []).filter((q) => {
    if (excludeIds.has(q.id)) return false;
    if (excludeHashes.has(hashSentence(q.text))) return false;
    return true;
  });

  let preferred: "easy" | "medium" | "hard" = "medium";
  if (previousAccuracy !== undefined) {
    if (previousAccuracy > 0.75) preferred = "hard";
    else if (previousAccuracy < 0.4) preferred = "easy";
  }

  const preferred_pool = pool.filter((q) => q.difficulty === preferred);
  const fallback_pool = pool.filter((q) => q.difficulty !== preferred);

  const combined = shuffle([...preferred_pool, ...fallback_pool]);

  // Pick greedily: skip any question whose sentence hash was already chosen in THIS selection
  const usedHashes = new Set<string>(excludeHashes);
  const selected: Question[] = [];
  for (const q of combined) {
    const h = hashSentence(q.text);
    if (usedHashes.has(h)) continue;
    usedHashes.add(h);
    selected.push(q);
    if (selected.length >= section.questionCount) break;
  }

  return selected;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
