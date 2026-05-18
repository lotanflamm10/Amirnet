"use client";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { loadProgress } from "@/lib/progress/local-progress-store";
import { getWeakItems } from "@/lib/vocab/vocab-store";
import { withCustomItems } from "@/lib/vocab/custom-vocab-store";
import vocabData from "@/data/seed/vocab.normalized.json";
import type { VocabItem } from "@/types/vocab";
import type { CategoryProgress } from "@/types/progress";
import type { QuestionCategory } from "@/types/questions";

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  sentenceCompletion:  "השלמת משפטים",
  restatements:        "ניסוח מחדש",
  reading:             "הבנת הנקרא",
  grammar:             "דקדוק בהקשר",
  wordFormation:       "יצירת מילה",
  textCompletion:      "השלמת קטע שמע",
  lectureQuestions:    "שאלות הרצאה / שיחה",
  writingTask:         "מטלת כתיבה",
  vocabulary:          "אוצר מילים",
  mixed:               "מעורב",
  vocabularyInContext: "אוצר מילים בהקשר",
  synonymRecognition:  "זיהוי נרדפות",
  antonymRecognition:  "זיהוי הפכים",
  connectorPractice:   "מילות קישור",
  restatementMini:     "ניסוח מחדש מהיר",
  sentenceLogic:       "היגיון משפטי",
  distractorTrap:      "מלכודות ניסוח",
  academicPhrase:      "ביטויים אקדמיים",
};

function AccBar({ pct }: { pct: number }) {
  const color = pct < 50 ? "var(--danger)" : pct < 70 ? "var(--warn)" : "var(--success)";
  const bg    = pct < 50 ? "var(--danger-sub)" : pct < 70 ? "var(--warn-sub)" : "var(--success-sub)";
  return (
    <span style={{ fontSize: "0.78rem", fontWeight: 700, color, background: bg, padding: "0.15rem 0.5rem", borderRadius: 6 }}>
      {pct}%
    </span>
  );
}

export default function ReviewPage() {
  const [weakCats, setWeakCats]       = useState<CategoryProgress[]>([]);
  const [weakVocab, setWeakVocab]     = useState<VocabItem[]>([]);
  const [totalAnswered, setTotal]     = useState(0);

  useLayoutEffect(() => {
    const p = loadProgress();
    setTotal(p.totalQuestionsAnswered);
    const sorted = [...p.categoryProgress]
      .filter(c => c.totalAnswered >= 3)
      .sort((a, b) => a.accuracyPercent - b.accuracyPercent)
      .slice(0, 5);
    setWeakCats(sorted);
    setWeakVocab(getWeakItems(withCustomItems(vocabData as VocabItem[])).slice(0, 12));
  }, []);

  const hasData = weakCats.length > 0 || weakVocab.length > 0;

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 className="page-title">סקירה חכמה</h1>
        <p className="page-subtitle">חזור על הנושאים שבהם אתה חלש ביותר</p>
      </div>

      {!hasData && (
        <div className="card" style={{ padding: "2.5rem", textAlign: "center" }}>
          {totalAnswered === 0 ? (
            <>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📊</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.5rem" }}>
                עדיין אין נתונים
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                ענה על לפחות 3 שאלות בכל קטגוריה כדי לראות ניתוח חולשות
              </p>
              <Link href="/practice" className="btn btn-primary">התחל לתרגל →</Link>
            </>
          ) : (
            <>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🌟</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "var(--success)", marginBottom: "0.5rem" }}>
                כל הכבוד!
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                אין נקודות חולשה ברורות עדיין. המשך לתרגל לשמור על הרמה.
              </p>
              <Link href="/practice" className="btn btn-ghost">המשך לתרגל</Link>
            </>
          )}
        </div>
      )}

      {weakCats.length > 0 && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <div className="section-header">
            <h2 className="section-title">קטגוריות לשיפור</h2>
            <span className="badge badge-danger">{weakCats.length} נושאים</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {weakCats.map((c, i) => {
              const color = c.accuracyPercent < 50 ? "var(--danger)" : c.accuracyPercent < 70 ? "var(--warn)" : "var(--success)";
              const label = CATEGORY_LABELS[c.category as QuestionCategory] ?? c.category;
              return (
                <div key={c.category} className="animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ink)" }}>{label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <AccBar pct={c.accuracyPercent} />
                      <Link href={`/practice/${c.category}`} className="btn btn-ghost btn-xs">תרגל →</Link>
                    </div>
                  </div>
                  <div className="progress-track sm">
                    <div className="progress-fill" style={{ width: `${c.accuracyPercent}%`, background: color }} />
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "var(--ink-muted)", marginTop: "0.25rem" }}>
                    {c.totalCorrect}/{c.totalAnswered} נכון · ממוצע {c.averageTimeSeconds}ש׳ לשאלה
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {weakVocab.length > 0 && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <div className="section-header">
            <h2 className="section-title">מילים חלשות</h2>
            <Link href="/vocab/swipe" className="btn btn-ghost btn-xs">תרגל →</Link>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.875rem" }}>
            {weakVocab.map(v => (
              <span key={v.id} style={{
                padding: "0.3rem 0.75rem",
                borderRadius: 99,
                background: "var(--danger-sub)",
                border: "1px solid var(--danger)",
                fontSize: "0.82rem",
                color: "var(--ink)",
                display: "inline-flex", alignItems: "center", gap: "0.35rem",
              }}>
                <span style={{ fontWeight: 600 }}>{v.word}</span>
                <span style={{ color: "var(--ink-muted)", fontSize: "0.75rem" }}>— {v.hebrewTranslation}</span>
              </span>
            ))}
          </div>
          <Link href="/vocab/weak" className="btn btn-ghost btn-sm">ראה את כל המילים החלשות →</Link>
        </div>
      )}

      {hasData && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Link href="/practice" className="btn btn-primary btn-block" style={{ textAlign: "center" }}>תרגל עכשיו →</Link>
          <Link href="/vocab/swipe" className="btn btn-ghost btn-block" style={{ textAlign: "center" }}>מאמן מילים →</Link>
        </div>
      )}
    </div>
  );
}
