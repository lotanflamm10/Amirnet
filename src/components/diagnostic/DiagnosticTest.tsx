"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import diagnosticQuestions from "@/data/seed/diagnostic-questions.json";
import { saveDiagnosticResult } from "@/lib/progress/local-progress-store";
import { useLang } from "@/contexts/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";
import { ensureInView } from "@/lib/ui/smooth-scroll";

type Screen = "intro" | "testing" | "results";

interface AnswerRecord {
  chosenIndex: number;
  correct: boolean;
  timeSeconds: number;
  category: string;
}

interface FeedbackState {
  chosen: number;
  correct: boolean;
}

interface DiagnosticQuestion {
  id: string;
  category: string;
  difficulty: string;
  text: string;
  choices: string[];
  answer: number;
  explanation: string;
  wrongReasons: string[];
  tags?: string[];
}

const questions = diagnosticQuestions as DiagnosticQuestion[];

function categoryLabel(cat: string, t: Translations): string {
  switch (cat) {
    case "sentenceCompletion": return t.dashboard.catSentenceCompletion;
    case "restatements":       return t.dashboard.catRestatements;
    case "grammar":            return t.dashboard.catGrammar;
    case "wordFormation":      return t.dashboard.catWordFormation;
    case "vocabulary":         return t.dashboard.catVocabulary;
    case "reading":            return t.dashboard.catReading;
    case "textCompletion":     return t.dashboard.catTextCompletion;
    case "lectureQuestions":   return t.dashboard.catLectureQuestions;
    default:                   return cat;
  }
}

export default function DiagnosticTest({ onComplete }: { onComplete: () => void }) {
  const [screen, setScreen] = useState<Screen>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [feedbackState, setFeedbackState] = useState<FeedbackState | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [resultData, setResultData] = useState<{ scoreLow: number; scoreHigh: number; catAccuracies: Record<string, number>; overallPct: number } | null>(null);
  const { t } = useLang();
  const questionRef = useRef<HTMLDivElement | null>(null);

  // Smooth-scroll the question into view after we advance, so the user
  // never has to find the next question manually.
  useEffect(() => {
    if (screen !== "testing") return;
    const id = window.setTimeout(() => ensureInView(questionRef.current, { threshold: 64 }), 30);
    return () => window.clearTimeout(id);
  }, [screen, currentIndex]);

  const computeResults = useCallback((finalAnswers: AnswerRecord[]) => {
    const catCorrect: Record<string, number> = {};
    const catTotal: Record<string, number> = {};
    let correctCount = 0;
    for (const a of finalAnswers) {
      catTotal[a.category] = (catTotal[a.category] ?? 0) + 1;
      if (a.correct) {
        correctCount++;
        catCorrect[a.category] = (catCorrect[a.category] ?? 0) + 1;
      } else {
        catCorrect[a.category] = catCorrect[a.category] ?? 0;
      }
    }
    const catResults: Record<string, number> = {};
    const catAccuracies: Record<string, number> = {};
    for (const cat of Object.keys(catTotal)) {
      const pct = Math.round(((catCorrect[cat] ?? 0) / catTotal[cat]) * 100);
      catResults[cat] = pct;
      catAccuracies[cat] = pct;
    }
    const accuracy = questions.length > 0 ? correctCount / questions.length : 0;
    const scoreLow = Math.max(50, Math.min(150, Math.round(70 + accuracy * 0.55 * 100)));
    const scoreHigh = Math.min(150, scoreLow + 12);
    saveDiagnosticResult(scoreLow, catResults);
    setResultData({ scoreLow, scoreHigh, catAccuracies, overallPct: Math.round(accuracy * 100) });
    setScreen("results");
  }, []);

  const handleChoice = useCallback((idx: number) => {
    if (feedbackState !== null) return;
    const q = questions[currentIndex];
    const correct = idx === q.answer;
    const timeSeconds = Math.round((Date.now() - questionStartTime) / 1000);
    const fb: FeedbackState = { chosen: idx, correct };
    setFeedbackState(fb);

    // 650ms gives enough time to read the correct/wrong cue without dragging
    // the test. Combined with the auto-scroll in useEffect, the next question
    // appears instantly under the user's eyes.
    setTimeout(() => {
      const newRecord: AnswerRecord = { chosenIndex: idx, correct, timeSeconds, category: q.category };
      const newAnswers = [...answers, newRecord];
      setAnswers(newAnswers);

      if (currentIndex >= questions.length - 1) {
        computeResults(newAnswers);
      } else {
        setCurrentIndex(currentIndex + 1);
        setFeedbackState(null);
        setQuestionStartTime(Date.now());
      }
    }, 650);
  }, [feedbackState, currentIndex, questionStartTime, answers, computeResults]);

  // INTRO SCREEN
  if (screen === "intro") {
    const badges = [
      t.diagnostic.badge15Questions,
      t.diagnostic.badge8Minutes,
      t.diagnostic.badgeNoTimePressure,
      t.diagnostic.badgeInstant,
    ];
    return (
      <div style={{ textAlign: "center", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem", padding: "2rem 1rem" }}>
        <div style={{ fontSize: "3.5rem" }}>🔬</div>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 900, color: "var(--ink)", marginBottom: "0.5rem" }}>
            {t.diagnostic.introTitle}
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", lineHeight: 1.6 }}>
            {t.diagnostic.introSubtitle}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
          {badges.map((label) => (
            <span key={label} style={{ background: "var(--raised)", border: "1px solid var(--line)", borderRadius: 99, padding: "0.3rem 0.75rem", fontSize: "0.78rem", color: "var(--ink-soft)" }}>{label}</span>
          ))}
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => {
            const now = Date.now();
            setQuestionStartTime(now);
            setScreen("testing");
          }}
        >
          {t.diagnostic.startCta}
        </button>
        <p style={{ fontSize: "0.7rem", color: "var(--ink-muted)" }}>{t.diagnostic.introDisclaimer}</p>
      </div>
    );
  }

  // TESTING SCREEN
  if (screen === "testing") {
    const q = questions[currentIndex];
    const choiceLabels = ["A", "B", "C", "D"];
    const progressPct = (currentIndex / 15) * 100;

    return (
      <div ref={questionRef} style={{ maxWidth: 560, margin: "0 auto", width: "100%", padding: "1rem" }}>
        {/* Progress */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--ink-muted)", marginBottom: "0.4rem" }}>
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>
              {t.diagnostic.questionOf.replace("{n}", String(currentIndex + 1))}
            </span>
            <span className="badge badge-teal">{categoryLabel(q.category, t)}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%`, transition: "width 0.3s ease" }} />
          </div>
        </div>

        {/* Question */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
          <p className="ltr-content" style={{ fontSize: "1rem", lineHeight: 1.7, color: "var(--ink)", margin: 0 }}>
            {q.text}
          </p>
        </div>

        {/* Choices */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {q.choices.map((choice, idx) => {
            let borderColor = "var(--line)";
            let bg = "var(--raised)";
            let color = "var(--ink)";

            if (feedbackState) {
              if (idx === q.answer) {
                borderColor = "var(--success)";
                bg = "var(--success-sub)";
                color = "var(--success)";
              } else if (idx === feedbackState.chosen && !feedbackState.correct) {
                borderColor = "var(--danger)";
                bg = "var(--danger-sub)";
                color = "var(--danger)";
              } else {
                color = "var(--ink-muted)";
              }
            }

            return (
              <button
                key={idx}
                disabled={feedbackState !== null}
                onClick={() => handleChoice(idx)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.875rem",
                  padding: "0.875rem 1rem", borderRadius: 10,
                  border: `1.5px solid ${borderColor}`, background: bg,
                  color, cursor: feedbackState ? "default" : "pointer",
                  textAlign: "left", fontSize: "0.9rem", fontWeight: 500,
                  transition: "all 0.2s ease", width: "100%",
                  fontFamily: "var(--font-body)",
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: feedbackState && idx === q.answer ? "var(--success)" : feedbackState && idx === feedbackState.chosen && !feedbackState.correct ? "var(--danger)" : "var(--surface)",
                  color: feedbackState && (idx === q.answer || (idx === feedbackState.chosen && !feedbackState.correct)) ? "#fff" : "var(--ink-soft)",
                  fontSize: "0.75rem", fontWeight: 700,
                }}>
                  {choiceLabels[idx]}
                </span>
                <span className="ltr-content" style={{ flex: 1 }}>{choice}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // RESULTS SCREEN
  if (screen === "results" && resultData) {
    const { scoreLow, scoreHigh, catAccuracies, overallPct } = resultData;
    const accuracyColor = overallPct >= 75 ? "var(--success)" : overallPct >= 55 ? "var(--warn)" : "var(--danger)";

    const catEntries = Object.entries(catAccuracies).sort((a, b) => b[1] - a[1]);
    const strongest = catEntries[0] ? categoryLabel(catEntries[0][0], t) : null;
    const weakest = catEntries[catEntries.length - 1] ? categoryLabel(catEntries[catEntries.length - 1][0], t) : null;

    return (
      <div style={{ maxWidth: 520, margin: "0 auto", width: "100%", padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Score card */}
        <div className="card animate-fade-up" style={{ padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            {t.diagnostic.estimatedScore}
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "4rem", fontWeight: 900, color: "var(--teal)", lineHeight: 1 }}>
            {scoreLow}–{scoreHigh}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)", marginTop: "0.5rem" }}>
            {t.diagnostic.estimatedScoreUnofficial}
          </div>
        </div>

        {/* Accuracy */}
        <div className="card animate-fade-up" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>{t.diagnostic.overallAccuracy}</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: accuracyColor }}>{overallPct}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${overallPct}%`, background: accuracyColor }} />
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card animate-fade-up" style={{ padding: "1.25rem" }}>
          <div className="section-title" style={{ marginBottom: "0.875rem" }}>{t.diagnostic.categoryBreakdown}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {catEntries.map(([cat, pct]) => {
              const color = pct >= 75 ? "var(--success)" : pct >= 55 ? "var(--warn)" : "var(--danger)";
              return (
                <div key={cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.25rem" }}>
                    <span style={{ color: "var(--ink-soft)" }}>{categoryLabel(cat, t)}</span>
                    <span style={{ fontWeight: 700, color }}>{pct}%</span>
                  </div>
                  <div className="progress-track" style={{ height: 5 }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {(strongest || weakest) && (
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
              {strongest && (
                <div style={{ fontSize: "0.78rem", color: "var(--success)" }}>
                  <strong>{t.diagnostic.yourStrongest}:</strong> {strongest}
                </div>
              )}
              {weakest && weakest !== strongest && (
                <div style={{ fontSize: "0.78rem", color: "var(--warn)" }}>
                  <strong>{t.diagnostic.needsImprovement}:</strong> {weakest}
                </div>
              )}
            </div>
          )}
        </div>

        <button className="btn btn-primary btn-xl btn-block" onClick={onComplete} style={{ textAlign: "center" }}>
          {t.diagnostic.continueCta}
        </button>
      </div>
    );
  }

  return null;
}
