"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import type { Question } from "@/types/questions";
import type { SessionMode, DifficultyFilter } from "@/lib/practice/question-selector";
import { selectQuestions } from "@/lib/practice/question-selector";
import { recordSeen, getPracticeSeenIds } from "@/lib/practice/question-history";
import {
  createSession,
  submitAnswer,
  completeSession,
  getSessionProgress,
  saveCurrentSession,
  clearCurrentSession,
} from "@/lib/practice/practice-engine";
import { recordAnswer, loadProgress } from "@/lib/progress/local-progress-store";
import { formatTime } from "@/lib/practice/scoring";
import QuestionCard from "./QuestionCard";
import { WritingTaskCard } from "@/components/simulation/WritingTaskCard";
import PracticeSummary from "./PracticeSummary";
import ReadingPassageSession from "./ReadingPassageSession";
import { Inbox } from "@/components/icons/NavIcons";
import { useLang } from "@/contexts/LanguageContext";
import { ensureInView, focusWithoutJump } from "@/lib/ui/smooth-scroll";
import type { PracticeSession as PracticeSessionType } from "@/types/questions";

const SESSION_QUESTIONS = 20;
const WRITING_SESSION_QUESTIONS = 1;
const WARN_SECONDS = 600;   // 10 min
const DANGER_SECONDS = 1200; // 20 min

interface Props {
  mode: SessionMode;
  difficulty: DifficultyFilter;
}

export default function PracticeSession({ mode, difficulty }: Props) {
  // Reading uses the AMIRAM-style passage flow: one passage of 5 questions.
  if (mode === "reading") {
    return <ReadingPassageSession difficulty={difficulty} />;
  }

  return <StandardPracticeSession mode={mode} difficulty={difficulty} />;
}

function StandardPracticeSession({ mode, difficulty }: Props) {
  const { t } = useLang();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [session, setSession] = useState<PracticeSessionType | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [finalSession, setFinalSession] = useState<PracticeSessionType | null>(null);
  const [writingText, setWritingText] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Initialized to 0; set to Date.now() inside initSession and handleNext (never during render)
  const questionStartRef = useRef<number>(0);
  const nextBtnRef = useRef<HTMLButtonElement | null>(null);
  const questionAnchorRef = useRef<HTMLDivElement | null>(null);

  const isWritingMode = mode === "writingTask";
  const sessionQuestionCount = isWritingMode ? WRITING_SESSION_QUESTIONS : SESSION_QUESTIONS;

  const initSession = useCallback(() => {
    // Use global history to exclude recently-seen practice questions (rolling 200-question window)
    const seenIds = getPracticeSeenIds(200);

    // Adaptive difficulty: feed the selector the student's category accuracy
    // (0–100) so the resolved band actually shifts above medium when they're
    // doing well. Only meaningful once the user has at least a handful of
    // attempts in this category; below that we let the selector fall back to
    // its neutral 60% assumption.
    let recentAccuracy: number | undefined;
    if (difficulty === "adaptive") {
      const cat = loadProgress().categoryProgress.find((c) => c.category === mode);
      if (cat && cat.totalAnswered >= 5) recentAccuracy = cat.accuracyPercent;
    }

    const qs = selectQuestions(mode, difficulty, sessionQuestionCount, seenIds, recentAccuracy);

    const sess = createSession(mode, difficulty, qs.length);
    setQuestions(qs);
    setSession(sess);
    setCurrentIdx(0);
    setAnswered(false);
    setElapsed(0);
    setDone(false);
    setFinalSession(null);
    setWritingText("");
    saveCurrentSession(sess);
    questionStartRef.current = Date.now();
  }, [mode, difficulty, sessionQuestionCount]);

  useLayoutEffect(() => {
    initSession();
  }, [initSession]);

  // Clear session from localStorage when navigating away mid-session
  useEffect(() => () => clearCurrentSession(), []);

  // Session timer
  useEffect(() => {
    if (done || !session) return;
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [done, session]);

  // When the Next button appears, focus + scroll it into view smoothly so
  // the user never has to scroll-hunt for the next step.
  useEffect(() => {
    if (!answered && !isWritingMode) return;
    const id = window.setTimeout(() => focusWithoutJump(nextBtnRef.current), 60);
    return () => window.clearTimeout(id);
  }, [answered, isWritingMode, currentIdx]);

  // When the active question changes, bring the question into view.
  useEffect(() => {
    if (answered) return;
    const id = window.setTimeout(() => ensureInView(questionAnchorRef.current, { threshold: 64 }), 30);
    return () => window.clearTimeout(id);
  }, [currentIdx, answered]);

  function handleSubmit(choiceIndex: number) {
    if (!session || answered) return;
    const q = questions[currentIdx];
    if (!q) return;

    // FIX: measure time for this question only, not total session elapsed time
    const questionSeconds = Math.round((Date.now() - questionStartRef.current) / 1000);

    const { correct, session: updated } = submitAnswer(
      session,
      q.id,
      choiceIndex,
      questionSeconds,
      q.answer,
      q.category,
    );

    setSession(updated);
    setAnswered(true);
    saveCurrentSession(updated);

    // FIX: use the question's own category (correct for mixed mode too)
    const category = (q.category ?? mode) as Parameters<typeof recordAnswer>[0];
    recordAnswer(category, correct, questionSeconds);

    // Global anti-repetition tracking (pass vocab words if skill booster)
    recordSeen(q.id, "practice", q.text, choiceIndex, q.vocabularyWords);
  }

  function handleNext() {
    if (!session) return;
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) {
      // Complete
      const completed = completeSession(session);
      setFinalSession(completed);
      clearCurrentSession();
      if (timerRef.current) clearInterval(timerRef.current);
      setDone(true);
    } else {
      setCurrentIdx(nextIdx);
      setAnswered(false);
      questionStartRef.current = Date.now(); // reset per-question timer
    }
  }

  function handleWritingComplete() {
    if (!session) return;
    const q = questions[currentIdx];
    if (q) {
      // Mirrors the simulation writing-pilot policy (Phase 2 FIX 1):
      // writing has no rubric, so we don't claim correctness or feed
      // anything into the writingTask category accuracy bucket. The
      // recordSeen call still preserves the question in the anti-repetition
      // history; recordAnswer is intentionally skipped.
      recordSeen(q.id, "practice", q.text, 0);
    }
    handleNext();
  }

  function handlePracticeAgain() {
    initSession();
  }

  if (questions.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: "3rem",
          textAlign: "center",
          color: "var(--ink-muted)",
          margin: "2rem auto",
          maxWidth: 480,
        }}
      >
        <div style={{ marginBottom: "0.75rem", display: "flex", justifyContent: "center" }} aria-hidden="true">
          <Inbox size={32} color="var(--ink-muted)" strokeWidth={2} />
        </div>
        <p style={{ margin: 0 }}>{t.practice.noQuestionsAvailable}</p>
      </div>
    );
  }

  if (done && finalSession) {
    return (
      <PracticeSummary
        session={finalSession}
        mode={mode}
        totalTimeSeconds={elapsed}
        onPracticeAgain={handlePracticeAgain}
      />
    );
  }

  if (!session) return null;

  const q = questions[currentIdx];
  if (!q) return null;

  const progress = getSessionProgress(session);
  const timerColor =
    elapsed >= DANGER_SECONDS
      ? "var(--danger)"
      : elapsed >= WARN_SECONDS
      ? "var(--warn)"
      : "var(--ink-soft)";

  const progressPct = Math.round((currentIdx / sessionQuestionCount) * 100);
  const writingMinWords = isWritingMode ? (q.wordLimitMin ?? 90) : 0;
  const writingWordCount = writingText.trim() === "" ? 0 : writingText.trim().split(/\s+/).length;
  const writingReady = !isWritingMode || writingWordCount >= writingMinWords;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 640, margin: "0 auto" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        {/* Question counter */}
        <span style={{ color: "var(--ink-muted)", fontSize: "0.88rem" }}>
          {t.practice.question} {currentIdx + 1} {t.practice.of} {sessionQuestionCount}
        </span>

        {/* Correct count */}
        <span style={{ color: "var(--teal)", fontSize: "0.88rem", fontWeight: 600 }}>
          {progress.correct} {t.practice.correctOfTotal}
        </span>

        {/* Timer */}
        <span
          style={{
            color: timerColor,
            fontVariantNumeric: "tabular-nums",
            fontWeight: 700,
            fontSize: "0.9rem",
            transition: "color 0.4s",
          }}
          className={elapsed >= DANGER_SECONDS ? "animate-pulse-timer" : undefined}
        >
          ⏱ {formatTime(elapsed)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="progress-track">
        <div
          className={`progress-fill${elapsed >= DANGER_SECONDS ? " danger" : elapsed >= WARN_SECONDS ? " warn" : ""}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Question card or writing task */}
      <div ref={questionAnchorRef}>
        {isWritingMode ? (
          <WritingTaskCard key={q.id} question={q} onTextChange={setWritingText} />
        ) : (
          <QuestionCard
            key={q.id}
            question={q}
            onSubmit={handleSubmit}
            disabled={answered}
            glossaryEnabled
          />
        )}
      </div>

      {/* Sticky Next / Done bar — always reachable without scrolling on mobile */}
      {(answered || isWritingMode) && (
        <div className="next-action-bar animate-fade-up">
          {isWritingMode && !writingReady && writingWordCount > 0 && (
            <span style={{ fontSize: "0.78rem", color: "var(--danger)", marginInlineEnd: "auto" }}>
              {t.practice.writingNeedMoreWords.replace(
                "{n}",
                String(writingMinWords - writingWordCount),
              )}
            </span>
          )}
          <button
            ref={nextBtnRef}
            className="btn btn-primary animate-next-ready"
            onClick={isWritingMode ? handleWritingComplete : handleNext}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (isWritingMode) handleWritingComplete();
                else handleNext();
              }
            }}
            disabled={isWritingMode && !writingReady}
          >
            {currentIdx + 1 >= questions.length ? t.practice.finishSession : t.practice.nextArrow}
          </button>
        </div>
      )}
    </div>
  );
}
