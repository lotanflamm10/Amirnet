"use client";
import { useState } from "react";
import type { SectionConfig } from "@/lib/simulation/simulation-config";
import type { Question } from "@/types/questions";

interface Props {
  sections: SectionConfig[];
  allSectionQuestions: Record<string, Question[]>;
  sectionAnswers: Record<string, Record<string, number>>;
  onDone: () => void;
}

export function SimulationReview({ sections, allSectionQuestions, sectionAnswers, onDone }: Props) {
  const [sectionIdx, setSectionIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);

  const section   = sections[sectionIdx];
  const sectionId = section?.id ?? "";
  const questions = allSectionQuestions[sectionId] ?? [];
  const answers   = sectionAnswers[sectionId] ?? {};
  const question  = questions[questionIdx];

  const goPrev = () => {
    if (questionIdx > 0) {
      setQuestionIdx((q) => q - 1);
    } else if (sectionIdx > 0) {
      const prevQs = allSectionQuestions[sections[sectionIdx - 1].id] ?? [];
      setSectionIdx((s) => s - 1);
      setQuestionIdx(Math.max(0, prevQs.length - 1));
    }
  };

  const goNext = () => {
    if (questionIdx < questions.length - 1) {
      setQuestionIdx((q) => q + 1);
    } else if (sectionIdx < sections.length - 1) {
      setSectionIdx((s) => s + 1);
      setQuestionIdx(0);
    }
  };

  const isFirst = sectionIdx === 0 && questionIdx === 0;
  const isLast  = sectionIdx === sections.length - 1 && questionIdx === questions.length - 1;

  if (!section || !question) return null;

  const chosenIdx  = answers[question.id];
  const isCorrect  = chosenIdx === question.answer;
  const wasAnswered = chosenIdx !== undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
          סקירת תשובות
        </h2>
        <button className="btn btn-ghost btn-sm" onClick={onDone}>← חזרה לתוצאות</button>
      </div>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {sections.map((sec, i) => {
          const secQs  = allSectionQuestions[sec.id] ?? [];
          const secAns = sectionAnswers[sec.id] ?? {};
          const correct = secQs.filter((q) => secAns[q.id] === q.answer).length;
          const isActive = sectionIdx === i;
          return (
            <button
              key={sec.id}
              onClick={() => { setSectionIdx(i); setQuestionIdx(0); }}
              style={{
                padding: "0.35rem 0.875rem", borderRadius: 99, cursor: "pointer",
                border: `1.5px solid ${isActive ? "var(--teal)" : "var(--line)"}`,
                background: isActive ? "var(--teal-faint)" : "var(--raised)",
                color: isActive ? "var(--teal)" : "var(--ink-soft)",
                fontSize: "0.78rem", fontWeight: 600,
              }}
            >
              {sec.label}
              <span style={{ marginRight: "0.35rem", opacity: 0.7, fontWeight: 400 }}>
                ({correct}/{secQs.length})
              </span>
            </button>
          );
        })}
      </div>

      {/* Question dots */}
      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
        {questions.map((q, i) => {
          const chosen  = answers[q.id];
          const isCurr  = i === questionIdx;
          const isRight = chosen === q.answer;
          const isWrong = chosen !== undefined && chosen !== q.answer;
          return (
            <button
              key={q.id}
              onClick={() => setQuestionIdx(i)}
              style={{
                width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer",
                fontSize: "0.75rem", fontWeight: 700,
                background: isCurr ? "var(--teal)"
                  : isRight ? "var(--success-sub)"
                  : isWrong ? "var(--danger-sub)"
                  : "var(--line)",
                color: isCurr ? "#fff"
                  : isRight ? "var(--success)"
                  : isWrong ? "var(--danger)"
                  : "var(--ink-muted)",
                outline: isCurr ? "2px solid var(--teal)" : "none",
                outlineOffset: 2,
              }}
            >{i + 1}</button>
          );
        })}
      </div>

      {/* Passage if available */}
      {question.passage && (
        <div className="card" style={{ padding: "1.25rem", background: "var(--raised)" }}>
          {question.passage.title && (
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {question.passage.title}
            </div>
          )}
          <p className="ltr-content" style={{ fontSize: "0.9rem", lineHeight: 1.75, color: "var(--ink-soft)", margin: 0 }}>
            {question.passage.body}
          </p>
        </div>
      )}

      {/* Question */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginBottom: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <span>שאלה {questionIdx + 1} מתוך {questions.length}</span>
          {!wasAnswered && <span style={{ color: "var(--warn)", fontWeight: 600 }}>• לא נענתה</span>}
          {wasAnswered && (
            <span style={{ color: isCorrect ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
              • {isCorrect ? "✓ נכון" : "✗ שגוי"}
            </span>
          )}
        </div>
        <p className="ltr-content" style={{ fontSize: "1rem", lineHeight: 1.7, color: "var(--ink)", margin: 0 }}>
          {question.text}
        </p>
      </div>

      {/* Choices */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {question.choices.map((choice, idx) => {
          const isCorrectChoice = idx === question.answer;
          const isChosen        = idx === chosenIdx;
          let bg     = "var(--raised)";
          let border = "var(--line)";
          let color  = "var(--ink-muted)";
          if (isCorrectChoice) { bg = "var(--success-sub)"; border = "var(--success)"; color = "var(--success)"; }
          else if (isChosen && !isCorrect) { bg = "var(--danger-sub)"; border = "var(--danger)"; color = "var(--danger)"; }
          else if (isChosen) { color = "var(--ink)"; }

          return (
            <div
              key={idx}
              style={{
                display: "flex", alignItems: "center", gap: "0.875rem",
                padding: "0.875rem 1rem", borderRadius: 10,
                border: `1.5px solid ${border}`, background: bg, color,
                fontSize: "0.9rem",
              }}
            >
              <span style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isCorrectChoice ? "var(--success)" : isChosen && !isCorrect ? "var(--danger)" : "var(--surface)",
                color: (isCorrectChoice || (isChosen && !isCorrect)) ? "#fff" : "var(--ink-soft)",
                fontSize: "0.75rem", fontWeight: 700,
              }}>
                {["A","B","C","D"][idx]}
              </span>
              <span className="ltr-content" style={{ flex: 1 }}>{choice}</span>
              {isCorrectChoice && <span style={{ fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" }}>✓ Correct</span>}
              {isChosen && !isCorrect && <span style={{ fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" }}>✗ Your answer</span>}
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      {question.explanation && (
        <div style={{ padding: "0.875rem 1rem", borderRadius: 8, background: "var(--raised)", border: "1px solid var(--line)" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            הסבר / Explanation
          </div>
          <p className="ltr-content" style={{ fontSize: "0.875rem", color: "var(--ink-soft)", margin: 0, lineHeight: 1.6 }}>
            {question.explanation}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", direction: "ltr" }}>
        <button className="btn btn-ghost btn-sm" disabled={isFirst} onClick={goPrev}>← Prev</button>
        <button className="btn btn-ghost btn-sm" disabled={isLast} onClick={goNext}>Next →</button>
      </div>
    </div>
  );
}
