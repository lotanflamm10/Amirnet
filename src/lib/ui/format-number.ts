/**
 * Locale-aware number formatting. Used so 2674 renders as "2,674" in
 * English and "2,674" in Hebrew, with a no-break space between the
 * number and any adjacent label so phones never split "2,674 מילים"
 * across two visual lines (the comma + the trailing digits).
 */

const heFormatter = new Intl.NumberFormat("he-IL");
const enFormatter = new Intl.NumberFormat("en-US");

export function formatNumber(value: number, lang: "he" | "en" = "he"): string {
  if (!Number.isFinite(value)) return String(value);
  return lang === "he" ? heFormatter.format(value) : enFormatter.format(value);
}

/**
 * Returns the count + label joined with a non-breaking space so iOS Safari
 * does not break "2,674 מילים" across two lines. Caller decides ordering.
 *
 * Example:
 *   countLabel(2674, "מילים", "he")   → "2,674 מילים"
 *   countLabel(2674, "words",  "en")  → "2,674 words"
 */
export function countLabel(value: number, label: string, lang: "he" | "en" = "he"): string {
  return `${formatNumber(value, lang)} ${label}`;
}
