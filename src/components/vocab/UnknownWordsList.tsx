"use client";

import { useCallback, useEffect, useState } from "react";
import type { UnknownWord, UnknownWordSource } from "@/types/unknown-words";
import {
  listUnknownWords,
  markKnown,
  markUnknown,
  removeUnknownWord,
} from "@/lib/vocab/unknown-words-store";
import { CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";

type FilterMode = "all" | "unknown" | "known";

function sourceLabel(source: UnknownWordSource, t: Translations): string {
  switch (source) {
    case "reading":        return t.unknownWords.sourceReading;
    case "vocab":          return t.unknownWords.sourceVocab;
    case "practice":       return t.unknownWords.sourcePractice;
    case "academicPhrase": return t.unknownWords.sourceAcademicPhrase;
    case "chat":           return t.unknownWords.sourceChat;
    case "manual":         return t.unknownWords.sourceManual;
  }
}

export default function UnknownWordsList() {
  const [items, setItems] = useState<UnknownWord[]>([]);
  const [filter, setFilter] = useState<FilterMode>("unknown");
  const { lang, t } = useLang();
  const isHe = lang === "he";

  const refresh = useCallback(() => {
    setItems(listUnknownWords());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visible = items.filter((it) =>
    filter === "all" ? true : it.status === filter,
  );
  const counts = {
    all: items.length,
    unknown: items.filter((i) => i.status === "unknown").length,
    known: items.filter((i) => i.status === "known").length,
  };

  function handleMarkKnown(w: UnknownWord) {
    markKnown(w.id);
    refresh();
  }
  function handleMarkUnknown(w: UnknownWord) {
    markUnknown(w.id);
    refresh();
  }
  function handleRemove(w: UnknownWord) {
    removeUnknownWord(w.id);
    refresh();
  }

  const filterLabels: Record<FilterMode, string> = {
    all: t.unknownWords.filterAll,
    unknown: t.unknownWords.filterUnknown,
    known: t.unknownWords.filterKnown,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Filter pills */}
      <div className="pill-group" role="tablist" aria-label={isHe ? "סינון" : "Filter"}>
        {(["unknown", "all", "known"] as FilterMode[]).map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={active}
              className={`pill${active ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {filterLabels[f]} ({counts[f]})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div
          className="card"
          style={{
            padding: "2.5rem 1.5rem",
            textAlign: "center",
            color: "var(--ink-muted)",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.9rem" }}>{t.unknownWords.empty}</p>
        </div>
      ) : (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {visible.map((w) => (
            <li
              key={w.id}
              className="card"
              style={{
                padding: "0.75rem 1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  dir="ltr"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "var(--ink)",
                  }}
                >
                  {w.word}
                </div>
                <div
                  dir="rtl"
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--ink-soft)",
                    marginTop: 2,
                  }}
                >
                  {w.translation}
                </div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--ink-muted)",
                    marginTop: 4,
                  }}
                >
                  {t.unknownWords.source}: {sourceLabel(w.source, t)}
                  {" · "}
                  {new Date(w.addedAt).toLocaleDateString(isHe ? "he-IL" : "en-US", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.375rem" }}>
                {w.status === "unknown" ? (
                  <button
                    type="button"
                    className="btn btn-success btn-xs"
                    onClick={() => handleMarkKnown(w)}
                    aria-label={t.unknownWords.markKnown}
                  >
                    <CheckCircle2 size={13} strokeWidth={2} />
                    {t.unknownWords.markKnown}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => handleMarkUnknown(w)}
                    aria-label={t.unknownWords.markUnknown}
                  >
                    <RotateCcw size={13} strokeWidth={2} />
                    {t.unknownWords.markUnknown}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => handleRemove(w)}
                  aria-label={t.unknownWords.remove}
                  style={{ color: "var(--danger)" }}
                >
                  <Trash2 size={13} strokeWidth={2} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
