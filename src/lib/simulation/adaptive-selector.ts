import type { Question } from "@/types/questions";
import type { SectionConfig } from "./simulation-config";
import { hashSentence } from "@/lib/practice/question-history";
import {
  selectReadingPassage,
  getRecentReadingPassageIds,
  recordReadingPassageSeen,
} from "@/lib/reading/reading-passages";
import { filterRestatementsForSimulation } from "@/lib/restatement/restatement-validator";

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
  let pool: Question[] = (questionsData[key] ?? []).filter((q) => {
    if (excludeIds.has(q.id)) return false;
    if (excludeHashes.has(hashSentence(q.text))) return false;
    return true;
  });

  // Restatement sections in a simulation must use only items whose stem
  // length and option parity match real Amirnet medium difficulty. Fall
  // back to the longest+hardest available items if the eligible set is
  // smaller than the section's question count.
  if (section.type === "restatements") {
    const { eligible, fallback } = filterRestatementsForSimulation(pool);
    if (eligible.length < section.questionCount && process.env.NODE_ENV !== "production") {
      console.warn(
        `[restatement-validator] Eligible pool has ${eligible.length} items but section ${section.id} requested ${section.questionCount}; falling back to longest/hardest items.`
      );
    }
    pool = eligible.length >= section.questionCount
      ? eligible
      : [...eligible, ...fallback];
  }

  let preferred: "easy" | "medium" | "hard" = "medium";
  if (previousAccuracy !== undefined) {
    if (previousAccuracy > 0.75) preferred = "hard";
    else if (previousAccuracy < 0.4) preferred = "easy";
  }

  const preferred_pool = pool.filter((q) => q.difficulty === preferred);
  const fallback_pool = pool.filter((q) => q.difficulty !== preferred);

  const combined = shuffle([...preferred_pool, ...fallback_pool]);

  const usedHashes = new Set<string>(excludeHashes);
  const usedIds = new Set<string>(excludeIds);
  const selected: Question[] = [];

  // For restatement sections in a simulation, guarantee at least one
  // complex-tier item (stem ≥ 22 words, two-sentence structure, or
  // an explicit pc_* id) so every run includes Amirnet-style register.
  // Sections with >3 questions get 2 complex items.
  if (section.type === "restatements") {
    const targetComplex = section.questionCount > 3 ? 2 : 1;
    const complexCandidates = shuffle(pool.filter(isComplexRestatement));
    for (const q of complexCandidates) {
      if (selected.length >= targetComplex) break;
      const h = hashSentence(q.text);
      if (usedHashes.has(h) || usedIds.has(q.id)) continue;
      usedHashes.add(h);
      usedIds.add(q.id);
      selected.push(q);
    }
    // If the complex pool is exhausted, we silently move on — the main
    // greedy loop will fill the remainder from the broader pool.
  }

  // Pick greedily: skip any question whose sentence hash was already chosen in THIS selection
  for (const q of combined) {
    if (selected.length >= section.questionCount) break;
    if (usedIds.has(q.id)) continue;
    const h = hashSentence(q.text);
    if (usedHashes.has(h)) continue;
    usedHashes.add(h);
    usedIds.add(q.id);
    selected.push(q);
  }

  return selected;
}

/**
 * True iff this restatement item has the structural markers of a
 * "complex" Amirnet-style stem: explicit pc_* id, a stem of ≥22 words,
 * or two sentences joined by a period inside the stem (e.g. "However,",
 * "Yet", "As a result,").
 */
export function isComplexRestatement(q: Question): boolean {
  if (typeof q.id === "string" && q.id.startsWith("pc_")) return true;
  const stem = (q.text ?? "").trim();
  if (!stem) return false;
  const words = stem.split(/\s+/).filter(Boolean).length;
  if (words >= 22) return true;
  // Two-sentence stems: a period followed by whitespace and a capital
  // letter, ignoring a final period.
  const inner = stem.replace(/\.$/, "");
  return /\.\s+[A-Z]/.test(inner);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
