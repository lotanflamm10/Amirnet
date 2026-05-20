"use client";

import type { LearningTip } from "@/types/learning";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  CATEGORY_EMOJIS,
} from "@/types/learning";
import { useLang } from "@/contexts/LanguageContext";

interface Props {
  tip: LearningTip;
  index: number;
  total: number;
  isCompleted: boolean;
  isBookmarked: boolean;
  isExampleExpanded: boolean;
  onComplete: () => void;
  onBookmark: () => void;
  onToggleExample: () => void;
  onNext: () => void;
  onPrev: () => void;
  cardRef: (el: HTMLElement | null) => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "#22c55e",
  intermediate: "#f59e0b",
  advanced: "#ef4444",
};

const CATEGORY_ACCENT: Record<string, string> = {
  sentence_completion: "#6366f1",
  restatements:        "#8b5cf6",
  reading:             "#3b82f6",
  vocabulary:          "#0dcbb1",
  connectors:          "#a855f7",
  listening:           "#f97316",
  grammar:             "#ec4899",
  word_formation:      "#14b8a6",
  writing:             "#84cc16",
  time_management:     "#f59e0b",
  exam_interface:      "#06b6d4",
  test_day:            "#64748b",
  general:             "#0dcbb1",
};

function ConnectorCompareVisual({ tip }: { tip: LearningTip }) {
  if (!tip.example) return null;
  const lines = tip.example.content.split("\n").filter(Boolean);
  const pairs = lines.map((line) => {
    const [left, right] = line.split("=").map((s) => s.trim());
    return { left, right };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", margin: "0.75rem 0" }}>
      {pairs.map(({ left, right }, i) =>
        right ? (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <div
              dir="ltr"
              style={{
                background: "rgba(168,85,247,0.15)",
                border: "1px solid rgba(168,85,247,0.3)",
                borderRadius: 10,
                padding: "0.5rem 0.75rem",
                fontWeight: 700,
                fontSize: "0.88rem",
                color: "#c084fc",
                fontFamily: "monospace",
                textAlign: "center",
              }}
            >
              {left}
            </div>
            <div style={{ color: "var(--ink-muted)", fontSize: "0.75rem", fontWeight: 600, flexShrink: 0 }}>→</div>
            <div
              dir="rtl"
              style={{
                background: "rgba(13,203,177,0.12)",
                border: "1px solid rgba(13,203,177,0.25)",
                borderRadius: 10,
                padding: "0.5rem 0.75rem",
                fontWeight: 600,
                fontSize: "0.85rem",
                color: "var(--teal)",
                textAlign: "center",
              }}
            >
              {right}
            </div>
          </div>
        ) : (
          <div
            key={i}
            dir="ltr"
            style={{
              gridColumn: "1 / -1",
              fontFamily: "monospace",
              fontSize: "0.8rem",
              color: "var(--ink-muted)",
              padding: "0.2rem 0.25rem",
              textAlign: "left",
              fontStyle: "italic",
            }}
          >
            {left}
          </div>
        )
      )}
    </div>
  );
}

function ChecklistVisual({ tip }: { tip: LearningTip }) {
  if (!tip.example) return null;
  const lines = tip.example.content.split("\n").filter(Boolean);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", margin: "0.75rem 0" }}>
      {lines.map((line, i) => {
        const isNumbered = /^\d+\./.test(line);
        const isCheck = line.startsWith("✓");
        const numMatch = isNumbered ? line.match(/^(\d+)\.(.*)/) : null;

        return (
          <div
            key={i}
            dir="ltr"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.6rem",
              padding: "0.45rem 0.75rem",
              borderRadius: 10,
              background: (isCheck || isNumbered)
                ? "rgba(13,203,177,0.07)"
                : "rgba(0,0,0,0.03)",
              border: "1px solid var(--line)",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: isCheck
                  ? "rgba(13,203,177,0.2)"
                  : isNumbered
                  ? "rgba(99,102,241,0.15)"
                  : "rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.72rem",
                fontWeight: 800,
                color: isCheck
                  ? "var(--teal)"
                  : isNumbered
                  ? "#818cf8"
                  : "var(--ink-muted)",
              }}
            >
              {isCheck ? "✓" : isNumbered && numMatch ? numMatch[1] : "·"}
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.55, flex: 1 }}>
              {isNumbered && numMatch ? numMatch[2].trim() : isCheck ? line.slice(1).trim() : line}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function LearningTipCard({
  tip,
  index,
  total,
  isCompleted,
  isBookmarked,
  isExampleExpanded,
  onComplete,
  onBookmark,
  onToggleExample,
  onNext,
  onPrev,
  cardRef,
}: Props) {
  const { t } = useLang();
  const isVideoStyle = tip.visualType === "video_style";
  const accent = CATEGORY_ACCENT[tip.category] ?? "var(--teal)";

  const cardBg = isVideoStyle
    ? `linear-gradient(145deg, ${accent}cc 0%, #0a2030 100%)`
    : "var(--surface)";

  return (
    <article
      ref={cardRef}
      role="article"
      aria-label={tip.title}
      style={{
        height: "100%",
        flexShrink: 0,
        scrollSnapAlign: "start",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.875rem",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          minHeight: "min(82vh, 660px)",
          maxHeight: "calc(100% - 1rem)",
          borderRadius: 22,
          boxShadow: isVideoStyle
            ? `0 12px 48px ${accent}40`
            : "0 4px 24px rgba(0,0,0,0.12)",
          background: cardBg,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          border: isVideoStyle ? "none" : `1px solid var(--line)`,
        }}
      >
        {/* Category accent bar at top */}
        {!isVideoStyle && (
          <div style={{ height: 3, background: accent, flexShrink: 0 }} />
        )}

        {/* ── TOP BAR ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.875rem 1.125rem 0.5rem",
            gap: "0.5rem",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.25rem 0.6rem",
                borderRadius: 20,
                fontSize: "0.72rem",
                fontWeight: 700,
                background: isVideoStyle ? "rgba(255,255,255,0.15)" : `${accent}18`,
                color: isVideoStyle ? "#fff" : accent,
                letterSpacing: "0.01em",
              }}
            >
              {CATEGORY_EMOJIS[tip.category]} {CATEGORY_LABELS[tip.category]}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "0.2rem 0.5rem",
                borderRadius: 20,
                fontSize: "0.67rem",
                fontWeight: 600,
                background: isVideoStyle
                  ? "rgba(255,255,255,0.1)"
                  : `${DIFFICULTY_COLORS[tip.difficulty]}18`,
                color: isVideoStyle
                  ? "rgba(255,255,255,0.75)"
                  : DIFFICULTY_COLORS[tip.difficulty],
              }}
            >
              {DIFFICULTY_LABELS[tip.difficulty]}
            </span>
          </div>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 600,
              color: isVideoStyle ? "rgba(255,255,255,0.45)" : "var(--ink-muted)",
              flexShrink: 0,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {index + 1}/{total}
          </span>
        </div>

        {/* ── BODY ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0.5rem 1.25rem 0.875rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Icon bubble */}
          <div
            style={{
              width: isVideoStyle ? 64 : 52,
              height: isVideoStyle ? 64 : 52,
              borderRadius: isVideoStyle ? 18 : 14,
              background: isVideoStyle ? "rgba(255,255,255,0.15)" : `${accent}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isVideoStyle ? "2rem" : "1.6rem",
              marginBottom: "0.875rem",
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            {CATEGORY_EMOJIS[tip.category]}
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: "clamp(1.15rem, 4vw, 1.55rem)",
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              color: isVideoStyle ? "#fff" : "var(--ink)",
              margin: "0 0 0.625rem",
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              unicodeBidi: "plaintext",
              textAlign: "start",
            }}
          >
            {tip.title}
          </h2>

          {/* Explanation */}
          <p
            style={{
              fontSize: "0.95rem",
              lineHeight: 1.7,
              color: isVideoStyle ? "rgba(255,255,255,0.88)" : "var(--ink-soft)",
              margin: "0 0 0.875rem",
              flex: tip.visualType === "text" ? 1 : undefined,
              unicodeBidi: "plaintext",
              textAlign: "start",
            }}
          >
            {tip.shortText}
          </p>

          {/* Visual content */}
          {tip.visualType === "connector_compare" && tip.example && (
            <ConnectorCompareVisual tip={tip} />
          )}
          {tip.visualType === "checklist" && tip.example && (
            <ChecklistVisual tip={tip} />
          )}

          {/* Explanation for connector_compare / checklist */}
          {tip.example?.explanation &&
            (tip.visualType === "connector_compare" || tip.visualType === "checklist") && (
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--ink-muted)",
                  lineHeight: 1.55,
                  marginTop: "0.5rem",
                  fontStyle: "italic",
                  borderTop: "1px solid var(--line)",
                  paddingTop: "0.5rem",
                }}
              >
                {tip.example.explanation}
              </p>
            )}

          {/* Expandable example for text / video_style */}
          {tip.example &&
            tip.visualType !== "connector_compare" &&
            tip.visualType !== "checklist" && (
              <div style={{ marginTop: "auto" }}>
                <button
                  onClick={onToggleExample}
                  aria-expanded={isExampleExpanded}
                  aria-label={isExampleExpanded ? t.learningEngine.hideExample : t.learningEngine.showExample}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: isVideoStyle ? "rgba(255,255,255,0.65)" : accent,
                    padding: "0.3rem 0",
                    letterSpacing: "0.01em",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: isVideoStyle ? "rgba(255,255,255,0.12)" : `${accent}18`,
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.65rem",
                      transition: "transform 0.2s",
                      transform: isExampleExpanded ? "rotate(180deg)" : "none",
                    }}
                  >
                    ▼
                  </span>
                  {isExampleExpanded ? t.learningEngine.hideExample : t.learningEngine.showExample}
                </button>

                {isExampleExpanded && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      borderRadius: 12,
                      padding: "0.875rem 1rem",
                      background: isVideoStyle
                        ? "rgba(0,0,0,0.3)"
                        : "var(--raised)",
                      border: `1px solid ${isVideoStyle ? "rgba(255,255,255,0.12)" : "var(--line)"}`,
                    }}
                  >
                    {tip.example.title && (
                      <p
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          color: isVideoStyle ? "rgba(255,255,255,0.45)" : "var(--ink-muted)",
                          margin: "0 0 0.4rem",
                        }}
                      >
                        {tip.example.title}
                      </p>
                    )}
                    <pre
                      dir="ltr"
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.83rem",
                        lineHeight: 1.65,
                        color: isVideoStyle ? "rgba(255,255,255,0.92)" : "var(--ink)",
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        textAlign: "left",
                      }}
                    >
                      {tip.example.content}
                    </pre>
                    {tip.example.explanation && (
                      <p
                        style={{
                          marginTop: "0.5rem",
                          paddingTop: "0.5rem",
                          fontSize: "0.82rem",
                          color: isVideoStyle ? "rgba(255,255,255,0.6)" : "var(--ink-muted)",
                          lineHeight: 1.55,
                          borderTop: `1px solid ${isVideoStyle ? "rgba(255,255,255,0.1)" : "var(--line)"}`,
                        }}
                      >
                        {tip.example.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
        </div>

        {/* ── FOOTER ── */}
        <div
          style={{
            flexShrink: 0,
            padding: "0.75rem 1.125rem 0.875rem",
            borderTop: `1px solid ${isVideoStyle ? "rgba(255,255,255,0.12)" : "var(--line)"}`,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {/* Bookmark — icon only */}
          <button
            onClick={onBookmark}
            aria-label={isBookmarked ? t.learningEngine.removeBookmark : t.learningEngine.addBookmark}
            style={{
              flexShrink: 0,
              width: 38,
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              background: isBookmarked
                ? "rgba(13,203,177,0.15)"
                : isVideoStyle
                ? "rgba(255,255,255,0.1)"
                : "var(--raised)",
              border: `1.5px solid ${isBookmarked ? "var(--teal)" : isVideoStyle ? "rgba(255,255,255,0.15)" : "var(--line)"}`,
              cursor: "pointer",
              fontSize: "1rem",
              transition: "all 0.15s",
            }}
          >
            {isBookmarked ? "🔖" : "🔖"}
          </button>

          {/* Understood — primary CTA */}
          <button
            onClick={onComplete}
            aria-label={isCompleted ? t.learningEngine.markNotUnderstood : t.learningEngine.markUnderstood}
            style={{
              flex: 1,
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem",
              borderRadius: 10,
              background: isCompleted
                ? "rgba(13,203,177,0.15)"
                : isVideoStyle
                ? "rgba(255,255,255,0.12)"
                : "var(--raised)",
              border: `1.5px solid ${isCompleted ? "var(--teal)" : isVideoStyle ? "rgba(255,255,255,0.18)" : "var(--line)"}`,
              cursor: "pointer",
              fontSize: "0.84rem",
              fontWeight: isCompleted ? 700 : 600,
              color: isCompleted
                ? "var(--teal)"
                : isVideoStyle
                ? "rgba(255,255,255,0.82)"
                : "var(--ink-soft)",
              transition: "all 0.15s",
              fontFamily: "var(--font-body)",
            }}
          >
            {isCompleted ? t.learningEngine.understood : t.learningEngine.gotIt}
          </button>

          {/* Practice link */}
          {tip.action && (
            <a
              href={tip.action.route}
              aria-label={tip.action.label}
              style={{
                flexShrink: 0,
                height: 38,
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                borderRadius: 10,
                background: isVideoStyle ? "rgba(255,255,255,0.92)" : "var(--teal)",
                color: isVideoStyle ? accent : "#fff",
                border: "none",
                padding: "0 0.875rem",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 700,
                textDecoration: "none",
                transition: "opacity 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {tip.action.label} →
            </a>
          )}

          {/* Prev arrow */}
          <button
            onClick={onPrev}
            aria-label={t.learningEngine.prevTip}
            style={{
              flexShrink: 0,
              width: 38,
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              background: isVideoStyle ? "rgba(255,255,255,0.1)" : "var(--raised)",
              border: `1.5px solid ${isVideoStyle ? "rgba(255,255,255,0.15)" : "var(--line)"}`,
              cursor: "pointer",
              fontSize: "1rem",
              color: isVideoStyle ? "rgba(255,255,255,0.7)" : "var(--ink-muted)",
              transition: "all 0.15s",
            }}
          >
            ↑
          </button>

          {/* Next arrow */}
          <button
            onClick={onNext}
            aria-label={t.learningEngine.nextTip}
            style={{
              flexShrink: 0,
              width: 38,
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              background: isVideoStyle ? "rgba(255,255,255,0.1)" : "var(--raised)",
              border: `1.5px solid ${isVideoStyle ? "rgba(255,255,255,0.15)" : "var(--line)"}`,
              cursor: "pointer",
              fontSize: "1rem",
              color: isVideoStyle ? "rgba(255,255,255,0.7)" : "var(--ink-muted)",
              transition: "all 0.15s",
            }}
          >
            ↓
          </button>
        </div>

        {/* Completed overlay checkmark */}
        {isCompleted && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "0.875rem",
              left: "0.875rem",
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "var(--teal)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              color: "#fff",
              fontWeight: 800,
              boxShadow: "0 2px 8px rgba(13,203,177,0.4)",
            }}
          >
            ✓
          </div>
        )}
      </div>
    </article>
  );
}
