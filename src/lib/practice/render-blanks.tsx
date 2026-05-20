import { Fragment, type CSSProperties, type ReactNode } from "react";

/**
 * Detects runs of 2+ underscores (the convention seed data uses to indicate
 * a sentence-completion blank) and replaces each run with a single solid
 * inline underline placeholder. Raw underscore characters render with
 * per-character kerning in some fonts, producing the unwanted "_ _ _ _ _"
 * look — this helper guarantees one continuous line per blank instead.
 */
export function renderBlanks(text: string, color: string = "var(--teal)"): ReactNode {
  if (!text) return text;
  // Split on consecutive underscores (any length ≥ 2). Each split entry is
  // the text between blanks; we re-inject one Blank between adjacent entries.
  const parts = text.split(/_{2,}/);
  if (parts.length === 1) return text;

  const blankStyle: CSSProperties = {
    display: "inline-block",
    width: "5.5rem",
    maxWidth: "60%",
    borderBottom: `2.5px solid ${color}`,
    height: "0.95em",
    verticalAlign: "baseline",
    marginInline: "0.3rem",
    lineHeight: 1,
  };

  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 && (
            <span aria-label="blank" style={blankStyle}>&nbsp;</span>
          )}
        </Fragment>
      ))}
    </>
  );
}
