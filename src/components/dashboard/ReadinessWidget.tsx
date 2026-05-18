"use client";
import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { loadProgress } from "@/lib/progress/local-progress-store";
import { calculateReadinessScore, predictScoreRange, getBlockers } from "@/lib/analytics/mastery-engine";
import type { UserProgress } from "@/types/progress";

export function ReadinessWidget() {
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useLayoutEffect(() => {
    setProgress(loadProgress());
  }, []);

  if (!progress) return null;

  const hasData = progress.categoryProgress.filter(c => c.totalAnswered >= 3).length > 0 || progress.diagnosticCompleted;

  if (!hasData) {
    return (
      <div className="card animate-fade-up" style={{ padding: "1.25rem", borderColor: "var(--teal)", background: "var(--teal-faint)", display: "flex", gap: "1rem", alignItems: "center" }}>
        <span style={{ fontSize: "1.5rem" }}>📊</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.9rem", marginBottom: "0.2rem" }}>מדד המוכנות שלך</div>
          <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>השלם בדיקת מיצוב או תרגל כדי לראות את ניבוי הציון שלך</div>
        </div>
        <Link href="/diagnostic" className="btn btn-primary btn-sm">בדיקת מיצוב</Link>
      </div>
    );
  }

  const readiness = calculateReadinessScore(progress);
  const { low, high } = predictScoreRange(progress);
  const blockers = getBlockers(progress);
  const target = progress.targetScore ?? 134;
  const readinessColor = readiness >= 70 ? "var(--success)" : readiness >= 50 ? "var(--warn)" : "var(--danger)";
  const readinessLabel = readiness >= 70 ? "כמעט מוכן! 🚀" : readiness >= 50 ? "בדרך הנכונה 💪" : "עוד עבודה לפנינו 📈";

  return (
    <div className="card animate-fade-up" style={{ padding: "1.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: blockers.length > 0 ? "1rem" : 0 }}>
        <div>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>מוכנות לאמירנט</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "3.5rem", fontWeight: 900, color: readinessColor, lineHeight: 1 }}>{readiness}%</div>
          <div style={{ fontSize: "0.78rem", color: readinessColor, marginTop: "0.25rem", fontWeight: 600 }}>{readinessLabel}</div>
          <div className="progress-track" style={{ marginTop: "0.75rem" }}>
            <div className="progress-fill" style={{ width: `${readiness}%`, background: readinessColor }} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>ציון משוער</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 900, color: "var(--teal)", lineHeight: 1 }}>{low}–{high}</div>
          <div style={{ fontSize: "0.7rem", color: "var(--ink-muted)", marginTop: "0.25rem" }}>לא רשמי · מתוך 150</div>
          <div style={{ marginTop: "0.625rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "var(--raised)", border: "1px solid var(--line)", borderRadius: 8, padding: "0.3rem 0.625rem", fontSize: "0.75rem", color: "var(--ink-soft)" }}>
            🎯 מטרה: <strong style={{ color: "var(--ink)" }}>{target}</strong>
          </div>
        </div>
      </div>
      {blockers.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>פערים עיקריים:</span>
          {blockers.map(b => <span key={b} className="badge badge-warn">{b}</span>)}
        </div>
      )}
    </div>
  );
}
