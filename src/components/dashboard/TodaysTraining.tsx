"use client";
import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { loadProgress } from "@/lib/progress/local-progress-store";
import {
  generateDailyPlan,
  type DailyPlanItem,
  type DailyPlanLabel,
  type DailyPlanReason,
} from "@/lib/analytics/daily-plan";
import { getVocabStats } from "@/lib/vocab/vocab-store";
import { withCustomItems } from "@/lib/vocab/custom-vocab-store";
import vocabData from "@/data/seed/vocab.normalized.json";
import type { VocabItem } from "@/types/vocab";
import { PlanIcon } from "@/components/icons/NavIcons";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";

function PriorityDot({ priority }: { priority: DailyPlanItem["priority"] }) {
  const color = priority === "high" ? "var(--danger)" : priority === "medium" ? "var(--warn)" : "var(--teal)";
  return <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />;
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

function boosterLabel(mode: string, t: Translations): string {
  switch (mode) {
    case "vocabularyInContext": return t.dashboard.planBoosterVocabInContext;
    case "restatementMini":     return t.dashboard.planBoosterRestatementMini;
    case "connectorPractice":   return t.dashboard.planBoosterConnectors;
    case "synonymRecognition":  return t.dashboard.planBoosterSynonym;
    case "academicPhrase":      return t.dashboard.planBoosterAcademicPhrase;
    case "sentenceLogic":       return t.dashboard.planBoosterSentenceLogic;
    default: return mode;
  }
}

function renderLabel(label: DailyPlanLabel, t: Translations): string {
  switch (label.kind) {
    case "vocabToday":     return t.dashboard.planVocabToday;
    case "readingPassage": return t.dashboard.planReadingPassage;
    case "mixed":          return t.dashboard.planMixed;
    case "category":       return categoryLabel(label.category, t);
    case "booster":        return boosterLabel(label.mode, t);
  }
}

function renderReason(reason: DailyPlanReason, t: Translations): string {
  switch (reason.kind) {
    case "vocabPending":    return t.dashboard.planReasonVocabPending.replace("{n}", reason.count.toLocaleString());
    case "vocabBuild":      return t.dashboard.planReasonVocabBuild;
    case "reading":         return t.dashboard.planReasonReading;
    case "weakCategory":    return t.dashboard.planReasonWeak.replace("{n}", String(reason.accuracyPercent));
    case "booster":         return t.dashboard.planReasonBooster.replace("{cat}", categoryLabel(reason.weakCategory, t));
    case "mixedFirst":      return t.dashboard.planReasonMixedFirst;
    case "mixedKeepLevel":  return t.dashboard.planReasonMixedKeepLevel;
  }
}

export function TodaysTraining() {
  const [plan, setPlan] = useState<DailyPlanItem[]>([]);
  const [done, setDone] = useState(0);
  const [goal, setGoal] = useState(20);
  const { lang, t } = useLang();
  const isRtl = lang === "he";

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
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const unitLabel = (item: DailyPlanItem) =>
    item.type === "vocab" ? t.dashboard.unitWords : t.dashboard.unitQuestions;

  return (
    <div className="card animate-fade-up" style={{ padding: "1.5rem" }}>
      <div className="section-header" style={{ marginBottom: "1rem" }}>
        <h2 className="section-title">{t.dashboard.todaysTraining}</h2>
        <span className="badge badge-teal">
          {totalItems} {t.dashboard.itemsLabel}
        </span>
      </div>

      {done > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--ink-muted)", marginBottom: "0.35rem" }}>
            <span>{t.dashboard.progress}</span>
            <span>{done}/{goal}</span>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, (done / goal) * 100)}%` }} /></div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.25rem" }}>
        {plan.map((item, i) => {
          const label = renderLabel(item.label, t);
          const reason = renderReason(item.reason, t);
          return (
            <Link
              key={i}
              href={item.href}
              className="card-clickable"
              aria-label={label}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.75rem 1rem", background: "var(--raised)",
                borderRadius: 10, border: "1px solid var(--line)",
                textDecoration: "none", color: "inherit",
              }}
            >
              <PriorityDot priority={item.priority} />
              <span style={{ color: "var(--ink-muted)", flexShrink: 0, display: "flex", alignItems: "center" }}>
                <PlanIcon name={item.icon} size={16} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ink)" }}>{label}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>{reason}</div>
              </div>
              <span style={{
                fontSize: "0.75rem", fontWeight: 700, color: item.color,
                background: "var(--surface)", padding: "0.2rem 0.5rem", borderRadius: 6, whiteSpace: "nowrap",
              }}>
                {item.count} {unitLabel(item)}
              </span>
              <span
                aria-hidden="true"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 28, height: 28, borderRadius: 8,
                  color: "var(--ink-muted)", flexShrink: 0,
                }}
              >
                <ArrowIcon size={14} strokeWidth={2} />
              </span>
            </Link>
          );
        })}
      </div>

      <Link href={firstHref} className="btn btn-primary btn-lg btn-block" style={{ textAlign: "center" }}>
        {t.dashboard.startToday}
      </Link>
    </div>
  );
}
