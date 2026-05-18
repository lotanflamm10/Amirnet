"use client";

import Link from "next/link";
import type { PracticeSession } from "@/types/questions";
import type { SessionMode } from "@/lib/practice/question-selector";
import { estimateScore, getScoreBand, calculateSessionAccuracy, formatTime } from "@/lib/practice/scoring";

interface Props {
  session: PracticeSession;
  mode: SessionMode;
  totalTimeSeconds: number;
  onPracticeAgain: () => void;
}

const BAND_COLORS: Record<string, string> = {
  success:    "var(--success)",
  warn:       "var(--warn)",
  danger:     "var(--danger)",
  "ink-soft": "var(--ink-soft)",
};

const BAND_BG: Record<string, string> = {
  success:    "var(--success-sub)",
  warn:       "var(--warn-sub)",
  danger:     "var(--danger-sub)",
  "ink-soft": "var(--raised)",
};

const MOTIVATING: Record<string, { text: string; emoji: string }> = {
  success:    { text: "מעולה! אתה ברמת פטור. המשך כך!", emoji: "🌟" },
  "ink-soft": { text: "ביצוע טוב — עוד קצת תרגול ותגיע לפטור.", emoji: "💪" },
  warn:       { text: "יש פוטנציאל — תתמקד בנושאים החלשים.", emoji: "📈" },
  danger:     { text: "אל תוותר! כל תרגול מקרב אותך למטרה.", emoji: "🎯" },
};

export default function PracticeSummary({ session, mode, totalTimeSeconds, onPracticeAgain }: Props) {
  const results  = session.results;
  const correct  = results.filter(r => r.correct).length;
  const total    = results.length;
  const accuracy = calculateSessionAccuracy(results);

  const category = mode === "mixed" || mode === "smartReview" ? "mixed"
    : mode === "restatements" ? "restatements"
    : mode as Parameters<typeof estimateScore>[2];

  const score     = estimateScore(correct, total, category);
  const band      = getScoreBand(score);
  const bandColor = BAND_COLORS[band.color];
  const bandBg    = BAND_BG[band.color];
  const motiv     = MOTIVATING[band.color];

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 520, margin: "0 auto" }}>
      {/* Hero score */}
      <div className="card" style={{
        padding: "2rem 1.5rem", textAlign: "center",
        borderColor: bandColor, background: bandBg,
      }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>{motiv.emoji}</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "4.5rem", fontWeight: 900, color: bandColor, lineHeight: 1 }}>
          {score}
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--ink-muted)", margin: "0.375rem 0 0.75rem" }}>
          ציון משוער (לא רשמי) · מתוך 150
        </div>
        <span style={{
          display: "inline-block", padding: "0.3rem 1rem", borderRadius: 99,
          background: `color-mix(in srgb, ${bandColor} 15%, transparent)`,
          color: bandColor, fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.875rem",
        }}>
          {band.label}
        </span>
        <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)", margin: 0, lineHeight: 1.55 }}>
          {motiv.text}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.625rem" }}>
        {[
          { label: "דיוק",       value: `${accuracy}%`,          color: accuracy >= 75 ? "var(--success)" : accuracy >= 55 ? "var(--warn)" : "var(--danger)" },
          { label: "נכון / סה״כ", value: `${correct}/${total}`,  color: "var(--ink)" },
          { label: "זמן",        value: formatTime(totalTimeSeconds), color: "var(--info)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card card-flat" style={{ padding: "1rem", textAlign: "center", background: "var(--raised)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "0.2rem" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Accuracy bar */}
      <div className="card" style={{ padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--ink-muted)", marginBottom: "0.5rem" }}>
          <span>0%</span>
          <span style={{ fontWeight: 700, color: bandColor }}>{accuracy}% דיוק</span>
          <span>100%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill"
            style={{ width: `${accuracy}%`, background: bandColor }} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        <button className="btn btn-primary btn-lg btn-block" onClick={onPracticeAgain}>
          תרגל שוב
        </button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
          <Link href="/review" className="btn btn-ghost btn-block" style={{ textAlign: "center" }}>
            סקור שגיאות
          </Link>
          <Link href="/app" className="btn btn-ghost btn-block" style={{ textAlign: "center" }}>
            לוח בקרה
          </Link>
        </div>
      </div>

      <p style={{ textAlign: "center", color: "var(--ink-muted)", fontSize: "0.7rem", lineHeight: 1.5 }}>
        ציון זה אינו רשמי ומיועד לאימון בלבד. לא קשור לנית או מאל&quot;מ.
      </p>
    </div>
  );
}
