"use client";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { getMissedItems, loadVocabStates, markKnown, toggleStar } from "@/lib/vocab/vocab-store";
import { withCustomItems } from "@/lib/vocab/custom-vocab-store";
import vocabData from "@/data/seed/vocab.normalized.json";
import type { VocabItem } from "@/types/vocab";
import type { VocabReviewState } from "@/lib/vocab/spaced-repetition";
import { useLang } from "@/contexts/LanguageContext";

export function MissedWordsList() {
  const [items, setItems] = useState<VocabItem[]>([]);
  const [states, setStates] = useState<Record<string, VocabReviewState>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { t } = useLang();

  function reload() {
    const all = withCustomItems(vocabData as VocabItem[]);
    setItems(getMissedItems(all));
    setStates(loadVocabStates());
  }

  useLayoutEffect(() => { reload(); }, []);

  const filtered = search.trim()
    ? items.filter((v) =>
        v.word.toLowerCase().includes(search.toLowerCase()) ||
        v.hebrewTranslation.includes(search)
      )
    : items;

  if (items.length === 0) {
    return (
      <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ fontSize: "1.1rem", color: "var(--success)", marginBottom: "0.5rem" }}>{t.vocab.missedEmptyTitle}</p>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginBottom: "1.25rem" }}>
          {t.vocab.missedEmptySub}
        </p>
        <Link href="/vocab/swipe" className="btn btn-primary">{t.vocab.missedStartPractice}</Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Summary bar */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <div className="card" style={{ padding: "0.6rem 1rem", display: "flex", gap: "1rem", flex: 1 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "0.65rem", color: "var(--ink-muted)", margin: "0 0 0.1rem", textTransform: "uppercase" }}>{t.vocab.missedSummaryMissed}</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--danger)", margin: 0 }}>{items.length}</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "0.65rem", color: "var(--ink-muted)", margin: "0 0 0.1rem", textTransform: "uppercase" }}>{t.vocab.missedSummaryMastered}</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--success)", margin: 0 }}>
              {items.filter((v) => (states[v.id]?.masteryScore ?? 0) >= 3).length}
            </p>
          </div>
        </div>
        <Link href="/vocab/swipe" className="btn btn-sm" style={{ background: "var(--danger)", color: "#fff", border: "none", whiteSpace: "nowrap" }}>
          {t.vocab.missedPracticeAll}
        </Link>
      </div>

      <input
        type="search"
        placeholder={t.vocab.missedSearchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "0.55rem 1rem", borderRadius: "var(--radius-card)",
          border: "1.5px solid var(--line)", background: "var(--raised)",
          color: "var(--ink)", fontSize: "0.9rem",
        }}
      />

      <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", margin: 0 }}>
        {filtered.length} {t.vocab.missedCountSuffix}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {filtered.map((v) => {
          const state = states[v.id];
          const missed = state?.timesMissed ?? 0;
          const known = state?.timesKnown ?? 0;
          const mastery = state?.masteryScore ?? 0;
          const isExpanded = expanded === v.id;
          const isStarred = state?.starred ?? false;
          const masteryColor = mastery >= 4 ? "var(--success)" : mastery >= 2 ? "var(--warn)" : "var(--danger)";

          return (
            <div
              key={v.id}
              className="card"
              style={{ padding: "0.7rem 1rem", cursor: "pointer" }}
              onClick={() => setExpanded(isExpanded ? null : v.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", minWidth: 0 }}>
                  <span style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.95rem" }}>{v.word}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--teal)", direction: "rtl", flexShrink: 0 }}>{v.hebrewTranslation}</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0, marginInlineStart: "0.5rem" }}>
                  {/* Missed count badge */}
                  <span style={{
                    fontSize: "0.7rem", fontWeight: 700, padding: "2px 7px",
                    borderRadius: "99px", background: "rgba(239,68,68,0.12)",
                    color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)",
                  }}>
                    ✗ {missed}
                  </span>
                  {/* Mastery */}
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: masteryColor }}>{mastery}/5</span>
                  {/* Star */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(v.id); reload(); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: isStarred ? "var(--warn)" : "var(--line)", padding: 0 }}
                  >★</button>
                </div>
              </div>

              {/* Progress bar: known vs missed */}
              {(missed + known) > 0 && (
                <div style={{ marginTop: "0.4rem", height: "3px", borderRadius: "99px", background: "var(--line)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.round((known / (known + missed)) * 100)}%`,
                    background: known > missed ? "var(--success)" : "var(--danger)",
                    borderRadius: "99px",
                  }} />
                </div>
              )}

              {isExpanded && (
                <div style={{ marginTop: "0.75rem", borderTop: "1px solid var(--line)", paddingTop: "0.75rem" }}>
                  {v.englishDefinition && (
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "0 0 0.5rem" }}>{v.englishDefinition}</p>
                  )}
                  {v.exampleSentence && (
                    <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", fontStyle: "italic", margin: "0 0 0.75rem", borderInlineStart: "2px solid var(--teal)", paddingInlineStart: "8px" }}>
                      &ldquo;{v.exampleSentence}&rdquo;
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.72rem", color: "var(--ink-muted)", marginBottom: "0.75rem" }}>
                    <span>{t.vocab.missedTimes.replace("{n}", String(missed))}</span>
                    <span>·</span>
                    <span>{t.vocab.knownTimes.replace("{n}", String(known))}</span>
                    <span>·</span>
                    <span>{v.difficulty} · {v.partOfSpeech}</span>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => { e.stopPropagation(); markKnown(v.id); reload(); setExpanded(null); }}
                  >
                    {t.vocab.markKnown}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
