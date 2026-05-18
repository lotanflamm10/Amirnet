import type { PracticeSession, PracticeResult, PracticeMode } from "@/types/questions";
import type { SessionMode, DifficultyFilter } from "./question-selector";

const SESSION_KEY = "amirnet-session-current";

function nowIso() {
  return new Date().toISOString();
}

function generateId(): string {
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSession(
  mode: SessionMode,
  difficulty: DifficultyFilter,
  totalQuestions = 20
): PracticeSession {
  return {
    id: generateId(),
    mode: (mode === "smartReview" ? "mixed" : mode) as PracticeSession["mode"],
    difficulty,
    startedAt: nowIso(),
    completedAt: undefined,
    results: [],
    totalQuestions,
    isSimulation: false,
  };
}

export interface AnswerResult {
  correct: boolean;
  session: PracticeSession;
}

export function submitAnswer(
  session: PracticeSession,
  questionId: string,
  choiceIndex: number,
  timeSeconds: number,
  correctIndex: number
): AnswerResult {
  const correct = choiceIndex === correctIndex;
  const result: PracticeResult = {
    questionId,
    correct,
    chosenIndex: choiceIndex,
    timeSpentSeconds: timeSeconds,
    answeredAt: nowIso(),
  };
  const updated: PracticeSession = {
    ...session,
    results: [...session.results, result],
  };
  return { correct, session: updated };
}

export function completeSession(session: PracticeSession): PracticeSession {
  return { ...session, completedAt: nowIso() };
}

export interface SessionProgress {
  current: number;
  total: number;
  correct: number;
  pct: number;
}

export function getSessionProgress(session: PracticeSession): SessionProgress {
  const answered = session.results.length;
  const correct = session.results.filter((r) => r.correct).length;
  const pct = session.totalQuestions > 0
    ? Math.round((answered / session.totalQuestions) * 100)
    : 0;
  return {
    current: answered,
    total: session.totalQuestions,
    correct,
    pct,
  };
}

export function resumeSession(): PracticeSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PracticeSession;
  } catch {
    return null;
  }
}

export function saveCurrentSession(session: PracticeSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearCurrentSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}
