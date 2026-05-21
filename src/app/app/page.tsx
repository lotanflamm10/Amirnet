"use client";
import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { Target } from "lucide-react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecommendedActivity } from "@/components/dashboard/RecommendedActivity";
import { WeakAreas } from "@/components/dashboard/WeakAreas";
import { VocabDueWidget } from "@/components/dashboard/VocabDueWidget";
import { SimulationHistoryWidget } from "@/components/dashboard/SimulationHistoryWidget";
import { TodaysTraining } from "@/components/dashboard/TodaysTraining";
import { ReadinessWidget } from "@/components/dashboard/ReadinessWidget";
import { XPBar } from "@/components/dashboard/XPBar";
import { loadProgress } from "@/lib/progress/local-progress-store";
import { useLang } from "@/contexts/LanguageContext";

export default function DashboardPage() {
  const [showDiagnosticCTA, setShowDiagnosticCTA] = useState(false);
  const { lang } = useLang();
  const isHe = lang === "he";

  useLayoutEffect(() => {
    const p = loadProgress();
    setShowDiagnosticCTA(!p.diagnosticCompleted);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="animate-fade-up">
        <h1 className="page-title">{isHe ? "שלום" : "Hello"}</h1>
        <p className="page-subtitle">
          {isHe ? "מרכז ההכנה שלך לאמירנט" : "Your AMIRNET prep hub"}
        </p>
      </div>

      {showDiagnosticCTA && (
        <div className="card animate-fade-up" style={{ padding: "1.25rem 1.5rem", borderColor: "var(--teal)", background: "var(--teal-faint)", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--teal-sub)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Target size={20} color="var(--teal)" strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.25rem" }}>
              {isHe ? "גלה את הרמה האמיתית שלך" : "Discover your real level"}
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              {isHe
                ? "15 שאלות · ~8 דקות · תוכנית אימון מותאמת אישית"
                : "15 questions · ~8 minutes · personalized training plan"}
            </div>
          </div>
          <Link href="/diagnostic" className="btn btn-primary">
            {isHe ? "התחל בדיקת מיצוב" : "Start placement test"}
          </Link>
        </div>
      )}

      <ReadinessWidget />
      <XPBar />
      <TodaysTraining />
      <DashboardStats />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
        <VocabDueWidget />
        <SimulationHistoryWidget />
      </div>

      <WeakAreas />
      <RecommendedActivity />
      {/* Disclaimer lives in <AppFooter/> (single source of truth) */}
    </div>
  );
}
