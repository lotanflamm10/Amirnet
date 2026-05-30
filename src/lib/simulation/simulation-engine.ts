import type { SectionConfig, SimMode } from "./simulation-config";
import { getSectionsByMode } from "./simulation-config";
import type { SectionResult } from "./score-estimator";
import { calculateMainScore } from "./score-estimator";
import { calculatePilotBonus } from "./pilot-bonus-calculator";
import { userKey, safeGetItem, safeSetItem, safeRemoveItem } from "@/lib/storage/user-storage";
import type { Question } from "@/types/questions";
import type {
  SimulationHistory,
  SimulationHistoryQuestion,
} from "@/types/progress";

const LEGACY_SIM_KEY = "amirnet-sim-current";
const LEGACY_INPROGRESS_KEY = "amirnet-sim-inprogress-v1";
const simK = () => userKey(LEGACY_SIM_KEY);
const inProgressK = () => userKey(LEGACY_INPROGRESS_KEY);

export interface SimulationState {
  id: string;
  mode: SimMode;
  sections: SectionConfig[];
  currentSectionIndex: number;
  currentQuestionIndex: number;
  answers: Record<string, number>;
  sectionAnswers: Record<string, Record<string, number>>;
  startedAt: string;
  completedAt?: string;
  status: "active" | "between-sections" | "complete";
}

export interface SimulationFinalResult {
  mainScore: number;
  pilotBonus: number;
  totalScore: number;
  sectionResults: SectionResult[];
  weakAreas: string[];
}

function genId() { return `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

export function createSimulation(mode: SimMode): SimulationState {
  return {
    id: genId(),
    mode,
    sections: getSectionsByMode(mode),
    currentSectionIndex: 0,
    currentQuestionIndex: 0,
    answers: {},
    sectionAnswers: {},
    startedAt: new Date().toISOString(),
    status: "active",
  };
}

export function recordAnswer(state: SimulationState, questionId: string, choiceIndex: number): SimulationState {
  const sectionId = state.sections[state.currentSectionIndex]?.id ?? "unknown";
  return {
    ...state,
    answers: { ...state.answers, [questionId]: choiceIndex },
    sectionAnswers: {
      ...state.sectionAnswers,
      [sectionId]: { ...(state.sectionAnswers[sectionId] ?? {}), [questionId]: choiceIndex },
    },
  };
}

export function setCurrentQuestion(state: SimulationState, idx: number): SimulationState {
  return { ...state, currentQuestionIndex: idx };
}

export function advanceToNextSection(state: SimulationState): SimulationState {
  const nextIdx = state.currentSectionIndex + 1;
  if (nextIdx >= state.sections.length) {
    return { ...state, status: "complete", completedAt: new Date().toISOString() };
  }
  return { ...state, currentSectionIndex: nextIdx, currentQuestionIndex: 0, status: "between-sections" };
}

export function resumeSection(state: SimulationState): SimulationState {
  return { ...state, status: "active" };
}

export function completeSimulation(state: SimulationState): SimulationState {
  return { ...state, status: "complete", completedAt: new Date().toISOString() };
}

export function calculateFinalResults(
  state: SimulationState,
  questionsBySection: Record<string, { id: string; answer: number }[]>
): SimulationFinalResult {
  const sectionResults: SectionResult[] = state.sections.map((sec) => {
    const questions = questionsBySection[sec.id] ?? [];
    const sectionAns = state.sectionAnswers[sec.id] ?? {};
    // Writing-task items are open-ended (q.answer === -1, no rubric); the
    // recorded "answer" is a 0/1 submission flag. Exclude them from BOTH
    // correct and total so they neither inflate nor dilute the pilot-bonus
    // accuracy denominator. The submission flag itself remains in
    // sectionAns for the review/summary screens.
    const scorable = questions.filter((q) => q.answer !== -1);
    const correct = scorable.filter((q) => sectionAns[q.id] === q.answer).length;
    return {
      sectionId: sec.id,
      isPilot: sec.isPilot,
      correct,
      total: scorable.length,
      timeTakenSeconds: sec.timeLimitSeconds,
      type: sec.type,
    };
  });

  const mainScore = calculateMainScore(sectionResults);
  const pilotBonus = calculatePilotBonus(sectionResults);
  const totalScore = Math.min(150, mainScore + pilotBonus);

  const weakAreas = sectionResults
    .filter((r) => !r.isPilot && r.total > 0 && r.correct / r.total < 0.5)
    .map((r) => r.type);

  return { mainScore, pilotBonus, totalScore, sectionResults, weakAreas };
}

export function saveSimulationState(state: SimulationState) {
  safeSetItem(simK(), JSON.stringify(state));
}

export function loadSimulationState(): SimulationState | null {
  const raw = safeGetItem(simK());
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SimulationState;
  } catch { return null; }
}

export function clearSimulationState() {
  safeRemoveItem(simK());
}

// ── In-progress autosave + abandon-to-history flow ──────────────────────────

/**
 * Lightweight snapshot of an active simulation including the served question
 * objects, so we can render a per-question review even if the user closes
 * the tab without finishing.
 *
 * Lives under `amirnet-sim-inprogress-v1` (separate from the legacy
 * `amirnet-sim-current` key) so the `UserProgress` blob is not bloated by
 * question content.
 */
export interface SimulationInProgress {
  id: string;
  mode: SimMode;
  startedAt: string;
  lastUpdatedAt: string;
  sections: SectionConfig[];
  sectionAnswers: Record<string, Record<string, number>>;
  sectionQuestions: Record<string, Question[]>;
}

export function saveSimulationInProgress(snap: SimulationInProgress) {
  safeSetItem(inProgressK(), JSON.stringify(snap));
}

export function loadSimulationInProgress(): SimulationInProgress | null {
  const raw = safeGetItem(inProgressK());
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SimulationInProgress;
  } catch {
    return null;
  }
}

export function clearSimulationInProgress() {
  safeRemoveItem(inProgressK());
}

/**
 * Convert an in-progress snapshot into a SimulationHistory record so it can
 * be rendered alongside completed simulations. `status` lets callers reuse
 * this for both the "finished" and "abandoned" paths.
 */
export function buildHistoryFromInProgress(
  snap: SimulationInProgress,
  status: "completed" | "abandoned"
): SimulationHistory {
  const reviewQuestions: SimulationHistoryQuestion[] = [];
  const breakdown: Record<string, { correct: number; total: number }> = {};
  let totalAnswered = 0;
  let totalCorrect = 0;

  for (const section of snap.sections) {
    const qs = snap.sectionQuestions[section.id] ?? [];
    const ans = snap.sectionAnswers[section.id] ?? {};
    let correct = 0;
    for (const q of qs) {
      const chosenRaw = ans[q.id];
      const chosenIndex = typeof chosenRaw === "number" ? chosenRaw : null;
      const isCorrect = chosenIndex !== null && chosenIndex === q.answer;
      if (chosenIndex !== null) totalAnswered++;
      if (isCorrect) {
        correct++;
        totalCorrect++;
      }
      reviewQuestions.push({
        sectionId: section.id,
        questionId: q.id,
        category: q.category,
        text: q.text,
        choices: q.choices,
        answer: q.answer,
        chosenIndex,
        explanation: q.explanation,
        hebrewExplanation: q.hebrewExplanation,
        wrongReasons: q.wrongReasons ?? [],
        passage: q.passage,
      });
    }
    breakdown[section.id] = { correct, total: qs.length };
  }

  const totalQuestions = reviewQuestions.length;
  const accuracyPercent = totalAnswered > 0
    ? Math.round((totalCorrect / totalAnswered) * 100)
    : 0;

  // For abandoned sessions we don't have a real Amiram-scaled score, so use
  // a conservative proportional estimate. The "completed" path uses the real
  // score from calculateMainScore; this helper is intended for the abandoned
  // path. Callers that compute a real score can override `estimatedScore`.
  const estimatedScore = totalQuestions > 0
    ? Math.max(50, Math.min(150, Math.round(50 + (totalCorrect / Math.max(1, totalQuestions)) * 100)))
    : 50;

  return {
    id: snap.id,
    completedAt: new Date().toISOString(),
    estimatedScore,
    accuracyPercent,
    durationSeconds: Math.max(0, Math.round((Date.now() - new Date(snap.startedAt).getTime()) / 1000)),
    sectionBreakdown: breakdown,
    isPilot: snap.sections.some((s) => s.isPilot),
    status,
    mode: snap.mode,
    questions: reviewQuestions,
  };
}
