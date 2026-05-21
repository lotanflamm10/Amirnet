"use client";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { getVocabStats } from "@/lib/vocab/vocab-store";
import { withCustomItems } from "@/lib/vocab/custom-vocab-store";
import { DAILY_VOCAB_LIMIT } from "@/lib/vocab/daily-vocab";
import vocabData from "@/data/seed/vocab.normalized.json";
import type { VocabItem } from "@/types/vocab";
import { useLang } from "@/contexts/LanguageContext";
import { formatNumber } from "@/lib/ui/format-number";

export function VocabDueWidget() {
  const [stats, setStats] = useState<{ dueCount: number; mastered: number; total: number } | null>(null);
  const { lang } = useLang();
  const isHe = lang === "he";

  useLayoutEffect(() => {
    const all = withCustomItems(vocabData as VocabItem[]);
    const s = getVocabStats(all);
    setStats({ dueCount: s.dueCount, mastered: s.mastered, total: s.total });
  }, []);

  if (!stats) return null;

  const masteredPct = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;
  const todaysCount = Math.min(DAILY_VOCAB_LIMIT, Math.max(stats.dueCount, DAILY_VOCAB_LIMIT));

  return (
    <Link
      href="/vocab/swipe"
      className="card card-clickable"
      style={{ padding: "1.25rem", display: "block", textDecoration: "none", color: "inherit" }}
      aria-label={isHe ? `התחל ${todaysCount} מילים להיום` : `Start today's ${todaysCount} words`}
    >
      <div className="section-header">
        <h3 className="section-title">{isHe ? "מילים" : "Vocabulary"}</h3>
        {stats.dueCount > 0 ? (
          <span className="badge badge-teal" style={{ whiteSpace: "nowrap" }}>
            {isHe
              ? `${formatNumber(stats.dueCount, "he")} ממתינות`
              : `${formatNumber(stats.dueCount, "en")} pending`}
          </span>
        ) : (
          <span className="badge badge-success">
            {isHe ? "הכל תורגל" : "All caught up"}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", gap: "0.5rem" }}>
          <span style={{ color: "var(--ink-muted)" }}>{isHe ? "שלטו" : "Mastered"}</span>
          <span style={{ color: "var(--ink-soft)", fontWeight: 600, whiteSpace: "nowrap" }}>
            {formatNumber(stats.mastered, lang)}/{formatNumber(stats.total, lang)}
          </span>
        </div>
        <div className="progress-track sm">
          <div className="progress-fill success" style={{ width: `${masteredPct}%` }} />
        </div>

        <div style={{ marginTop: "0.25rem" }}>
          {stats.dueCount > 0 || stats.total > 0 ? (
            <div
              className="btn btn-primary btn-sm btn-block"
              style={{ marginTop: "0.375rem", pointerEvents: "none" }}
            >
              {isHe ? `${todaysCount} מילים להיום` : `Learn today's ${todaysCount} words`}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.375rem" }}>
              <CheckCircle2 size={16} color="var(--success)" strokeWidth={2} />
              <p style={{ fontSize: "0.82rem", color: "var(--success)", fontWeight: 600, margin: 0 }}>
                {isHe ? "הכל תורגל להיום!" : "All done for today!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
