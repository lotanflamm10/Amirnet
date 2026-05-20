import type { UserProgress, CategoryProgress, SimulationHistory } from "@/types/progress";
import type { QuestionCategory, QuestionDifficulty } from "@/types/questions";
import { getLevelFromXp } from "@/lib/gamification/xp-system";
import { userKey, safeGetItem, safeSetItem, safeRemoveItem } from "@/lib/storage/user-storage";

const LEGACY_KEY = "amirnet-progress-v1";
const k = () => userKey(LEGACY_KEY);

function now() { return new Date().toISOString(); }
function today() { return new Date().toISOString().slice(0, 10); }

function defaultProgress(): UserProgress {
  return {
    userId: "local",
    streak: 0,
    lastActiveDate: null,
    dailyGoal: { targetQuestions: 20, questionsAnsweredToday: 0, date: today() },
    estimatedScore: null,
    totalQuestionsAnswered: 0,
    totalCorrect: 0,
    categoryProgress: [],
    vocabProgress: { totalSeen: 0, totalMastered: 0, totalStarred: 0, totalWeak: 0, lastStudiedAt: null },
    simulationHistory: [],
    weaknessProfile: null,
    createdAt: now(),
    updatedAt: now(),
    xp: 0,
    level: 1,
    targetScore: 134,
    achievements: [],
    diagnosticCompleted: false,
    diagnosticScore: null,
    diagnosticCompletedAt: null,
    diagnosticCategoryResults: null,
  };
}

export function loadProgress(): UserProgress {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = safeGetItem(k());
    if (!raw) return defaultProgress();
    const p = { ...defaultProgress(), ...(JSON.parse(raw) as Partial<UserProgress>) };
    // Reset daily goal if stale
    if (p.dailyGoal.date !== today()) {
      p.dailyGoal = { ...p.dailyGoal, questionsAnsweredToday: 0, date: today() };
    }
    // Update streak
    if (p.lastActiveDate && p.lastActiveDate !== today()) {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      if (p.lastActiveDate !== yStr) p.streak = 0;
    }
    return p;
  } catch { return defaultProgress(); }
}

export function saveProgress(p: UserProgress) {
  if (typeof window === "undefined") return;
  p.updatedAt = now();
  safeSetItem(k(), JSON.stringify(p));
}

export function recordAnswer(category: QuestionCategory, correct: boolean, timeSeconds: number) {
  const p = loadProgress();
  p.totalQuestionsAnswered++;
  if (correct) p.totalCorrect++;
  p.dailyGoal.questionsAnsweredToday++;

  // Streak
  if (p.lastActiveDate !== today()) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (p.lastActiveDate === yesterday.toISOString().slice(0, 10)) p.streak++;
    else if (p.lastActiveDate !== today()) p.streak = 1;
    p.lastActiveDate = today();
  }

  // Category progress
  let cat = p.categoryProgress.find((c) => c.category === category);
  if (!cat) {
    cat = { category, totalAnswered: 0, totalCorrect: 0, accuracyPercent: 0, averageTimeSeconds: 0, lastPracticedAt: null };
    p.categoryProgress.push(cat);
  }
  cat.totalAnswered++;
  if (correct) cat.totalCorrect++;
  cat.accuracyPercent = Math.round((cat.totalCorrect / cat.totalAnswered) * 100);
  cat.averageTimeSeconds = Math.round((cat.averageTimeSeconds * (cat.totalAnswered - 1) + timeSeconds) / cat.totalAnswered);
  cat.lastPracticedAt = now();

  saveProgress(p);
  return p;
}

export function recordSimulation(sim: SimulationHistory) {
  const p = loadProgress();
  p.simulationHistory.unshift(sim);
  if (p.simulationHistory.length > 20) p.simulationHistory.pop();
  p.estimatedScore = sim.estimatedScore;
  saveProgress(p);
}

export function recordVocabSession(seen: number, known: number) {
  const p = loadProgress();
  p.vocabProgress.totalSeen += seen;
  p.vocabProgress.lastStudiedAt = now();
  if (p.dailyGoal.date === today()) p.dailyGoal.questionsAnsweredToday += known;
  if (p.lastActiveDate !== today()) { p.streak++; p.lastActiveDate = today(); }
  saveProgress(p);
}

export function getWeakCategories(): QuestionCategory[] {
  const p = loadProgress();
  return p.categoryProgress
    .filter((c) => c.totalAnswered >= 5 && c.accuracyPercent < 60)
    .sort((a, b) => a.accuracyPercent - b.accuracyPercent)
    .map((c) => c.category);
}

export function exportProgress(): string {
  const p = loadProgress();
  return JSON.stringify(p, null, 2);
}

export function importProgress(json: string): boolean {
  try {
    const p = JSON.parse(json) as UserProgress;
    if (!p.userId) return false;
    saveProgress(p);
    return true;
  } catch { return false; }
}

export function resetProgress() {
  if (typeof window === "undefined") return;
  safeRemoveItem(k());
}

export function addXp(amount: number): UserProgress {
  const p = loadProgress();
  p.xp = (p.xp ?? 0) + amount;
  // Simple level recalc: level = 1 + floor(xp/100) capped at 8
  p.level = getLevelFromXp(p.xp).level;
  saveProgress(p);
  return p;
}

export function saveDiagnosticResult(score: number, categoryResults: Record<string, number>): UserProgress {
  const p = loadProgress();
  p.diagnosticCompleted = true;
  p.diagnosticScore = score;
  p.diagnosticCompletedAt = new Date().toISOString();
  p.diagnosticCategoryResults = categoryResults;
  p.xp = (p.xp ?? 0) + 75;
  p.level = getLevelFromXp(p.xp).level;
  if (!p.achievements?.includes("first_diagnostic")) {
    p.achievements = [...(p.achievements ?? []), "first_diagnostic"];
  }
  saveProgress(p);
  return p;
}

export function setTargetScore(target: number): void {
  const p = loadProgress();
  p.targetScore = target;
  saveProgress(p);
}

export function unlockAchievement(id: string): boolean {
  const p = loadProgress();
  if ((p.achievements ?? []).includes(id)) return false;
  p.achievements = [...(p.achievements ?? []), id];
  saveProgress(p);
  return true;
}

export type { UserProgress, CategoryProgress };
