"use client";
import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecommendedActivity } from "@/components/dashboard/RecommendedActivity";
import { WeakAreas } from "@/components/dashboard/WeakAreas";
import { VocabDueWidget } from "@/components/dashboard/VocabDueWidget";
import { SimulationHistoryWidget } from "@/components/dashboard/SimulationHistoryWidget";
import { TodaysTraining } from "@/components/dashboard/TodaysTraining";
import { ReadinessWidget } from "@/components/dashboard/ReadinessWidget";
import { XPBar } from "@/components/dashboard/XPBar";
import { loadProgress } from "@/lib/progress/local-progress-store";

export default function DashboardPage() {
  const [showDiagnosticCTA, setShowDiagnosticCTA] = useState(false);

  useLayoutEffect(() => {
    const p = loadProgress();
    setShowDiagnosticCTA(!p.diagnosticCompleted);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="animate-fade-up">
        <h1 className="page-title">שלום 👋</h1>
        <p className="page-subtitle">מרכז ההכנה שלך לאמירנט</p>
      </div>

      {showDiagnosticCTA && (
        <div className="card animate-fade-up" style={{ padding: "1.25rem 1.5rem", borderColor: "var(--teal)", background: "var(--teal-faint)", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "2rem" }}>🔬</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.25rem" }}>גלה את הרמה האמיתית שלך</div>
            <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>15 שאלות · ~8 דקות · תוכנית אימון מותאמת אישית</div>
          </div>
          <Link href="/diagnostic" className="btn btn-primary">התחל בדיקת מיצוב →</Link>
        </div>
      )}

      <XPBar />
      <TodaysTraining />
      <ReadinessWidget />
      <DashboardStats />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
        <VocabDueWidget />
        <SimulationHistoryWidget />
      </div>

      <WeakAreas />
      <RecommendedActivity />

      <p style={{ fontSize: "0.7rem", color: "var(--ink-muted)", textAlign: "center" }}>
        כלי הכנה עצמאי לאמירנט · אינו קשור ל-NITE · ציונים וחיזויים אינם רשמיים
      </p>
    </div>
  );
}
