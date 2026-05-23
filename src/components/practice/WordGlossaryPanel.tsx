"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Languages } from "@/components/icons/NavIcons";
import { useLang } from "@/contexts/LanguageContext";
import type { GlossaryRow } from "@/lib/vocab/explain-glossary";
import { MAX_ROWS_BEFORE_SHOW_MORE } from "@/lib/vocab/explain-glossary";

interface Props {
  rows: GlossaryRow[];
  defaultExpanded?: boolean;
  /** Localized panel title. */
  title: string;
  /**
   * "compact" = used inline inside the question card BEFORE answering.
   * "regular" = used inside the explanation block AFTER answering.
   */
  variant?: "compact" | "regular";
}

/**
 * Bidi-correct en→he word-translation list, collapsed by default unless
 * the caller passes `defaultExpanded`. Used by both the during-question
 * "Hebrew help" button and the post-answer "Word translations" section.
 */
export function WordGlossaryPanel({ rows, defaultExpanded = false, title, variant = "regular" }: Props) {
  const { lang } = useLang();
  const isHe = lang === "he";
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);

  if (rows.length === 0) return null;

  const visible = showAll ? rows : rows.slice(0, MAX_ROWS_BEFORE_SHOW_MORE);
  const hasMore = rows.length > MAX_ROWS_BEFORE_SHOW_MORE;

  const isCompact = variant === "compact";

  return (
    <div
      style={{
        border: `1px solid var(--line)`,
        borderRadius: 8,
        background: isCompact ? "transparent" : "var(--surface)",
        padding: isCompact ? 0 : "0.5rem 0.75rem",
        marginTop: isCompact ? "0.4rem" : 0,
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          width: "100%", background: "transparent", border: "none",
          padding: isCompact ? "0.3rem 0" : "0.15rem 0",
          color: "var(--ink-soft)", fontWeight: 600,
          fontSize: isCompact ? "0.78rem" : "0.8rem",
          cursor: "pointer", fontFamily: "var(--font-body)",
          textAlign: "start",
        }}
      >
        <Languages size={14} strokeWidth={2} color="var(--ink-soft)" />
        <span style={{ flex: 1 }}>{title}</span>
        <span style={{ fontSize: "0.7rem", color: "var(--ink-muted)" }}>
          {rows.length}
        </span>
        {expanded ? (
          <ChevronDown size={14} color="var(--ink-muted)" strokeWidth={2} />
        ) : (
          <ChevronRight size={14} color="var(--ink-muted)" strokeWidth={2} />
        )}
      </button>

      {expanded && (
        <div
          style={{
            display: "flex", flexDirection: "column", gap: "0.3rem",
            paddingTop: "0.4rem",
            borderTop: "1px dashed var(--line)",
            marginTop: "0.35rem",
          }}
        >
          {visible.map((row) => (
            <div
              key={row.en}
              dir="auto"
              style={{
                display: "flex", alignItems: "baseline", gap: "0.5rem",
                fontSize: "0.82rem", lineHeight: 1.4, color: "var(--ink-soft)",
                flexWrap: "wrap",
              }}
            >
              <bdi style={{ fontFamily: "var(--font-mono, ui-monospace, monospace)", color: "var(--ink)" }}>
                {row.en}
              </bdi>
              <span aria-hidden="true" style={{ color: "var(--ink-muted)" }}>—</span>
              <bdi style={{ color: "var(--ink-soft)" }}>{row.he}</bdi>
            </div>
          ))}

          {hasMore && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              style={{
                alignSelf: "flex-start",
                background: "transparent", border: "none",
                color: "var(--teal)", fontWeight: 600, fontSize: "0.75rem",
                padding: "0.2rem 0", cursor: "pointer", fontFamily: "var(--font-body)",
              }}
            >
              {showAll
                ? (isHe ? "הצג פחות" : "Show less")
                : (isHe ? `הצג עוד (${rows.length - MAX_ROWS_BEFORE_SHOW_MORE})` : `Show more (${rows.length - MAX_ROWS_BEFORE_SHOW_MORE})`)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
