import type { UserProgress } from "@/types/progress";
import { calculateMasteryScore } from "./mastery-engine";
import { DAILY_VOCAB_LIMIT } from "@/lib/vocab/daily-vocab";

// Reading is delivered as one full passage of READING_QUESTIONS_PER_PASSAGE
// questions (AMIRAM-style). Kept in sync with src/lib/reading/reading-passages.ts.
export const READING_QUESTIONS_PER_PASSAGE = 5;

/**
 * Discriminated descriptor for the line of copy under each plan item.
 * The consumer (TodaysTraining) resolves to a localized string.
 */
export type DailyPlanReason =
  | { kind: "vocabPending"; count: number }
  | { kind: "vocabBuild" }
  | { kind: "reading" }
  | { kind: "weakCategory"; accuracyPercent: number }
  | { kind: "booster"; weakCategory: string }
  | { kind: "mixedFirst" }
  | { kind: "mixedKeepLevel" };

/**
 * Discriminated descriptor for the primary label on each plan item.
 */
export type DailyPlanLabel =
  | { kind: "vocabToday" }
  | { kind: "readingPassage" }
  | { kind: "category"; category: string }
  | { kind: "booster"; mode: string }
  | { kind: "mixed" };

export interface DailyPlanItem {
  type: "questions" | "vocab" | "review" | "booster";
  mode?: string;
  count: number;
  label: DailyPlanLabel;
  priority: "high" | "medium" | "low";
  reason: DailyPlanReason;
  href: string;
  icon: string;
  color: string;
}

const CATEGORY_TO_MODE: Record<string, string> = {
  sentenceCompletion: "sentenceCompletion", restatements: "restatements",
  grammar: "grammar", wordFormation: "wordFormation", reading: "reading",
  lectureQuestions: "lectureQuestions", textCompletion: "textCompletion",
};
const CATEGORY_ICONS: Record<string, string> = {
  sentenceCompletion: "sentenceCompletion", restatements: "restatements", grammar: "grammar",
  wordFormation: "wordFormation", reading: "reading", lectureQuestions: "lectureQuestions", textCompletion: "textCompletion",
};

const CATEGORY_TO_BOOSTER: Record<string, { mode: string; icon: string }> = {
  sentenceCompletion: { mode: "vocabularyInContext", icon: "vocabularyInContext" },
  restatements:       { mode: "restatementMini",    icon: "restatementMini"   },
  grammar:            { mode: "connectorPractice",  icon: "connectorPractice" },
  wordFormation:      { mode: "synonymRecognition", icon: "synonymRecognition"},
  reading:            { mode: "academicPhrase",     icon: "academicPhrase"    },
  textCompletion:     { mode: "sentenceLogic",      icon: "sentenceLogic"     },
  lectureQuestions:   { mode: "connectorPractice",  icon: "connectorPractice" },
};

export function generateDailyPlan(progress: UserProgress, vocabDueCount: number = 0): DailyPlanItem[] {
  const items: DailyPlanItem[] = [];
  const goal = progress.dailyGoal?.targetQuestions ?? 20;
  let questionsAllocated = 0;

  // Vocab if needed — daily task is ALWAYS exactly DAILY_VOCAB_LIMIT cards,
  // regardless of how many are due. The total pending number is shown
  // separately on the widget as a stat.
  if (vocabDueCount > 0 || (progress.vocabProgress?.totalSeen ?? 0) < 50) {
    items.push({
      type: "vocab", count: DAILY_VOCAB_LIMIT,
      label: { kind: "vocabToday" },
      priority: vocabDueCount > 5 ? "high" : "medium",
      reason:
        vocabDueCount > 0
          ? { kind: "vocabPending", count: vocabDueCount }
          : { kind: "vocabBuild" },
      href: "/vocab/swipe", icon: "vocab", color: "var(--success)",
    });
  }

  // Weak categories
  const weakCats = [...(progress.categoryProgress ?? [])]
    .filter(c => c.totalAnswered >= 3 && calculateMasteryScore(c) < 65)
    .sort((a, b) => calculateMasteryScore(a) - calculateMasteryScore(b));

  for (let i = 0; i < Math.min(2, weakCats.length); i++) {
    const cat = weakCats[i];
    const mode = CATEGORY_TO_MODE[cat.category];
    if (!mode) continue;
    const isReading = mode === "reading";
    const count = isReading
      ? READING_QUESTIONS_PER_PASSAGE
      : Math.min(10, Math.max(6, Math.floor((goal - questionsAllocated) * (i === 0 ? 0.4 : 0.3))));
    items.push({
      type: "questions", mode, count,
      label: isReading
        ? { kind: "readingPassage" }
        : { kind: "category", category: cat.category },
      priority: i === 0 ? "high" : "medium",
      reason: isReading
        ? { kind: "reading" }
        : { kind: "weakCategory", accuracyPercent: cat.accuracyPercent },
      href: `/practice/${mode}`, icon: CATEGORY_ICONS[cat.category] ?? "practice",
      color: i === 0 ? "var(--danger)" : "var(--warn)",
    });
    questionsAllocated += count;
  }

  // Adaptive skill booster: recommend based on weakest category
  if (weakCats.length > 0) {
    const topWeak = weakCats[0];
    const booster = CATEGORY_TO_BOOSTER[topWeak.category];
    if (booster && !items.some(i => i.mode === booster.mode)) {
      items.push({
        type: "booster", mode: booster.mode, count: 10,
        label: { kind: "booster", mode: booster.mode },
        priority: "medium",
        reason: { kind: "booster", weakCategory: topWeak.category },
        href: `/practice/${booster.mode}`, icon: booster.icon ?? "booster", color: "var(--teal)",
      });
    }
  }

  // Fallback: mixed
  if (questionsAllocated < goal || items.filter(i => i.type === "questions").length === 0) {
    const remaining = Math.max(goal - questionsAllocated, items.length === 0 ? goal : 0);
    if (remaining > 0) {
      const isFirst = items.filter(i => i.type === "questions").length === 0;
      items.push({
        type: "questions", mode: "mixed", count: Math.min(remaining, 15),
        label: { kind: "mixed" },
        priority: isFirst ? "high" : "low",
        reason: isFirst ? { kind: "mixedFirst" } : { kind: "mixedKeepLevel" },
        href: "/practice/mixed", icon: "mixed", color: "var(--teal)",
      });
    }
  }

  return items;
}
