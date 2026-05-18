import type { Question } from "@/types/questions";
import type { SectionConfig } from "./simulation-config";
import { hashSentence } from "@/lib/practice/question-history";

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
