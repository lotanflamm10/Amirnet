import type { SectionConfig, SimMode } from "./simulation-config";
import { getSectionsByMode } from "./simulation-config";
import type { SectionResult } from "./score-estimator";
import { calculateMainScore } from "./score-estimator";
import { calculatePilotBonus } from "./pilot-bonus-calculator";

const SIM_KEY = "amirnet-sim-current";

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
    const correct = questions.filter((q) => sectionAns[q.id] === q.answer).length;
    return {
      sectionId: sec.id,
      isPilot: sec.isPilot,
      correct,
      total: questions.length,
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
  if (typeof window === "undefined") return;
  localStorage.setItem(SIM_KEY, JSON.stringify(state));
}

export function loadSimulationState(): SimulationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SIM_KEY);
    return raw ? (JSON.parse(raw) as SimulationState) : null;
  } catch { return null; }
}

export function clearSimulationState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SIM_KEY);
}
