"use client";
import { useLayoutEffect, useState, useMemo } from "react";
import {
  loadVocabStates,
  markKnown,
  markMissed,
  toggleStar,
  getStarredItems,
  getWeakItems,
} from "@/lib/vocab/vocab-store";
import { withCustomItems } from "@/lib/vocab/custom-vocab-store";
import { filterByCardType, CARD_TYPE_LABELS } from "@/lib/vocab/vocab-card-type";
import type { CardType } from "@/lib/vocab/vocab-card-type";
import vocabData from "@/data/seed/vocab.normalized.json";
import type { VocabItem } from "@/types/vocab";
import type { VocabReviewState } from "@/lib/vocab/spaced-repetition";

type Filter = "all" | "starred" | "weak" | "due" | "mastered";
const CARD_TYPE_OPTIONS: CardType[] = ["all", "nouns", "verbs", "adjectives", "expressions", "connectors", "phrasalVerbs", "unclassified"];

interface Props {
  initialFilter?: Filter;
}

export function VocabList({ initialFilter = "all" }: Props) {
  const [states, setStates] = useState<Record<string, VocabReviewState>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [cardType, setCardType] = useState<CardType>("all");
  const [flipped, setFlipped] = useState<string | null>(null);
  const [nowMs] = useState(() => Date.now());
  const [all, setAll] = useState<VocabItem[]>(() => vocabData as VocabItem[]);

  useLayoutEffect(() => {
    setStates(loadVocabStates());
    setAll(withCustomItems(vocabData as VocabItem[]));
  }, []);

  const filtered = useMemo(() => {
    let items = all;

    if (filter === "starred") items = getStarredItems(all);
    else if (filter === "weak") items = getWeakItems(all);
    else if (filter === "mastered") items = all.filter((v) => (states[v.id]?.masteryScore ?? 0) >= 5);
    else if (filter === "due") {
      items = all.filter((v) => {
        const s = states[v.id];
        if (!s) return true;
        return s.nextReviewAt ? new Date(s.nextReviewAt).getTime() <= nowMs : true;
      });
    }

    items = filterByCardType(items, cardType);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (v) => v.word.toLowerCase().includes(q) || v.hebrewTranslation.toLowerCase().includes(q) || (v.englishDefinition ?? "").toLowerCase().includes(q)
      );
    }

    return items;
  }, [all, filter, cardType, search, states, nowMs]);

  function reload() {
    setStates(loadVocabStates());
  }

  const filterLabels: { key: Filter; label: string }[] = [
    { key: "all", label: "הכל / All" },
    { key: "due", label: "לחזרה / Due" },
    { key: "starred", label: "מסומנים ★" },
    { key: "weak", label: "חלשים / Weak" },
    { key: "mastered", label: "שולטים / Mastered" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {filterLabels.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: "0.3rem 0.75rem",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 600,
              border: "1.5px solid",
              borderColor: filter === key ? "var(--teal)" : "var(--line)",
              background: filter === key ? "var(--teal-sub)" : "transparent",
              color: filter === key ? "var(--teal)" : "var(--ink-muted)",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {CARD_TYPE_OPTIONS.map((type) => (
          <button
            key={type}
            onClick={() => setCardType(type)}
            style={{
              padding: "0.2rem 0.65rem",
              borderRadius: "999px",
              fontSize: "0.72rem",
              fontWeight: 600,
              border: "1.5px solid",
              borderColor: cardType === type ? "var(--info)" : "var(--line)",
              background: cardType === type ? "rgba(96,165,250,0.12)" : "transparent",
              color: cardType === type ? "var(--info)" : "var(--ink-muted)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {CARD_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <input
        type="search"
        placeholder="חפש מילה / Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "0.6rem 1rem",
          borderRadius: "var(--radius)",
          border: "1.5px solid var(--line)",
          background: "var(--surface-raised)",
          color: "var(--ink)",
          fontSize: "0.9rem",
          width: "100%",
        }}
      />

      <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", margin: 0 }}>
        {filtered.length} מילים
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtered.length === 0 && (
          <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔍</div>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>אין מילים בסינון זה</p>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.8rem", marginBottom: "1rem" }}>נסה לשנות את הקטגוריה, הסטטוס או החיפוש</p>
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilter("all"); setCardType("all"); setSearch(""); }}>
              נקה סינון
            </button>
          </div>
        )}
        {filtered.slice(0, 200).map((item) => {
          const state = states[item.id];
          const mastery = state?.masteryScore ?? 0;
          const isFlipped = flipped === item.id;
          const isStarred = state?.starred ?? false;

          return (
            <div
              key={item.id}
              className="card"
              style={{ padding: "0.75rem 1rem", cursor: "pointer" }}
              onClick={() => setFlipped(isFlipped ? null : item.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.95rem" }}>{item.word}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", textTransform: "uppercase" }}>{item.partOfSpeech}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>{item.difficulty}</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: mastery >= 5 ? "var(--success)" : mastery >= 3 ? "var(--teal)" : "var(--ink-muted)" }}>
                    {mastery}/5
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(item.id); reload(); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: isStarred ? "var(--warn)" : "var(--line)" }}
                  >
                    ★
                  </button>
                </div>
              </div>

              {isFlipped && (
                <div style={{ marginTop: "0.75rem", borderTop: "1px solid var(--line)", paddingTop: "0.75rem" }}>
                  <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--teal)", margin: "0 0 0.25rem", direction: "rtl" }}>{item.hebrewTranslation}</p>
                  {item.englishDefinition && (
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "0 0 0.75rem" }}>{item.englishDefinition}</p>
                  )}
                  {item.exampleSentence && (
                    <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", fontStyle: "italic", margin: "0 0 0.75rem" }}>&ldquo;{item.exampleSentence}&rdquo;</p>
                  )}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); markMissed(item.id); reload(); }}
                    >
                      ✗ לא ידעתי
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => { e.stopPropagation(); markKnown(item.id); reload(); }}
                    >
                      ✓ ידעתי
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length > 200 && (
          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--ink-muted)" }}>
            מציג 200 מתוך {filtered.length}. צמצם החיפוש.
          </p>
        )}
      </div>
    </div>
  );
}
