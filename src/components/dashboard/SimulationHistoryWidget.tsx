"use client";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { BarChart2 } from "lucide-react";
import { flushAbandonedSimulation, loadProgress } from "@/lib/progress/local-progress-store";
import type { SimulationHistory } from "@/types/progress";
import { useLang } from "@/contexts/LanguageContext";

function ScoreColor(score: number) {
  if (score >= 130) return "var(--success)";
  if (score >= 110) return "var(--teal)";
  if (score >= 90)  return "var(--warn)";
  return "var(--danger)";
}

export function SimulationHistoryWidget() {
  const [history, setHistory] = useState<SimulationHistory[]>([]);
  const { lang } = useLang();
  const isHe = lang === "he";
  const locale = isHe ? "he-IL" : "en-US";

  useLayoutEffect(() => {
    // Flush any tab-closed simulation into history as "abandoned" before
    // we read it, so the widget reflects the latest state.
    flushAbandonedSimulation();
    const p = loadProgress();
    setHistory(p.simulationHistory.slice(0, 3));
  }, []);

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div className="section-header">
        <h3 className="section-title">{isHe ? "הדמיות" : "Simulations"}</h3>
        <Link href="/simulation" className="btn btn-ghost btn-xs">
          {isHe ? "חדשה" : "New"}
        </Link>
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: "center", padding: "0.75rem 0" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
            <BarChart2 size={28} color="var(--ink-muted)" strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", marginBottom: "0.75rem" }}>
            {isHe ? "עדיין אין הדמיות" : "No simulations yet"}
          </p>
          <Link href="/simulation" className="btn btn-ghost btn-sm">
            {isHe ? "התחל הדמיה" : "Start a simulation"}
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {history.map((h, i) => {
            const isAbandoned = h.status === "abandoned";
            const canReview = (h.questions?.length ?? 0) > 0;
            const reviewHref = canReview ? `/simulation/review/${encodeURIComponent(h.id)}` : "/simulation";
            return (
              <Link
                key={h.id}
                href={reviewHref}
                className="card-clickable animate-fade-up"
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.625rem 0.75rem", borderRadius: 10, background: "var(--raised)",
                  border: `1px solid ${isAbandoned ? "var(--warn)" : "var(--line)"}`,
                  animationDelay: `${i * 0.07}s`,
                  textDecoration: "none", color: "inherit", gap: "0.5rem",
                }}
                aria-label={
                  isHe
                    ? `סקור הדמיה (${new Date(h.completedAt).toLocaleDateString(locale)})`
                    : `Review simulation (${new Date(h.completedAt).toLocaleDateString(locale)})`
                }
              >
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                    {new Date(h.completedAt).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                  </span>
                  {isAbandoned && (
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--warn)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {isHe ? "ננטשה" : "Abandoned"}
                    </span>
                  )}
                </span>
                <span style={{
                  fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 800,
                  color: isAbandoned ? "var(--ink-soft)" : ScoreColor(h.estimatedScore),
                }}>
                  {isAbandoned ? "—" : h.estimatedScore}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                  {Math.round(h.accuracyPercent)}% {isHe ? "דיוק" : "acc"}
                </span>
                {canReview && (
                  <span style={{ fontSize: "0.72rem", color: "var(--teal)", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {isHe ? "סקירה ›" : "Review ›"}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
