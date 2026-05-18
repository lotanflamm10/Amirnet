"use client";
import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { loadProgress } from "@/lib/progress/local-progress-store";
import { generateDailyPlan, type DailyPlanItem } from "@/lib/analytics/daily-plan";
import { getVocabStats } from "@/lib/vocab/vocab-store";
import { withCustomItems } from "@/lib/vocab/custom-vocab-store";
import vocabData from "@/data/seed/vocab.normalized.json";
import type { VocabItem } from "@/types/vocab";

export function TodaysTraining() {
  const [plan, setPlan] = useState<DailyPlanItem[]>([]);
  const [done, setDone] = useState(0);
  const [goal, setGoal] = useState(20);

  useLayoutEffect(() => {
    const p = loadProgress();
    const dueCount = getVocabStats(withCustomItems(vocabData as VocabItem[])).dueCount;
    const generated = generateDailyPlan(p, dueCount);
    setPlan(generated);
    setDone(p.dailyGoal.questionsAnsweredToday);
    setGoal(p.dailyGoal.targetQuestions);
  }, []);

  const totalItems = plan.reduce((s, i) => s + i.count, 0);
  const firstHref = plan.find(i => i.priority === "high")?.href ?? "/practice/mixed";

  return (
    <div className="card animate-fade-up" style={{ padding: "1.5rem" }}>
      <div className="section-header" style={{ marginBottom: "1rem" }}>
        <h2 className="section-title">תוכנית האימון של היום</h2>
        <span className="badge badge-teal">{totalItems} פעולות</span>
      </div>

      {done > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--ink-muted)", marginBottom: "0.35rem" }}>
            <span>התקדמות</span>
            <span>{done}/{goal}</span>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, (done / goal) * 100)}%` }} /></div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.25rem" }}>
        {plan.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "var(--raised)", borderRadius: 10, border: "1px solid var(--line)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.priority === "high" ? "var(--danger)" : item.priority === "medium" ? "var(--warn)" : "var(--teal)", flexShrink: 0 }} />
            <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ink)" }}>{item.label}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>{item.reason}</div>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: item.color, background: "var(--surface)", padding: "0.2rem 0.5rem", borderRadius: 6, whiteSpace: "nowrap" }}>
              {item.count} {item.type === "vocab" ? "מילים" : "שאלות"}
            </span>
            <Link href={item.href} className="btn btn-ghost btn-xs">→</Link>
          </div>
        ))}
      </div>

      <Link href={firstHref} className="btn btn-primary btn-lg btn-block" style={{ textAlign: "center" }}>
        התחל אימון היום →
      </Link>
    </div>
  );
}
