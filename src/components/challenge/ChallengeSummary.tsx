"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { ChallengeSummary } from "@/lib/practice/challenge-history";
import { useLang } from "@/contexts/LanguageContext";

interface Props {
  summary: ChallengeSummary;
  onPlayAgain: () => void;
}

type FilterMode = "all" | "wrong";

const CAT_LABELS: Record<string, { he: string; en: string }> = {
  sentenceCompletion: { he: "השלמת משפטים", en: "Sentence Completion" },
  restatements: { he: "ניסוח מחדש", en: "Restatements" },
  reading: { he: "הבנת הנקרא", en: "Reading" },
  lectureQuestions: { he: "שאלות הרצאה", en: "Lecture Q" },
  textCompletion: { he: "השלמת קטע", en: "Text Completion" },
  grammar: { he: "דקדוק", en: "Grammar" },
  wordFormation: { he: "יצירת מילה", en: "Word Formation" },
  vocabularyInContext: { he: "אוצר מילים בהקשר", en: "Vocab in Context" },
  synonymRecognition: { he: "זיהוי נרדפים", en: "Synonyms" },
  antonymRecognition: { he: "זיהוי הפכים", en: "Antonyms" },
  connectorPractice: { he: "מילות קישור", en: "Connectors" },
  restatementMini: { he: "ניסוח מחדש קצר", en: "Restatement Mini" },
  sentenceLogic: { he: "הגיון משפט", en: "Sentence Logic" },
  distractorTrap: { he: "מלכודות", en: "Distractor Trap" },
  academicPhrase: { he: "ביטוי אקדמי", en: "Academic Phrase" },
};

function catLabel(cat: string, isHe: boolean): string {
  const entry = CAT_LABELS[cat];
  if (!entry) return cat;
  return isHe ? entry.he : entry.en;
}

export function ChallengeSummaryReport({ summary, onPlayAgain }: Props) {
  const { lang } = useLang();
  const isHe = lang === "he";
  const [filter, setFilter] = useState<FilterMode>("all");

  const accuracy = summary.totalQuestions > 0
    ? Math.round((summary.totalCorrect / summary.totalQuestions) * 100)
    : 0;

  const wrongQuestions = useMemo(
    () => summary.questions.filter((q) => q.chosenIndex === null || q.chosenIndex !== q.answer),
    [summary.questions]
  );

  const visible = filter === "all" ? summary.questions : wrongQuestions;

  // Categories with <50% accuracy — drives the "review weak areas" CTA
  const weakCategories = useMemo(() => {
    const stats = new Map<string, { correct: number; total: number }>();
    for (const q of summary.questions) {
      const s = stats.get(q.category) ?? { correct: 0, total: 0 };
      s.total += 1;
      if (q.chosenIndex !== null && q.chosenIndex === q.answer) s.correct += 1;
      stats.set(q.category, s);
    }
    return Array.from(stats.entries())
      .filter(([, s]) => s.total > 0 && s.correct / s.total < 0.5)
      .map(([cat]) => cat);
  }, [summary.questions]);

  return (
    <div dir={isHe ? "rtl" : "ltr"} className="animate-fade-up" style={{
      display: "flex", flexDirection: "column", gap: "1rem",
      maxWidth: 720, margin: "0 auto", width: "100%", minWidth: 0, boxSizing: "border-box",
    }}>
      {/* Score hero */}
      <div className="card" style={{ padding: "1.5rem 1.25rem", textAlign: "center" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {isHe ? "אתגר הושלם" : "Challenge Complete"}
        </div>
        <div style={{ fontSize: "clamp(2.5rem, 10vw, 3.5rem)", fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--teal)", lineHeight: 1, margin: "0.5rem 0 0.25rem" }}>
          {summary.totalScore}
        </div>
        <div style={{ color: "var(--ink-muted)", fontSize: "0.88rem" }}>
          {isHe
            ? `נקודות · ${accuracy}% דיוק · ${summary.totalCorrect}/${summary.totalQuestions} נכונות`
            : `points · ${accuracy}% accuracy · ${summary.totalCorrect}/${summary.totalQuestions} correct`}
        </div>
        {summary.maxStreak >= 3 && (
          <div style={{ marginTop: "0.5rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--warn)" }}>
            {isHe ? `רצף הטוב ביותר: ${summary.maxStreak}` : `Best streak: ${summary.maxStreak}`}
          </div>
        )}
      </div>

      {/* Filter row */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          {isHe ? `כל השאלות (${summary.questions.length})` : `All (${summary.questions.length})`}
        </FilterChip>
        <FilterChip active={filter === "wrong"} onClick={() => setFilter("wrong")}>
          {isHe ? `רק שגויות (${wrongQuestions.length})` : `Wrong only (${wrongQuestions.length})`}
        </FilterChip>
      </div>

      {/* Per-question rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {visible.length === 0 ? (
          <div className="card" style={{ padding: "1.5rem", textAlign: "center", color: "var(--ink-muted)" }}>
            {isHe ? "אין שאלות שגויות. כל הכבוד!" : "No wrong answers — great job!"}
          </div>
        ) : (
          visible.map((q, idx) => {
            const isCorrect = q.chosenIndex !== null && q.chosenIndex === q.answer;
            const wasAnswered = q.chosenIndex !== null;
            return (
              <div key={q.questionId} className="card" style={{ padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.74rem", color: "var(--ink-muted)" }}>
                    {isHe ? `שאלה ${idx + 1}` : `Q${idx + 1}`} · {catLabel(q.category, isHe)}
                  </span>
                  {wasAnswered ? (
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: isCorrect ? "var(--success)" : "var(--danger)" }}>
                      {isCorrect ? `✓ ${isHe ? "נכון" : "Correct"}` : `✗ ${isHe ? "שגוי" : "Wrong"}`}
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--warn)" }}>
                      {isHe ? "לא ענה" : "Skipped"}
                    </span>
                  )}
                </div>

                <p className="ltr-content" style={{ fontSize: "0.9rem", color: "var(--ink)", margin: 0, lineHeight: 1.55 }}>
                  {q.text}
                </p>

                <div className="ltr-content" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.35rem", fontSize: "0.85rem" }}>
                  {q.choices.map((choice, ci) => {
                    const isAns = ci === q.answer;
                    const isYour = ci === q.chosenIndex;
                    let bg = "transparent", color = "var(--ink-soft)", border = "var(--line)";
                    if (isAns) { bg = "var(--success-sub)"; color = "var(--success)"; border = "var(--success)"; }
                    else if (isYour && !isCorrect) { bg = "var(--danger-sub)"; color = "var(--danger)"; border = "var(--danger)"; }
                    return (
                      <div key={ci} style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.4rem 0.6rem", borderRadius: 6,
                        border: `1px solid ${border}`, background: bg, color,
                      }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, minWidth: 18 }}>{["A","B","C","D","E"][ci] ?? ci + 1}</span>
                        <span style={{ flex: 1 }}>{choice}</span>
                        {isAns && <span style={{ fontSize: "0.7rem", fontWeight: 700 }}>✓</span>}
                        {isYour && !isCorrect && <span style={{ fontSize: "0.7rem", fontWeight: 700 }}>✗</span>}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div style={{ padding: "0.5rem 0.7rem", borderRadius: 6, background: "var(--raised)", border: "1px solid var(--line)" }}>
                    <div style={{ fontSize: "0.66rem", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {isHe ? "הסבר" : "Explanation"}
                    </div>
                    <p className="ltr-content" style={{ fontSize: "0.84rem", color: "var(--ink-soft)", margin: 0, lineHeight: 1.55 }}>
                      {q.explanation}
                    </p>
                  </div>
                )}

                {q.hebrewExplanation && (
                  <div dir="rtl" style={{ padding: "0.5rem 0.7rem", borderRadius: 6, background: "var(--raised)", border: "1px solid var(--line)" }}>
                    <div style={{ fontSize: "0.66rem", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "0.2rem", letterSpacing: "0.05em" }}>
                      הסבר בעברית
                    </div>
                    <p style={{ fontSize: "0.84rem", color: "var(--ink-soft)", margin: 0, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                      {q.hebrewExplanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={onPlayAgain} style={{ flex: "1 1 200px", minWidth: 0 }}>
          {isHe ? "שחק שוב" : "Play Again"}
        </button>
        <Link
          href="/practice/smartReview"
          className="btn btn-ghost"
          aria-label={isHe ? "שמור לתור הסקירה ועבור לתרגול חכם" : "Save to review queue — open smart review"}
        >
          {weakCategories.length > 0
            ? (isHe ? "שמור לתור הסקירה" : "Save to review queue")
            : (isHe ? "תרגול חכם" : "Smart Review")}
        </Link>
        <Link href="/challenge" className="btn btn-ghost">{isHe ? "מסך אתגרים" : "Challenges"}</Link>
        <Link href="/app" className="btn btn-ghost">{isHe ? "לוח בקרה" : "Dashboard"}</Link>
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
        padding: "0.4rem 0.85rem",
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
