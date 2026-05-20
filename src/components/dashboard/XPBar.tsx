"use client";
import { useLayoutEffect, useState } from "react";
import { Flame } from "lucide-react";
import { loadProgress } from "@/lib/progress/local-progress-store";
import { getLevelFromXp, getXpProgress } from "@/lib/gamification/xp-system";
import { useLang } from "@/contexts/LanguageContext";

export function XPBar() {
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const { t } = useLang();

  useLayoutEffect(() => {
    const p = loadProgress();
    setXp(p.xp ?? 0);
    setStreak(p.streak ?? 0);
  }, []);

  const level = getLevelFromXp(xp);
  const { current, needed, pct } = getXpProgress(xp);
  const levelName = (t.dashboard as unknown as Record<string, string>)[level.nameKey] ?? level.name;

  return (
    <div className="card animate-fade-up" style={{ padding: "0.875rem 1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--teal)" }}>
            {t.dashboard.level} {level.level}
          </span>
          <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>· {levelName}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {streak > 0 && (
            <span style={{ fontSize: "0.78rem", color: "var(--warn)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Flame size={13} strokeWidth={2} color="var(--warn)" />
              {streak} {t.dashboard.daysStreak}
            </span>
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
