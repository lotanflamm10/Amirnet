import type { QuestionCategory, QuestionDifficulty, ReadingPassage } from "./questions";

export interface CategoryProgress {
  category: QuestionCategory;
  totalAnswered: number;
  totalCorrect: number;
  accuracyPercent: number;
  averageTimeSeconds: number;
  lastPracticedAt: string | null;
}

export interface VocabProgress {
  totalSeen: number;
  totalMastered: number;
  totalStarred: number;
  totalWeak: number;
  lastStudiedAt: string | null;
}

/**
 * Per-question snapshot saved with a simulation history record so a user
 * can revisit which questions they got wrong and read the explanation,
 * even for sessions they abandoned.
 */
export interface SimulationHistoryQuestion {
  sectionId: string;
  questionId: string;
  category: QuestionCategory;
  text: string;
  choices: string[];
  answer: number;
  chosenIndex: number | null;
  explanation: string;
  hebrewExplanation?: string;
  wrongReasons: string[];
  passage?: ReadingPassage;
}

export interface SimulationHistory {
  id: string;
  completedAt: string;
  estimatedScore: number;
  accuracyPercent: number;
  durationSeconds: number;
  sectionBreakdown: Record<string, { correct: number; total: number }>;
  isPilot: boolean;
  /** "completed" = user finished normally; "abandoned" = closed mid-session. */
  status?: "completed" | "abandoned";
  mode?: string;
  /** Per-question review data — present on records created from 2026-05 onward. */
  questions?: SimulationHistoryQuestion[];
}

export interface DailyGoal {
  targetQuestions: number;
  questionsAnsweredToday: number;
  date: string;
}

export interface WeaknessProfile {
  weakCategories: QuestionCategory[];
  weakDifficulties: QuestionDifficulty[];
  slowCategories: QuestionCategory[];
  recommendedMode: string;
  generatedAt: string;
}

export interface UserProgress {
  userId: string;
  streak: number;
  lastActiveDate: string | null;
  dailyGoal: DailyGoal;
  estimatedScore: number | null;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  categoryProgress: CategoryProgress[];
  vocabProgress: VocabProgress;
  simulationHistory: SimulationHistory[];
  weaknessProfile: WeaknessProfile | null;
  createdAt: string;
  updatedAt: string;
  xp: number;
  level: number;
  targetScore: number;
  achievements: string[];
  diagnosticCompleted: boolean;
  /** Back-compat: the headline diagnostic score. New code should read
   *  diagnosticScoreLow / diagnosticScoreHigh for the range. */
  diagnosticScore: number | null;
  diagnosticCompletedAt: string | null;
  diagnosticCategoryResults: Record<string, number> | null;
  /** Lower bound of the estimated AMIRAM score range (50–150). */
  diagnosticScoreLow: number | null;
  /** Upper bound of the estimated AMIRAM score range (50–150). */
  diagnosticScoreHigh: number | null;
  /** Weighted core-category accuracy used to derive the score range (0–1). */
  diagnosticCoreAccuracy: number | null;
}
