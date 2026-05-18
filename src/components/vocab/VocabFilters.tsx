"use client";

export const FILTER_OPTIONS = [
  "Due",
  "Starred",
  "Weak",
  "Easy",
  "Medium",
  "Hard",
  "Connectors",
  "Academic",
  "New",
  "Mastered",
] as const;

export type FilterOption = (typeof FILTER_OPTIONS)[number];

interface VocabFiltersProps {
  activeFilters: string[];
  onToggle: (f: string) => void;
}

export default function VocabFilters({
  activeFilters,
  onToggle,
}: VocabFiltersProps) {
  return (
    <div
      style={{
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        paddingBottom: "4px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "nowrap",
          minWidth: "max-content",
          padding: "2px 0",
        }}
      >
        {FILTER_OPTIONS.map((f) => {
          const active = activeFilters.includes(f);
          return (
            <button
              key={f}
              onClick={() => onToggle(f)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 12px",
                borderRadius: "99px",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                border: active
                  ? "1.5px solid var(--teal)"
                  : "1.5px solid var(--line)",
                background: active ? "var(--teal)" : "transparent",
                color: active ? "#fff" : "var(--ink-soft)",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-body)",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>
    </div>
  );
}
