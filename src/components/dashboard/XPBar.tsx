"use client";
import { useLayoutEffect, useState } from "react";
import { loadProgress } from "@/lib/progress/local-progress-store";
import { getLevelFromXp, getXpProgress } from "@/lib/gamification/xp-system";

export function XPBar() {
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

  useLayoutEffect(() => {
    const p = loadProgress();
    setXp(p.xp ?? 0);
    setStreak(p.streak ?? 0);
  }, []);

  const level = getLevelFromXp(xp);
  const { current, needed, pct } = getXpProgress(xp);

  return (
    <div className="card animate-fade-up" style={{ padding: "0.875rem 1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--teal)" }}>רמה {level.level}</span>
          <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>· {level.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {streak > 0 && (
            <span style={{ fontSize: "0.78rem", color: "var(--warn)", fontWeight: 600 }}>🔥 {streak} ימים</span>
          )}
          <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>{current}/{needed} XP</span>
        </div>
      </div>
      <div className="progress-track" style={{ height: 6 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: "var(--teal)" }} />
      </div>
    </div>
  );
}
