"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { SimulationHistory, SimulationHistoryQuestion } from "@/types/progress";
import { useLang } from "@/contexts/LanguageContext";
import { sectionTypeLabel } from "@/lib/simulation/section-labels";
import { renderBlanks } from "@/lib/practice/render-blanks";

interface Props {
  record: SimulationHistory;
}

type FilterMode = "all" | "wrong";

export function SimulationHistoryReview({ record }: Props) {
  const { t, lang } = useLang();
  const isHe = lang === "he";
  const [filter, setFilter] = useState<FilterMode>("all");

  const sections = useMemo(() => {
    const grouped = new Map<string, SimulationHistoryQuestion[]>();
    for (const q of record.questions ?? []) {
      const arr = grouped.get(q.sectionId) ?? [];
      arr.push(q);
      grouped.set(q.sectionId, arr);
    }
    return Array.from(grouped.entries()).map(([sectionId, questions]) => ({
      sectionId,
      questions,
    }));
  }, [record.questions]);

  if (!record.questions || record.questions.length === 0) {
    return (
      <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
        <p style={{ color: "var(--ink-muted)", margin: 0 }}>
          {isHe
            ? "אין נתוני שאלות עבור הדמיה זו (היא הוקלטה לפני שהוספנו שמירת תוכן שאלות)."
            : "No question data for this simulation (it was recorded before per-question review was added)."}
        </p>
        <div style={{ marginTop: "1rem" }}>
          <Link href="/simulation" className="btn btn-ghost btn-sm">
            {isHe ? "חזור" : "Back"}
          </Link>
        </div>
      </div>
    );
  }

  const allQuestions = record.questions;
  const totalAnswered = allQuestions.filter((q) => q.chosenIndex !== null).length;
  const totalCorrect = allQuestions.filter((q) => q.chosenIndex !== null && q.chosenIndex === q.answer).length;
  const wrongCount = allQuestions.filter((q) => q.chosenIndex === null || q.chosenIndex !== q.answer).length;

  const statusBadge =
    record.status === "abandoned"
      ? { text: isHe ? "ננטשה" : "Abandoned", color: "var(--warn)" }
      : { text: isHe ? "הושלמה" : "Completed", color: "var(--success)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            {isHe ? "סקירת הדמיה" : "Simulation Review"}
          </h1>
          <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", margin: "0.25rem 0 0" }}>
            {new Date(record.completedAt).toLocaleString(isHe ? "he-IL" : "en-US")}
            <span style={{ marginInlineStart: "0.6rem", color: statusBadge.color, fontWeight: 700 }}>
              · {statusBadge.text}
            </span>
          </p>
        </div>
        <Link href="/simulation" className="btn btn-ghost btn-sm">
          {isHe ? "חזור" : "Back"}
        </Link>
      </div>

      <div className="card" style={{ padding: "1rem 1.25rem", display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
        <Stat label={isHe ? "ענו" : "Answered"} value={`${totalAnswered}/${allQuestions.length}`} />
        <Stat label={isHe ? "נכון" : "Correct"} value={`${totalCorrect}`} color="var(--success)" />
        <Stat
          label={isHe ? "דיוק" : "Accuracy"}
          value={`${totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0}%`}
        />
        <Stat label={isHe ? "ציון משוער" : "Est. score"} value={`${record.estimatedScore}`} />
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          {isHe ? "כל השאלות" : "All questions"}
        </FilterChip>
        <FilterChip active={filter === "wrong"} onClick={() => setFilter("wrong")}>
          {isHe ? `רק שגויות (${wrongCount})` : `Wrong only (${wrongCount})`}
        </FilterChip>
      </div>

      {sections.map(({ sectionId, questions }) => {
        const visible = questions.filter(
          (q) => filter === "all" || q.chosenIndex === null || q.chosenIndex !== q.answer
        );
        if (visible.length === 0) return null;
        const firstQ = questions[0];
        const sectionLabel = sectionTypeLabel(firstQ.category, t);
        return (
          <section key={sectionId} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
              {sectionLabel}
            </h2>
            {visible.map((q, idx) => (
              <ReviewQuestion key={q.questionId} q={q} index={idx + 1} isHe={isHe} t={t} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.7rem", color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: color ?? "var(--ink)", fontFamily: "var(--font-display)" }}>
        {value}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        background: active ? "var(--teal)" : "var(--raised)",
        color: active ? "#fff" : "var(--ink-soft)",
        border: `1.5px solid ${active ? "var(--teal)" : "var(--line)"}`,
        borderRadius: 99,
        padding: "0.35rem 0.85rem",
        fontSize: "0.8rem",
        fontWeight: 600,
        cursor: "pointer",
        minHeight: 36,
      }}
    >
      {children}
    </button>
  );
}

function ReviewQuestion({
  q,
  index,
  isHe,
  t,
}: {
  q: SimulationHistoryQuestion;
  index: number;
  isHe: boolean;
  t: { simulation: { reviewCorrect: string; reviewWrong: string; reviewUnanswered: string; reviewExplanation: string } };
}) {
  const wasAnswered = q.chosenIndex !== null;
  const isCorrect = wasAnswered && q.chosenIndex === q.answer;

  return (
    <div className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
          {isHe ? `שאלה ${index}` : `Question ${index}`}
        </span>
        {wasAnswered ? (
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: isCorrect ? "var(--success)" : "var(--danger)" }}>
            {isCorrect ? `✓ ${t.simulation.reviewCorrect}` : `✗ ${t.simulation.reviewWrong}`}
          </span>
        ) : (
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--warn)" }}>
            {t.simulation.reviewUnanswered}
          </span>
        )}
      </div>

      {q.passage && (
        <details style={{ background: "var(--raised)", border: "1px solid var(--line)", borderRadius: 8, padding: "0.5rem 0.75rem" }}>
          <summary style={{ cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, color: "var(--ink-soft)" }}>
            {q.passage.title ?? (isHe ? "קטע" : "Passage")}
          </summary>
          <p className="ltr-content" style={{ fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.7, marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>
            {q.passage.body}
          </p>
        </details>
      )}

      <p className="ltr-content" style={{ fontSize: "0.95rem", color: "var(--ink)", margin: 0, lineHeight: 1.6 }}>
        {renderBlanks(q.text)}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {q.choices.map((choice, idx) => {
          const isCorrectChoice = idx === q.answer;
          const isChosen = idx === q.chosenIndex;
          let bg = "var(--raised)";
          let border = "var(--line)";
          let color = "var(--ink-soft)";
          if (isCorrectChoice) { bg = "var(--success-sub)"; border = "var(--success)"; color = "var(--success)"; }
          else if (isChosen && !isCorrect) { bg = "var(--danger-sub)"; border = "var(--danger)"; color = "var(--danger)"; }

          return (
            <div
              key={idx}
              style={{
                display: "flex", gap: "0.6rem", alignItems: "center",
                padding: "0.5rem 0.75rem", borderRadius: 8,
                border: `1.5px solid ${border}`, background: bg, color,
                fontSize: "0.88rem",
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: isCorrectChoice ? "var(--success)" : isChosen && !isCorrect ? "var(--danger)" : "var(--surface)",
                color: (isCorrectChoice || (isChosen && !isCorrect)) ? "#fff" : "var(--ink-muted)",
                fontSize: "0.7rem", fontWeight: 700,
              }}>
                {["A","B","C","D","E"][idx] ?? String(idx + 1)}
              </span>
              <span className="ltr-content" style={{ flex: 1 }}>{choice}</span>
              {isCorrectChoice && (
                <span style={{ fontSize: "0.7rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                  ✓
                </span>
              )}
              {isChosen && !isCorrect && (
                <span style={{ fontSize: "0.7rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                  ✗
                </span>
              )}
            </div>
          );
        })}
      </div>

      {q.explanation && (
        <div style={{ padding: "0.6rem 0.8rem", borderRadius: 8, background: "var(--raised)", border: "1px solid var(--line)" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {t.simulation.reviewExplanation}
          </div>
          <p className="ltr-content" style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: 0, lineHeight: 1.6 }}>
            {q.explanation}
          </p>
        </div>
      )}

      {q.hebrewExplanation && (
        <div style={{ padding: "0.6rem 0.8rem", borderRadius: 8, background: "var(--raised)", border: "1px solid var(--line)" }} dir="rtl">
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "0.3rem", letterSpacing: "0.05em" }}>
            הסבר בעברית
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {q.hebrewExplanation}
          </p>
        </div>
      )}

      {q.wrongReasons && q.wrongReasons.length > 0 && (
        <details style={{ borderTop: "1px dashed var(--line)", paddingTop: "0.6rem" }}>
          <summary style={{ cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, color: "var(--ink-muted)" }}>
            {isHe ? "מדוע שאר השגויות שגויות" : "Why the other choices are wrong"}
          </summary>
          <ul style={{ margin: "0.4rem 0 0 1rem", padding: 0, fontSize: "0.83rem", color: "var(--ink-soft)", lineHeight: 1.6 }}>
            {q.wrongReasons.map((reason, i) => (
              <li key={i} style={{ marginBottom: "0.2rem" }}>{reason}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
