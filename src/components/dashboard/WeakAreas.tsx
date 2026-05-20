"use client";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { BarChart2 } from "lucide-react";
import { loadProgress } from "@/lib/progress/local-progress-store";
import type { CategoryProgress } from "@/types/progress";
import { useLang } from "@/contexts/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";

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

function AccuracyBadge({ pct }: { pct: number }) {
  const color = pct < 50 ? "var(--danger)" : pct < 70 ? "var(--warn)" : "var(--success)";
  const bg    = pct < 50 ? "var(--danger-sub)" : pct < 70 ? "var(--warn-sub)" : "var(--success-sub)";
  return (
    <span style={{ fontSize: "0.78rem", fontWeight: 700, color, background: bg, padding: "0.15rem 0.5rem", borderRadius: 6 }}>
      {pct}%
    </span>
  );
}

export function WeakAreas() {
  const [cats, setCats] = useState<CategoryProgress[]>([]);
  const { t } = useLang();

  useLayoutEffect(() => {
    const p = loadProgress();
    const sorted = [...p.categoryProgress]
      .filter((c) => c.totalAnswered >= 3)
      .sort((a, b) => a.accuracyPercent - b.accuracyPercent)
      .slice(0, 5);
    setCats(sorted);
  }, []);

  if (cats.length === 0) {
    return (
      <div className="card" style={{ padding: "1.5rem" }}>
        <div className="section-header">
          <h3 className="section-title">{t.dashboard.weakAreas}</h3>
        </div>
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
            <BarChart2 size={32} color="var(--ink-muted)" strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)", marginBottom: "0.375rem" }}>
            {t.dashboard.weakEmptyLineA}
          </p>
          <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", marginBottom: "1rem" }}>
            {t.dashboard.weakEmptyLineB}
          </p>
          <Link href="/practice" className="btn btn-ghost btn-sm">{t.dashboard.weakStartPracticing}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div className="section-header">
        <h3 className="section-title">{t.dashboard.weakAreas}</h3>
        <Link href="/review" className="btn btn-ghost btn-xs">{t.dashboard.weakSeeAll}</Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {cats.map((c, i) => {
          const color = c.accuracyPercent < 50 ? "var(--danger)" : c.accuracyPercent < 70 ? "var(--warn)" : "var(--success)";
          const label = categoryLabel(c.category, t);
          return (
            <div key={c.category} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--ink)", fontWeight: 600 }}>{label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <AccuracyBadge pct={c.accuracyPercent} />
                  <Link href={`/practice/${c.category}`}
                    style={{ fontSize: "0.72rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
                    {t.dashboard.weakPracticeLink}
                  </Link>
                </div>
              </div>
              <div className="progress-track sm">
                <div className="progress-fill" style={{ width: `${c.accuracyPercent}%`, background: color }} />
              </div>
              <p style={{ fontSize: "0.7rem", color: "var(--ink-muted)", marginTop: "0.25rem" }}>
                {c.totalCorrect}/{c.totalAnswered} {t.dashboard.weakCorrectOf}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
