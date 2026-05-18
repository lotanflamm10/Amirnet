"use client";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { loadProgress } from "@/lib/progress/local-progress-store";
import type { SimulationHistory } from "@/types/progress";

function ScoreColor(score: number) {
  if (score >= 130) return "var(--success)";
  if (score >= 110) return "var(--teal)";
  if (score >= 90)  return "var(--warn)";
  return "var(--danger)";
}

export function SimulationHistoryWidget() {
  const [history, setHistory] = useState<SimulationHistory[]>([]);

  useLayoutEffect(() => {
    const p = loadProgress();
    setHistory(p.simulationHistory.slice(0, 3));
  }, []);

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div className="section-header">
        <h3 className="section-title">הדמיות</h3>
        <Link href="/simulation" className="btn btn-ghost btn-xs">חדשה →</Link>
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: "center", padding: "0.75rem 0" }}>
          <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>📊</div>
          <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", marginBottom: "0.75rem" }}>
            עדיין אין הדמיות
          </p>
          <Link href="/simulation" className="btn btn-ghost btn-sm">התחל הדמיה →</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {history.map((h, i) => (
            <div key={h.id}
              className="animate-fade-up"
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.625rem 0.75rem", borderRadius: 10, background: "var(--raised)",
                animationDelay: `${i * 0.07}s`,
              }}
            >
              <span style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                {new Date(h.completedAt).toLocaleDateString("he-IL", { day: "numeric", month: "short" })}
              </span>
              <span style={{
                fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 800,
                color: ScoreColor(h.estimatedScore),
              }}>
                {h.estimatedScore}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                {Math.round(h.accuracyPercent)}% דיוק
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
