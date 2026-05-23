import type { Question, QuestionCategory } from "@/types/questions";
import { userKey, safeGetItem, safeSetItem } from "@/lib/storage/user-storage";

const LEGACY_CHALLENGE_HISTORY_KEY = "amirnet-challenge-history-v1";
const challengeHistoryK = () => userKey(LEGACY_CHALLENGE_HISTORY_KEY);

const MAX_HISTORY = 20;

export interface ChallengeSummaryQuestion {
  questionId: string;
  category: QuestionCategory;
  text: string;
  choices: string[];
  answer: number;
  chosenIndex: number | null;
  explanation: string;
  hebrewExplanation?: string;
  wrongReasons: string[];
}

export interface ChallengeSummary {
  id: string;
  startedAt: string;
  completedAt: string;
  totalQuestions: number;
  totalCorrect: number;
  maxStreak: number;
  totalScore: number;
  categories: QuestionCategory[];
  difficulty: string;
  questions: ChallengeSummaryQuestion[];
}

export function loadChallengeHistory(): ChallengeSummary[] {
  const raw = safeGetItem(challengeHistoryK());
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ChallengeSummary[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChallengeSummary(summary: ChallengeSummary): void {
  const list = loadChallengeHistory();
  const filtered = list.filter((s) => s.id !== summary.id);
  const next = [summary, ...filtered].slice(0, MAX_HISTORY);
  safeSetItem(challengeHistoryK(), JSON.stringify(next));
}

export function getRecentChallengeSummaries(limit = 5): ChallengeSummary[] {
  return loadChallengeHistory().slice(0, limit);
}

export function summaryFromQuestions(
  startedAt: string,
  questions: Question[],
  chosenIndexes: (number | null)[],
  totalScore: number,
  maxStreak: number,
  difficulty: string
): ChallengeSummary {
  const summaryQuestions: ChallengeSummaryQuestion[] = questions.map((q, i) => ({
    questionId: q.id,
    category: q.category,
    text: q.text,
    choices: q.choices,
    answer: q.answer,
    chosenIndex: chosenIndexes[i] ?? null,
    explanation: q.explanation,
    hebrewExplanation: q.hebrewExplanation,
    wrongReasons: q.wrongReasons ?? [],
  }));
  const totalCorrect = summaryQuestions.filter(
    (q) => q.chosenIndex !== null && q.chosenIndex === q.answer
  ).length;
  const uniqueCategories = Array.from(new Set(summaryQuestions.map((q) => q.category)));
  return {
    id: `challenge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    startedAt,
    completedAt: new Date().toISOString(),
    totalQuestions: questions.length,
    totalCorrect,
    maxStreak,
    totalScore,
    categories: uniqueCategories,
    difficulty,
    questions: summaryQuestions,
  };
}
