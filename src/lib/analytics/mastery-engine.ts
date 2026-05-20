import type { UserProgress, CategoryProgress } from "@/types/progress";
import type { QuestionCategory } from "@/types/questions";

export type MistakeType = "vocabulary_gap" | "grammar_structure" | "misunderstood_sentence" | "distractor_trap" | "time_pressure" | "reading_inference" | "unknown";

const CATEGORY_EXPECTED_TIMES: Partial<Record<QuestionCategory, number>> = {
  sentenceCompletion: 30, restatements: 45, grammar: 25, wordFormation: 20,
  reading: 90, lectureQuestions: 60, textCompletion: 35, vocabulary: 15, mixed: 30,
};

const CATEGORY_IMPORTANCE: Partial<Record<QuestionCategory, number>> = {
  reading: 3, restatements: 2.5, sentenceCompletion: 2, grammar: 1.5,
  wordFormation: 1.5, textCompletion: 1.5, lectureQuestions: 1, vocabulary: 2, mixed: 1,
};

export function calculateMasteryScore(cat: CategoryProgress): number {
  if (cat.totalAnswered < 3) return 50;
  const accuracy = cat.accuracyPercent / 100;
  const expectedTime = CATEGORY_EXPECTED_TIMES[cat.category as QuestionCategory] ?? 30;
  const speedScore = Math.max(0, Math.min(1, 1 - (cat.averageTimeSeconds - expectedTime) / (expectedTime * 2)));
  const consistencyScore = Math.min(1, accuracy * 1.25);
  const mastery = accuracy * 0.55 + speedScore * 0.15 + consistencyScore * 0.20 + 0.05;
  return Math.round(Math.min(100, Math.max(0, mastery * 100)));
}

export function calculateReadinessScore(progress: UserProgress): number {
  const cats = progress.categoryProgress.filter(c => c.totalAnswered >= 3);
  if (cats.length === 0) {
    if (progress.diagnosticScore != null) return Math.round(progress.diagnosticScore as number);
    return 0;
  }
  let totalWeight = 0, weightedSum = 0;
  for (const cat of cats) {
    const importance = CATEGORY_IMPORTANCE[cat.category as QuestionCategory] ?? 1;
    weightedSum += calculateMasteryScore(cat) * importance;
    totalWeight += importance;
  }
  const base = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const diagBonus = progress.diagnosticCompleted ? 5 : 0;
  return Math.round(Math.min(100, base + diagBonus));
}

export function predictScoreRange(progress: UserProgress): { low: number; high: number } {
  const readiness = calculateReadinessScore(progress);
  if (readiness === 0) return { low: 70, high: 85 };
  const low = Math.round(70 + readiness * 0.55);
  return { low, high: Math.min(150, low + 12) };
}

/**
 * Returns the up-to-2 weakest category ids. Display labels must be resolved
 * by the caller via translations (see `dashboard.cat*` keys).
 */
export function getBlockers(progress: UserProgress): string[] {
  return [...progress.categoryProgress]
    .filter(c => c.totalAnswered >= 3)
    .sort((a, b) => calculateMasteryScore(a) - calculateMasteryScore(b))
    .slice(0, 2)
    .map(c => c.category);
}

export function classifyMistake(questionCategory: QuestionCategory, timeSpentSeconds: number, categoryAvgTime: number, questionTags?: string[]): MistakeType {
  const expectedTime = CATEGORY_EXPECTED_TIMES[questionCategory] ?? 30;
  if (timeSpentSeconds > expectedTime * 1.5 || timeSpentSeconds > categoryAvgTime * 1.5) return "time_pressure";
  if (questionTags) {
    if (questionTags.includes("vocabulary") || questionTags.includes("vocab")) return "vocabulary_gap";
    if (questionTags.includes("grammar") || questionTags.includes("structure")) return "grammar_structure";
    if (questionTags.includes("inference") || questionTags.includes("reading")) return "reading_inference";
    if (questionTags.includes("trap") || questionTags.includes("distractor")) return "distractor_trap";
  }
  const defaults: Partial<Record<QuestionCategory, MistakeType>> = {
    grammar: "grammar_structure", wordFormation: "vocabulary_gap", reading: "reading_inference",
    lectureQuestions: "misunderstood_sentence", sentenceCompletion: "distractor_trap",
    restatements: "misunderstood_sentence", textCompletion: "vocabulary_gap",
  };
  return defaults[questionCategory] ?? "unknown";
}

export function getMistakeTypeLabel(type: MistakeType): string {
  const labels: Record<MistakeType, string> = {
    vocabulary_gap: "פער אוצר מילים", grammar_structure: "מבנה דקדוקי",
    misunderstood_sentence: "אי הבנה של משפט", distractor_trap: "תשובת מסיחה",
    time_pressure: "לחץ זמן", reading_inference: "הסקת מסקנות", unknown: "לא מסווג",
  };
  return labels[type] ?? type;
}
