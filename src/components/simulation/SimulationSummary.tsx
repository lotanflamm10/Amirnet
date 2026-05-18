"use client";
import Link from "next/link";
import type { SimulationFinalResult } from "@/lib/simulation/simulation-engine";
import { getScoreBand, formatScoreDisplay } from "@/lib/simulation/score-estimator";

interface Props {
  result: SimulationFinalResult;
  onRestart: () => void;
  onReview: () => void;
}

const BAND_COLORS: Record<string, string> = {
  success: "var(--success)",
  warn: "var(--warn)",
  danger: "var(--danger)",
  "ink-soft": "var(--ink-soft)",
};

export function SimulationSummary({ result, onRestart, onReview }: Props) {
  const { mainScore, pilotBonus, totalScore, sectionResults } = result;
  const band = getScoreBand(mainScore);
  const scoreDisplay = formatScoreDisplay(mainScore, pilotBonus);

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Score hero */}
      <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
          הדמיה הסתיימה / Simulation Complete
        </div>
        <div style={{ fontSize: "3rem", fontWeight: 900, fontFamily: "var(--font-display)", color: BAND_COLORS[band.color], lineHeight: 1.1 }}>
          {totalScore}
        </div>
        <div style={{ fontSize: "1rem", color: "var(--ink-soft)", marginTop: "0.25rem" }}>{scoreDisplay}</div>
        <div style={{ marginTop: "0.75rem", fontSize: "0.9rem", fontWeight: 600, color: BAND_COLORS[band.color] }}>
          {band.description}
        </div>

        {/* IMPORTANT disclaimer */}
        <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--ink-muted)", padding: "0.6rem 0.8rem", borderRadius: 8, background: "var(--raised)", border: "1px solid var(--line)" }}>
          This score estimate is unofficial and for practice only. Not affiliated with NITE or MALAM.
          <br />ציון זה אינו רשמי ומיועד לאימון בלבד. לא קשור לנית או מאל&quot;מ.
        </p>
      </div>

      {/* Section breakdown */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "1rem", color: "var(--ink)" }}>
          פירוט לפי סעיף / Section breakdown
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {sectionResults.map((r) => {
            const acc = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
            const barColor = acc >= 70 ? "var(--success)" : acc >= 50 ? "var(--warn)" : "var(--danger)";
            return (
              <div key={r.sectionId}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--ink)", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    {r.type}
                    {r.isPilot && <span style={{ fontSize: "0.65rem", padding: "1px 6px", borderRadius: 99, background: "rgba(245,158,11,0.15)", color: "var(--warn)" }}>pilot</span>}
                  </span>
                  <span style={{ color: "var(--ink-soft)" }}>{r.correct}/{r.total} ({acc}%)</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${acc}%`, background: barColor }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={onReview}>Review answers →</button>
        <Link href="/practice" className="btn btn-ghost">Practice weaknesses</Link>
        <button className="btn btn-ghost" onClick={onRestart}>New simulation</button>
        <Link href="/app" className="btn btn-ghost">Dashboard</Link>
      </div>
    </div>
  );
}
