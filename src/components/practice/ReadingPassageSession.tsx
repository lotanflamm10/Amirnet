"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DifficultyFilter } from "@/lib/practice/question-selector";
import {
  getRecentReadingPassageIds,
  recordReadingPassageSeen,
  selectReadingPassage,
  type PassageBundle,
} from "@/lib/reading/reading-passages";
import {
  clearCurrentSession,
  completeSession,
  createSession,
  getSessionProgress,
  saveCurrentSession,
  submitAnswer,
} from "@/lib/practice/practice-engine";
import { recordSeen } from "@/lib/practice/question-history";
import { recordAnswer } from "@/lib/progress/local-progress-store";
import { formatTime } from "@/lib/practice/scoring";
import type { PracticeSession } from "@/types/questions";
import QuestionCard from "./QuestionCard";
import PracticeSummary from "./PracticeSummary";
import SelectionTranslator from "@/components/reading/SelectionTranslator";
import { useLang } from "@/contexts/LanguageContext";
import { ensureInView, focusWithoutJump } from "@/lib/ui/smooth-scroll";

interface Props {
  difficulty: DifficultyFilter;
}

const WARN_SECONDS = 600;
const DANGER_SECONDS = 1200;

export default function ReadingPassageSession({ difficulty }: Props) {
  const [bundle, setBundle] = useState<PassageBundle | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [finalSession, setFinalSession] = useState<PracticeSession | null>(null);
  const passageRef = useRef<HTMLDivElement | null>(null);
  const nextBtnRef = useRef<HTMLButtonElement | null>(null);
  const questionAnchorRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef<number>(0);
  const { t } = useLang();

  const initSession = useCallback(() => {
    const seen = getRecentReadingPassageIds();
    const next = selectReadingPassage(seen, { mode: "practice" });
    if (!next) {
      setBundle(null);
      return;
    }
    recordReadingPassageSeen(next.passage.id);

    const sess = createSession("reading", difficulty, next.questions.length);
    setBundle(next);
    setSession(sess);
    setCurrentIdx(0);
    setAnswered(false);
    setElapsed(0);
    setDone(false);
    setFinalSession(null);
    saveCurrentSession(sess);
    questionStartRef.current = Date.now();
  }, [difficulty]);

  useLayoutEffect(() => {
    initSession();
  }, [initSession]);

  useEffect(() => () => clearCurrentSession(), []);

  useEffect(() => {
    if (done || !session) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [done, session]);

  // When the Next button shows up, focus + scroll it into view smoothly so
  // the user never has to hunt for "what's next" after submitting.
  useEffect(() => {
    if (!answered) return;
    const id = window.setTimeout(() => focusWithoutJump(nextBtnRef.current), 60);
    return () => window.clearTimeout(id);
  }, [answered]);

  // When the active question changes, scroll the question header into view.
  useEffect(() => {
    if (answered) return;
    const id = window.setTimeout(() => ensureInView(questionAnchorRef.current, { threshold: 64 }), 30);
    return () => window.clearTimeout(id);
  }, [currentIdx, answered]);

  function handleSubmit(choiceIndex: number) {
    if (!session || answered || !bundle) return;
    const q = bundle.questions[currentIdx];
    if (!q) return;
    const seconds = Math.round((Date.now() - questionStartRef.current) / 1000);
    const { correct, session: updated } = submitAnswer(
      session,
      q.id,
      choiceIndex,
      seconds,
      q.answer,
      q.category,
    );
    setSession(updated);
    setAnswered(true);
    saveCurrentSession(updated);
    recordAnswer("reading", correct, seconds);
    recordSeen(q.id, "practice", q.text, choiceIndex, q.vocabularyWords);
  }

  function handleNext() {
    if (!session || !bundle) return;
    const next = currentIdx + 1;
    if (next >= bundle.questions.length) {
      const completed = completeSession(session);
      setFinalSession(completed);
      clearCurrentSession();
      if (timerRef.current) clearInterval(timerRef.current);
      setDone(true);
    } else {
      setCurrentIdx(next);
      setAnswered(false);
      questionStartRef.current = Date.now();
    }
  }

  function handlePracticeAgain() {
    initSession();
  }

  const paragraphs = useMemo(
    () => (bundle ? bundle.passage.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) : []),
    [bundle],
  );

  if (!bundle) {
    return (
      <div
        className="card"
        style={{
          padding: "3rem",
          textAlign: "center",
          color: "var(--ink-muted)",
          margin: "2rem auto",
          maxWidth: 520,
        }}
      >
        <p style={{ margin: 0 }}>{t.practice.noQuestionsAvailable}</p>
      </div>
    );
  }

  if (done && finalSession) {
    return (
      <PracticeSummary
        session={finalSession}
        mode="reading"
        totalTimeSeconds={elapsed}
        onPracticeAgain={handlePracticeAgain}
      />
    );
  }

  if (!session) return null;

  const q = bundle.questions[currentIdx];
  if (!q) return null;
  const progress = getSessionProgress(session);
  const total = bundle.questions.length;
  const progressPct = Math.round((currentIdx / total) * 100);
  const timerColor =
    elapsed >= DANGER_SECONDS
      ? "var(--danger)"
      : elapsed >= WARN_SECONDS
      ? "var(--warn)"
      : "var(--ink-soft)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <span style={{ color: "var(--ink-muted)", fontSize: "0.88rem" }}>
          {t.practice.question} {currentIdx + 1} {t.practice.of} {total}
        </span>
        <span style={{ color: "var(--teal)", fontSize: "0.88rem", fontWeight: 600 }}>
          {progress.correct} {t.practice.correctOfTotal}
        </span>
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

      <div className="progress-track">
        <div
          className={`progress-fill${
            elapsed >= DANGER_SECONDS ? " danger" : elapsed >= WARN_SECONDS ? " warn" : ""
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Passage card — rendered ONCE, persists across all questions */}
      <div
        ref={passageRef}
        dir="ltr"
        className="ltr-content card"
        style={{
          padding: "1.25rem 1.5rem",
          background: "var(--raised)",
          borderInlineStart: "4px solid var(--teal)",
          fontSize: "0.95rem",
          lineHeight: 1.8,
          color: "var(--ink)",
        }}
      >
        {bundle.passage.title && (
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "var(--ink)",
              marginBottom: "0.75rem",
            }}
          >
            {bundle.passage.title}
          </h2>
        )}
        {paragraphs.length === 0 ? (
          <p style={{ margin: 0, color: "var(--ink-soft)" }}>{bundle.passage.body}</p>
        ) : (
          paragraphs.map((p, i) => (
            <p
              key={i}
              style={{
                margin: i === 0 ? 0 : "0.875rem 0 0",
                color: "var(--ink-soft)",
              }}
            >
              {p}
            </p>
          ))
        )}
        {bundle.passage.source && (
          <footer
            style={{
              marginTop: "0.75rem",
              fontSize: "0.75rem",
              color: "var(--ink-muted)",
            }}
          >
            — {bundle.passage.source}
          </footer>
        )}
        <p
          style={{
            marginTop: "0.875rem",
            fontSize: "0.72rem",
            color: "var(--ink-muted)",
            fontStyle: "italic",
          }}
        >
          {t.practice.readingHint}
        </p>
      </div>

      <SelectionTranslator containerRef={passageRef} source="reading" />

      {/* Question — anchored so we can smooth-scroll to it on Next */}
      <div ref={questionAnchorRef}>
        <QuestionCard
          key={q.id}
          question={{ ...q, passage: undefined }}
          onSubmit={handleSubmit}
          disabled={answered}
          glossaryEnabled
        />
      </div>

      {answered && (
        <div className="next-action-bar animate-fade-up">
          <button
            ref={nextBtnRef}
            className="btn btn-primary animate-next-ready"
            onClick={handleNext}
            onKeyDown={(e) => { if (e.key === "Enter") handleNext(); }}
          >
            {currentIdx + 1 >= total ? t.practice.finishSession : t.practice.nextArrow}
          </button>
        </div>
      )}
    </div>
  );
}
