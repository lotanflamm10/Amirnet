"use client";
import { useReducer, useRef, useCallback, useLayoutEffect, useEffect } from "react";
import type { SimMode } from "@/lib/simulation/simulation-config";
import {
  createSimulation, recordAnswer, setCurrentQuestion,
  advanceToNextSection, resumeSection, calculateFinalResults,
  saveSimulationState, clearSimulationState,
  type SimulationState, type SimulationFinalResult,
} from "@/lib/simulation/simulation-engine";
import { recordSimulation } from "@/lib/progress/local-progress-store";
import { recordSeen, hashSentence } from "@/lib/practice/question-history";
import { selectAdaptiveQuestions } from "@/lib/simulation/adaptive-selector";
import type { Question } from "@/types/questions";
import QuestionCard from "@/components/practice/QuestionCard";
import { WritingTaskCard } from "./WritingTaskCard";
import { SimulationTimer } from "./SimulationTimer";
import { SectionTransition } from "./SectionTransition";
import { PilotSectionIntro } from "./PilotSectionIntro";
import { SimulationSummary } from "./SimulationSummary";
import { SimulationReview } from "./SimulationReview";
import questionsRaw from "@/data/seed/questions.json";
import hardAddon from "@/data/seed/hard_questions_addon.json";

type RawQ = Record<string, Question[]>;

function buildQuestionsPool(): RawQ {
  const base  = questionsRaw as unknown as RawQ;
  const addon = hardAddon  as unknown as RawQ;
  const merged: RawQ = { ...base };
  for (const [k, v] of Object.entries(addon)) {
    const existing = new Set((merged[k] ?? []).map((q) => q.id));
    merged[k] = [...(merged[k] ?? []), ...v.filter((q) => !existing.has(q.id))];
  }
  return merged;
}

const POOL = buildQuestionsPool();

// ── State machine ────────────────────────────────────────────────────────────

interface RunnerState {
  sim: SimulationState;
  sectionQuestions: Question[];
  allSectionQuestions: Record<string, Question[]>;
  finalResult: SimulationFinalResult | null;
  phase: "active" | "between-sections" | "pilot-intro" | "done" | "review";
}

type RunnerAction =
  | { type: "ANSWER";           questionId: string; choiceIdx: number }
  | { type: "NAV_QUESTION";     idx: number }
  | { type: "EXPIRE_SECTION" }
  | { type: "LOAD_NEXT_SECTION"; sectionId: string; questions: Question[] }
  | { type: "DISMISS_PILOT_INTRO" }
  | { type: "START_REVIEW" }
  | { type: "EXIT_REVIEW" }
  | { type: "RESTART";          state: RunnerState };

function simReducer(state: RunnerState, action: RunnerAction): RunnerState {
  switch (action.type) {
    case "ANSWER": {
      if (state.phase !== "active") return state;
      return { ...state, sim: recordAnswer(state.sim, action.questionId, action.choiceIdx) };
    }
    case "NAV_QUESTION": {
      if (state.phase !== "active") return state;
      return { ...state, sim: setCurrentQuestion(state.sim, action.idx) };
    }
    case "EXPIRE_SECTION": {
      if (state.phase === "done" || state.sim.status === "complete") return state;
      const nextSim = advanceToNextSection(state.sim);
      if (nextSim.status === "complete") {
        const qsBySection: Record<string, { id: string; answer: number }[]> = {};
        for (const [secId, qs] of Object.entries(state.allSectionQuestions)) {
          qsBySection[secId] = qs.map((q) => ({ id: q.id, answer: q.answer }));
        }
        const finalResult = calculateFinalResults(nextSim, qsBySection);
        return { ...state, sim: nextSim, finalResult, phase: "done" };
      }
      return { ...state, sim: nextSim, phase: "between-sections" };
    }
    case "LOAD_NEXT_SECTION": {
      const currentSec = state.sim.sections[state.sim.currentSectionIndex];
      return {
        ...state,
        sectionQuestions: action.questions,
        allSectionQuestions: { ...state.allSectionQuestions, [action.sectionId]: action.questions },
        sim: resumeSection(state.sim),
        phase: currentSec?.isPilot ? "pilot-intro" : "active",
      };
    }
    case "DISMISS_PILOT_INTRO": return { ...state, phase: "active" };
    case "START_REVIEW":        return { ...state, phase: "review" };
    case "EXIT_REVIEW":         return { ...state, phase: "done" };
    case "RESTART":             return action.state;
  }
}

function makeInitialState(mode: SimMode): RunnerState {
  const sim = createSimulation(mode);
  const qs  = selectAdaptiveQuestions(sim.sections[0], POOL);
  return {
    sim,
    sectionQuestions: qs,
    allSectionQuestions: { [sim.sections[0].id]: qs },
    finalResult: null,
    phase: "active",
  };
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props { mode: SimMode }

export function SimulationRunner({ mode }: Props) {
  const [state, dispatch] = useReducer(simReducer, undefined, () => makeInitialState(mode));

  // Mutable dedup sets — not reactive, live outside reducer
  const seenIds    = useRef(new Set<string>());
  const seenHashes = useRef(new Set<string>());
  const recordedRef = useRef(false);

  // Seed dedup sets from section 0 questions
  useLayoutEffect(() => {
    state.sectionQuestions.forEach((q) => {
      seenIds.current.add(q.id);
      seenHashes.current.add(hashSentence(q.text));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist simulation state (skip when done/review — clearSimulationState handles cleanup)
  useEffect(() => {
    if (state.phase !== "done" && state.phase !== "review") {
      saveSimulationState(state.sim);
    }
  }, [state.sim, state.phase]);

  // Record completed simulation exactly once
  useEffect(() => {
    if (state.phase !== "done" || !state.finalResult || recordedRef.current) return;
    recordedRef.current = true;
    const result = state.finalResult;
    const totalAnswered = result.sectionResults.reduce((s, r) => s + r.total, 0);
    const totalCorrect  = result.sectionResults.reduce((s, r) => s + r.correct, 0);
    const breakdown: Record<string, { correct: number; total: number }> = {};
    result.sectionResults.forEach((r) => { breakdown[r.sectionId] = { correct: r.correct, total: r.total }; });
    recordSimulation({
      id: state.sim.id,
      completedAt: new Date().toISOString(),
      estimatedScore: result.totalScore,
      accuracyPercent: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
      durationSeconds: Math.round((Date.now() - new Date(state.sim.startedAt).getTime()) / 1000),
      sectionBreakdown: breakdown,
      isPilot: state.sim.sections.some((s) => s.isPilot),
    });
    clearSimulationState();
  }, [state.phase, state.finalResult, state.sim]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAnswer = useCallback((choiceIdx: number) => {
    const currentQ = state.sectionQuestions[state.sim.currentQuestionIndex];
    if (!currentQ) return;
    dispatch({ type: "ANSWER", questionId: currentQ.id, choiceIdx });
    recordSeen(currentQ.id, "simulation", currentQ.text, choiceIdx);
  }, [state.sectionQuestions, state.sim.currentQuestionIndex]);

  const handleNavQ = useCallback((idx: number) => {
    dispatch({ type: "NAV_QUESTION", idx });
  }, []);

  const handleSectionExpire = useCallback(() => {
    dispatch({ type: "EXPIRE_SECTION" });
  }, []);

  const handleContinueSection = useCallback(() => {
    const nextSec = state.sim.sections[state.sim.currentSectionIndex];
    if (!nextSec) return;
    const qs = selectAdaptiveQuestions(nextSec, POOL, undefined, seenIds.current, seenHashes.current);
    qs.forEach((q) => {
      seenIds.current.add(q.id);
      seenHashes.current.add(hashSentence(q.text));
    });
    dispatch({ type: "LOAD_NEXT_SECTION", sectionId: nextSec.id, questions: qs });
  }, [state.sim]);

  const handlePilotIntroContinue = useCallback(() => {
    dispatch({ type: "DISMISS_PILOT_INTRO" });
  }, []);

  // Writing task text — stored in a ref (not reactive; only read on section expiry)
  const writingTextRef = useRef("");

  const handleRestart = useCallback(() => {
    const freshState = makeInitialState(mode);
    seenIds.current   = new Set(freshState.sectionQuestions.map((q) => q.id));
    seenHashes.current = new Set(freshState.sectionQuestions.map((q) => hashSentence(q.text)));
    recordedRef.current = false;
    dispatch({ type: "RESTART", state: freshState });
  }, [mode]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (state.phase === "review" && state.finalResult) {
    return (
      <SimulationReview
        sections={state.sim.sections}
        allSectionQuestions={state.allSectionQuestions}
        sectionAnswers={state.sim.sectionAnswers}
        onDone={() => dispatch({ type: "EXIT_REVIEW" })}
      />
    );
  }

  if (state.phase === "done" && state.finalResult) {
    return (
      <SimulationSummary
        result={state.finalResult}
        onRestart={handleRestart}
        onReview={() => dispatch({ type: "START_REVIEW" })}
      />
    );
  }

  if (state.phase === "pilot-intro") {
    const sec = state.sim.sections[state.sim.currentSectionIndex];
    return <PilotSectionIntro label={sec.label} onContinue={handlePilotIntroContinue} />;
  }

  if (state.phase === "between-sections") {
    const nextSec = state.sim.sections[state.sim.currentSectionIndex];
    return (
      <SectionTransition
        sectionNumber={state.sim.currentSectionIndex + 1}
        sectionLabel={nextSec.label}
        timeLimitSeconds={nextSec.timeLimitSeconds}
        onContinue={handleContinueSection}
      />
    );
  }

  // Active question view
  const { sim, sectionQuestions } = state;
  const currentSection = sim.sections[sim.currentSectionIndex];
  const currentQ       = sectionQuestions[sim.currentQuestionIndex];
  const sectionId      = currentSection?.id ?? "";
  const answeredCount  = Object.keys(sim.sectionAnswers[sectionId] ?? {}).length;
  const chosenIndex    = sim.sectionAnswers[sectionId]?.[currentQ?.id ?? ""];
  const isAnswered     = chosenIndex !== undefined;
  const isWritingSection = currentSection?.type === "writingTask";

  if (!currentQ) {
    return (
      <div style={{ padding: "2rem", color: "var(--ink-muted)", textAlign: "center" }}>
        Loading questions…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Section top bar */}
      <div className="card" style={{
        padding: "0.75rem 1rem",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: "0.5rem",
      }}>
        <div>
          <span style={{ fontSize: "0.7rem", color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            פרק {sim.currentSectionIndex + 1}/{sim.sections.length}
            {currentSection?.isPilot && <span style={{ marginRight: "0.4rem", color: "var(--warn)" }}>● ניסיוני</span>}
          </span>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)" }}>{currentSection?.label}</div>
        </div>
        <SimulationTimer
          key={sectionId}
          totalSeconds={currentSection?.timeLimitSeconds ?? 240}
          onExpire={handleSectionExpire}
        />
      </div>

      {/* Question dots — hidden for writing task (single open-ended task) */}
      {!isWritingSection && (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
          {sectionQuestions.map((q, i) => {
            const isQ_answered = sim.sectionAnswers[sectionId]?.[q.id] !== undefined;
            const isCurrent    = i === sim.currentQuestionIndex;
            return (
              <button key={q.id} onClick={() => handleNavQ(i)}
                style={{
                  width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer",
                  fontSize: "0.75rem", fontWeight: 700,
                  background: isCurrent ? "var(--teal)" : isQ_answered ? "var(--raised)" : "var(--line)",
                  color: isCurrent ? "#fff" : isQ_answered ? "var(--ink-soft)" : "var(--ink-muted)",
                  outline: isCurrent ? "2px solid var(--teal)" : "none",
                  outlineOffset: 2,
                }}
              >{i + 1}</button>
            );
          })}
          <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--ink-muted)" }}>
            {answeredCount}/{sectionQuestions.length} answered
          </span>
        </div>
      )}

      {/* Writing task — open textarea with live word counter */}
      {isWritingSection ? (
        <WritingTaskCard
          key={currentQ.id}
          question={currentQ}
          onTextChange={(t) => { writingTextRef.current = t; }}
        />
      ) : (
        /* Multiple-choice — simulation variant: clicking a choice records it immediately, no feedback */
        <QuestionCard
          key={currentQ.id}
          question={currentQ}
          onSubmit={handleAnswer}
          disabled={isAnswered}
          chosenIndex={chosenIndex}
          showFeedback={false}
          variant="simulation"
        />
      )}

      {/* Navigation — LTR so Prev is always left, Next always right */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", direction: "ltr" }}>
        {!isWritingSection ? (
          <button
            className="btn btn-ghost btn-sm"
            disabled={sim.currentQuestionIndex === 0}
            onClick={() => handleNavQ(sim.currentQuestionIndex - 1)}
          >← Prev</button>
        ) : <span />}

        {!isWritingSection && sim.currentQuestionIndex < sectionQuestions.length - 1 ? (
          <button className="btn btn-ghost btn-sm" onClick={() => handleNavQ(sim.currentQuestionIndex + 1)}>
            Next →
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={handleSectionExpire}>
            {sim.currentSectionIndex < sim.sections.length - 1 ? "המשך לפרק הבא →" : "סיים הדמיה →"}
          </button>
        )}
      </div>
    </div>
  );
}
