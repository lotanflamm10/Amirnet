"use client";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { getVocabStats } from "@/lib/vocab/vocab-store";
import { withCustomItems } from "@/lib/vocab/custom-vocab-store";
import vocabData from "@/data/seed/vocab.normalized.json";
import type { VocabItem } from "@/types/vocab";

export function VocabDueWidget() {
  const [stats, setStats] = useState<{ dueCount: number; mastered: number; total: number } | null>(null);

  useLayoutEffect(() => {
    const all = withCustomItems(vocabData as VocabItem[]);
    const s = getVocabStats(all);
    setStats({ dueCount: s.dueCount, mastered: s.mastered, total: s.total });
  }, []);

  if (!stats) return null;

  const masteredPct = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div className="section-header">
        <h3 className="section-title">מילים</h3>
        {stats.dueCount > 0 && (
          <span className="badge badge-teal">{stats.dueCount} היום</span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
          <span style={{ color: "var(--ink-muted)" }}>שלטו</span>
          <span style={{ color: "var(--ink-soft)", fontWeight: 600 }}>{stats.mastered}/{stats.total}</span>
        </div>
        <div className="progress-track sm">
          <div className="progress-fill success" style={{ width: `${masteredPct}%` }} />
        </div>

        <div style={{ marginTop: "0.25rem" }}>
          {stats.dueCount > 0 ? (
            <Link href="/vocab/swipe" className="btn btn-primary btn-sm btn-block" style={{ marginTop: "0.375rem" }}>
              חזור על {stats.dueCount} מילים →
            </Link>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.375rem" }}>
              <span style={{ fontSize: "1rem" }}>✓</span>
              <p style={{ fontSize: "0.82rem", color: "var(--success)", fontWeight: 600, margin: 0 }}>הכל תורגל להיום!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
