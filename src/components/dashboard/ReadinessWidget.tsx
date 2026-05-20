"use client";
import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { Target } from "lucide-react";
import { loadProgress } from "@/lib/progress/local-progress-store";
import { calculateReadinessScore, predictScoreRange, getBlockers } from "@/lib/analytics/mastery-engine";
import type { UserProgress } from "@/types/progress";
import { useLang } from "@/contexts/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";

function readinessMessage(score: number, t: Translations): string {
  if (score >= 80) return t.dashboard.readinessMessageVeryHigh;
  if (score >= 70) return t.dashboard.readinessMessageHigh;
  if (score >= 55) return t.dashboard.readinessMessageMid;
  if (score >= 40) return t.dashboard.readinessMessageLow;
  return t.dashboard.readinessMessageVeryLow;
}

function categoryLabel(category: string, t: Translations): string {
  const map: Record<string, string> = {
    sentenceCompletion: t.dashboard.catSentenceCompletion,
    restatements:       t.dashboard.catRestatements,
    reading:            t.dashboard.catReading,
    grammar:            t.dashboard.catGrammar,
    wordFormation:      t.dashboard.catWordFormation,
    textCompletion:     t.dashboard.catTextCompletion,
    lectureQuestions:   t.dashboard.catLectureQuestions,
    vocabulary:         t.dashboard.catVocabulary,
    mixed:              t.dashboard.catMixed,
  };
  return map[category] ?? category;
}

function readinessColor(score: number): string {
  if (score >= 70) return "var(--success)";
  if (score >= 50) return "var(--warn)";
  return "var(--danger)";
}

export function ReadinessWidget() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const { t } = useLang();

  useLayoutEffect(() => {
    setProgress(loadProgress());
  }, []);

  if (!progress) return null;

  const hasData = progress.categoryProgress.filter(c => c.totalAnswered >= 3).length > 0 || progress.diagnosticCompleted;

  if (!hasData) {
    return (
      <div className="card animate-fade-up" style={{
        padding: "1.5rem",
        borderColor: "var(--teal)",
        background: "var(--teal-faint)",
      }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: "var(--teal-sub)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Target size={22} color="var(--teal)" strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.25rem" }}>
              {t.dashboard.readinessNoData}
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              {t.dashboard.readinessNoDataSub}
            </div>
          </div>
          <Link href="/diagnostic" className="btn btn-primary btn-sm">{t.dashboard.readinessPlacementBtn}</Link>
        </div>
      </div>
    );
  }

  const readiness = calculateReadinessScore(progress);
  const { low, high } = predictScoreRange(progress);
  const blockers = getBlockers(progress);
  const target = progress.targetScore ?? 134;
  const color = readinessColor(readiness);
  const message = readinessMessage(readiness, t);

  return (
    <div className="card animate-fade-up" style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>
        {t.dashboard.readinessHeading}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1rem" }}>
        {/* Readiness score */}
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "3.75rem", fontWeight: 900, color, lineHeight: 1 }}>
            {readiness}%
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginTop: "0.35rem", lineHeight: 1.4 }}>
            {message}
          </div>
          <div className="progress-track" style={{ marginTop: "0.875rem" }}>
            <div className="progress-fill" style={{ width: `${readiness}%`, background: color }} />
          </div>
        </div>

        {/* Score range */}
        <div>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            {t.dashboard.readinessEstimatedScore}
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 900, color: "var(--teal)", lineHeight: 1 }}>
            {low}–{high}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--ink-muted)", marginTop: "0.25rem" }}>
            {t.dashboard.readinessUnofficial}
          </div>
          <div style={{
            marginTop: "0.625rem", display: "inline-flex", alignItems: "center", gap: "0.4rem",
            background: "var(--raised)", border: "1px solid var(--line)", borderRadius: 8,
            padding: "0.3rem 0.625rem", fontSize: "0.75rem", color: "var(--ink-soft)",
          }}>
            <Target size={12} strokeWidth={2} color="var(--ink-muted)" />
            {t.dashboard.readinessTarget}: <strong style={{ color: "var(--ink)" }}>{target}</strong>
          </div>
        </div>
      </div>

      {blockers.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", paddingTop: "0.75rem", borderTop: "1px solid var(--line)" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>{t.dashboard.readinessFocusAreas}</span>
          {blockers.map(b => <span key={b} className="badge badge-warn">{categoryLabel(b, t)}</span>)}
        </div>
      )}
    </div>
  );
}
