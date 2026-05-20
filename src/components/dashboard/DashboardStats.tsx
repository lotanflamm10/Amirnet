"use client";
import { useLayoutEffect, useState } from "react";
import { CheckCircle2, Flame } from "lucide-react";
import { loadProgress } from "@/lib/progress/local-progress-store";
import type { UserProgress } from "@/types/progress";
import { useLang } from "@/contexts/LanguageContext";

export function DashboardStats() {
  const [p, setP] = useState<UserProgress | null>(null);
  const { t } = useLang();
  useLayoutEffect(() => { setP(loadProgress()); }, []);

  const goal = p?.dailyGoal;
  const pct  = goal ? Math.min(100, Math.round((goal.questionsAnsweredToday / goal.targetQuestions) * 100)) : 0;
  const acc  = p && p.totalQuestionsAnswered > 0
    ? Math.round((p.totalCorrect / p.totalQuestionsAnswered) * 100) : null;

  const barColor = pct >= 100 ? "var(--success)" : pct >= 60 ? "var(--teal)" : "var(--warn)";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>

      {/* Daily Goal */}
      <div className="stat-card animate-fade-up" style={{ gridColumn: "span 2" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
          <div>
            <p className="stat-label">{t.dashboard.statsDailyGoal}</p>
            <p className="stat-value" style={{ color: barColor, fontSize: "2rem", marginTop: "0.125rem" }}>
              {goal ? `${goal.questionsAnsweredToday}` : "—"}
              {goal && <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--ink-muted)", marginInlineStart: "0.25rem" }}>/ {goal.targetQuestions}</span>}
            </p>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: pct >= 100 ? "var(--success-sub)" : "var(--teal-sub)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {pct >= 100
              ? <CheckCircle2 size={20} color="var(--success)" strokeWidth={2} />
              : <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--teal)" }}>{pct}%</span>
            }
          </div>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <p className="stat-sub" style={{ marginTop: "0.375rem" }}>
          {pct >= 100
            ? t.dashboard.statsGoalReached
            : t.dashboard.statsRemainingPct.replace("{n}", String(100 - pct))}
        </p>
      </div>

      {/* Streak */}
      <div className="stat-card animate-fade-up delay-100">
        <p className="stat-label">{t.dashboard.statsDayStreak}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.375rem", marginTop: "0.25rem" }}>
          <span className="stat-value" style={{ color: p?.streak ? "var(--warn)" : "var(--ink-muted)" }}>
            {p?.streak ?? 0}
          </span>
          {(p?.streak ?? 0) > 0 && (
            <Flame size={18} color="var(--warn)" strokeWidth={2} style={{ marginBottom: 2 }} />
          )}
        </div>
        <p className="stat-sub">{t.dashboard.statsDaysInRow}</p>
      </div>

      {/* Estimated Score */}
      <div className="stat-card animate-fade-up delay-200">
        <p className="stat-label">{t.dashboard.statsEstScore}</p>
        <p className="stat-value" style={{
          color: p?.estimatedScore
            ? p.estimatedScore >= 130 ? "var(--success)"
            : p.estimatedScore >= 110 ? "var(--teal)"
            : p.estimatedScore >= 90  ? "var(--warn)"
            : "var(--danger)"
            : "var(--ink-muted)",
          marginTop: "0.25rem",
        }}>
          {p?.estimatedScore ?? "—"}
        </p>
        <p className="stat-sub">{t.dashboard.statsOutOf150}</p>
      </div>

      {/* Accuracy */}
      <div className="stat-card animate-fade-up delay-300">
        <p className="stat-label">{t.dashboard.statsAccuracy}</p>
        <p className="stat-value" style={{
          color: acc === null ? "var(--ink-muted)"
            : acc >= 75 ? "var(--success)"
            : acc >= 55 ? "var(--warn)"
            : "var(--danger)",
          marginTop: "0.25rem",
        }}>
          {acc !== null ? `${acc}%` : "—"}
        </p>
        <p className="stat-sub">{p?.totalQuestionsAnswered ?? 0} {t.dashboard.statsQuestionsUnit}</p>
      </div>

      {/* Total Answered */}
      <div className="stat-card animate-fade-up delay-400">
        <p className="stat-label">{t.dashboard.statsTotalQuestions}</p>
        <p className="stat-value" style={{ color: "var(--info)", marginTop: "0.25rem" }}>
          {p?.totalQuestionsAnswered ?? 0}
        </p>
        <p className="stat-sub">{p?.totalCorrect ?? 0} {t.dashboard.statsCorrectUnit}</p>
      </div>

    </div>
  );
}
