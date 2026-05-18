"use client";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { loadProgress } from "@/lib/progress/local-progress-store";
import type { CategoryProgress } from "@/types/progress";

const CAT_LABELS: Record<string, string> = {
  sentenceCompletion: "השלמת משפטים",
  restatements:       "ניסוח מחדש",
  reading:            "הבנת הנקרא",
  grammar:            "דקדוק",
  wordFormation:      "צורות מילים",
  textCompletion:     "השלמת טקסט",
  lectureQuestions:   "הרצאה",
  vocabulary:         "אוצר מילים",
  mixed:              "מעורב",
};

function AccuracyBadge({ pct }: { pct: number }) {
  const color = pct < 50 ? "var(--danger)" : pct < 70 ? "var(--warn)" : "var(--success)";
  const bg    = pct < 50 ? "var(--danger-sub)" : pct < 70 ? "var(--warn-sub)" : "var(--success-sub)";
  return (
    <span style={{ fontSize: "0.78rem", fontWeight: 700, color, background: bg, padding: "0.15rem 0.5rem", borderRadius: 6 }}>
      {pct}%
    </span>
  );
}

export function WeakAreas() {
  const [cats, setCats] = useState<CategoryProgress[]>([]);

  useLayoutEffect(() => {
    const p = loadProgress();
    const sorted = [...p.categoryProgress]
      .filter((c) => c.totalAnswered >= 3)
      .sort((a, b) => a.accuracyPercent - b.accuracyPercent)
      .slice(0, 5);
    setCats(sorted);
  }, []);

  if (cats.length === 0) {
    return (
      <div className="card" style={{ padding: "1.5rem" }}>
        <div className="section-header">
          <h3 className="section-title">נקודות לשיפור</h3>
        </div>
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📊</div>
          <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)", marginBottom: "0.375rem" }}>
            ענה על לפחות 3 שאלות בכל קטגוריה
          </p>
          <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", marginBottom: "1rem" }}>
            כדי לראות ניתוח חולשות ועוצמות
          </p>
          <Link href="/practice" className="btn btn-ghost btn-sm">התחל לתרגל →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div className="section-header">
        <h3 className="section-title">נקודות לשיפור</h3>
        <Link href="/review" className="btn btn-ghost btn-xs">ראה הכל →</Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {cats.map((c, i) => {
          const color = c.accuracyPercent < 50 ? "var(--danger)" : c.accuracyPercent < 70 ? "var(--warn)" : "var(--success)";
          const label = CAT_LABELS[c.category] ?? c.category;
          return (
            <div key={c.category} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.875rem", color: "var(--ink)", fontWeight: 600 }}>{label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <AccuracyBadge pct={c.accuracyPercent} />
                  <Link href={`/practice/${c.category}`}
                    style={{ fontSize: "0.72rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
                    תרגל →
                  </Link>
                </div>
              </div>
              <div className="progress-track sm">
                <div className="progress-fill" style={{ width: `${c.accuracyPercent}%`, background: color }} />
              </div>
              <p style={{ fontSize: "0.7rem", color: "var(--ink-muted)", marginTop: "0.25rem" }}>
                {c.totalCorrect}/{c.totalAnswered} נכון
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
