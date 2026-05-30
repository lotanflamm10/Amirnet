"use client";

import Link from "next/link";
import type { PracticeSession, QuestionCategory } from "@/types/questions";
import type { SessionMode } from "@/lib/practice/question-selector";
import { estimateScore, getScoreBand, calculateSessionAccuracy, formatTime } from "@/lib/practice/scoring";
import { accuracyToScore } from "@/lib/scoring/score";
import { useLang } from "@/contexts/LanguageContext";
import { Target } from "@/components/icons/NavIcons";

/**
 * Per-category weights mirror the simulation scorer (src/lib/simulation/
 * score-estimator.ts) so a reading-heavy practice session scores higher
 * than the same accuracy on word-formation, matching the real exam.
 * Categories not listed default to weight 1.
 */
const CATEGORY_WEIGHTS: Partial<Record<QuestionCategory, number>> = {
  reading: 3,
  restatements: 2,
  sentenceCompletion: 1.5,
};

function weightFor(category: QuestionCategory | undefined): number {
  if (!category) return 1;
  return CATEGORY_WEIGHTS[category] ?? 1;
}

interface Props {
  session: PracticeSession;
  mode: SessionMode;
  totalTimeSeconds: number;
  onPracticeAgain: () => void;
}

const BAND_COLORS: Record<string, string> = {
  success:    "var(--success)",
  warn:       "var(--warn)",
  danger:     "var(--danger)",
  "ink-soft": "var(--ink-soft)",
};

const BAND_BG: Record<string, string> = {
  success:    "var(--success-sub)",
  warn:       "var(--warn-sub)",
  danger:     "var(--danger-sub)",
  "ink-soft": "var(--raised)",
};

const MOTIV_EMOJI: Record<string, string> = {
  success:    "🌟",
  "ink-soft": "💪",
  warn:       "📈",
  danger:     "target",
};

function MotivMark({ value, color }: { value: string; color: string }) {
  if (value === "target") return <Target size={28} color={color} strokeWidth={2} />;
  return <span>{value}</span>;
}

export default function PracticeSummary({ session, mode, totalTimeSeconds, onPracticeAgain }: Props) {
  const { t } = useLang();
  const results  = session.results;
  const correct  = results.filter(r => r.correct).length;
  const total    = results.length;
  const accuracy = calculateSessionAccuracy(results);

  const category = mode === "mixed" || mode === "smartReview" ? "mixed"
    : mode === "restatements" ? "restatements"
    : mode as Parameters<typeof estimateScore>[2];

  // Weighted score: when results carry per-question category metadata,
  // weight reading/restatements/SC the same way the simulation scorer
  // does, then convert that weighted accuracy via accuracyToScore.
  // Mixed-mode sessions are the main beneficiary; single-category sessions
  // give identical weighted vs. unweighted results (uniform numerator
  // scaling). Sessions stored before the metadata existed fall back to the
  // unweighted estimateScore.
  const hasCategoryMeta = results.some((r) => Boolean(r.category));
  let score: number;
  let isWeighted = false;
  if (hasCategoryMeta) {
    let weightedCorrect = 0;
    let weightedTotal = 0;
    for (const r of results) {
      const w = weightFor(r.category);
      weightedTotal += w;
      if (r.correct) weightedCorrect += w;
    }
    score = weightedTotal > 0 ? accuracyToScore(weightedCorrect / weightedTotal) : 50;
    isWeighted = results.some((r) => weightFor(r.category) !== 1);
  } else {
    score = estimateScore(correct, total, category);
  }
  const band      = getScoreBand(score);
  const bandColor = BAND_COLORS[band.color];
  const bandBg    = BAND_BG[band.color];

  const motivText =
    band.color === "success" ? t.practiceSummary.motivExcellent
      : band.color === "ink-soft" ? t.practiceSummary.motivGood
      : band.color === "warn" ? t.practiceSummary.motivOk
      : t.practiceSummary.motivWeak;

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 520, margin: "0 auto" }}>
      {/* Hero score */}
      <div className="card" style={{
        padding: "2rem 1.5rem", textAlign: "center",
        borderColor: bandColor, background: bandBg,
      }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.25rem", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "2.25rem" }}>
          <MotivMark value={MOTIV_EMOJI[band.color]} color={bandColor} />
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "4.5rem", fontWeight: 900, color: bandColor, lineHeight: 1 }}>
          {score}
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--ink-muted)", margin: "0.375rem 0 0.75rem" }}>
          {t.practiceSummary.estimatedScore}
        </div>
        {isWeighted && (
          <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)", margin: "-0.5rem 0 0.75rem", lineHeight: 1.45 }}>
            {t.practiceSummary.weightedByExam}
          </div>
        )}
        <span style={{
          display: "inline-block", padding: "0.3rem 1rem", borderRadius: 99,
          background: `color-mix(in srgb, ${bandColor} 15%, transparent)`,
          color: bandColor, fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.875rem",
        }}>
          {t.scoreBand[band.key]}
        </span>
        <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)", margin: 0, lineHeight: 1.55 }}>
          {motivText}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.625rem" }}>
        {[
          { label: t.practiceSummary.accuracy,     value: `${accuracy}%`,                color: accuracy >= 75 ? "var(--success)" : accuracy >= 55 ? "var(--warn)" : "var(--danger)" },
          { label: t.practiceSummary.correctTotal, value: `${correct}/${total}`,         color: "var(--ink)" },
          { label: t.practiceSummary.time,         value: formatTime(totalTimeSeconds), color: "var(--info)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card card-flat" style={{ padding: "1rem", textAlign: "center", background: "var(--raised)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "0.2rem" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Accuracy bar */}
      <div className="card" style={{ padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--ink-muted)", marginBottom: "0.5rem" }}>
          <span>0%</span>
          <span style={{ fontWeight: 700, color: bandColor }}>
            {t.practiceSummary.accuracyPercent.replace("{n}", String(accuracy))}
          </span>
          <span>100%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill"
            style={{ width: `${accuracy}%`, background: bandColor }} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        <button className="btn btn-primary btn-lg btn-block" onClick={onPracticeAgain}>
          {t.practiceSummary.practiceAgain}
        </button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
          <Link href="/review" className="btn btn-ghost btn-block" style={{ textAlign: "center" }}>
            {t.practiceSummary.reviewMistakes}
          </Link>
          <Link href="/app" className="btn btn-ghost btn-block" style={{ textAlign: "center" }}>
            {t.practiceSummary.dashboard}
          </Link>
        </div>
      </div>

      <p style={{ textAlign: "center", color: "var(--ink-muted)", fontSize: "0.7rem", lineHeight: 1.5 }}>
        {t.practiceSummary.unofficialFooter}
      </p>
    </div>
  );
}
