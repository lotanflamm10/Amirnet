export type BandColor = "success" | "warn" | "danger" | "ink-soft";

export interface ScoreBand {
  /** Stable identifier — consumer translates via `t.score.band*`. */
  key: "exemption" | "intermediate" | "basic" | "needsWork";
  /** Legacy Hebrew label kept for non-i18n callers. */
  label: string;
  description: string;
  color: BandColor;
}

/** Maps accuracy (0–1) to AMIRNET score (50–150) using the official-range piecewise curve. */
export function accuracyToScore(accuracy: number): number {
  let score: number;
  if (accuracy < 0.3) {
    score = 50 + (accuracy / 0.3) * 35;
  } else if (accuracy < 0.6) {
    score = 85 + ((accuracy - 0.3) / 0.3) * 30;
  } else if (accuracy < 0.8) {
    score = 115 + ((accuracy - 0.6) / 0.2) * 19;
  } else {
    score = 134 + ((accuracy - 0.8) / 0.2) * 16;
  }
  return Math.round(Math.min(150, Math.max(50, score)));
}

export function getScoreBand(score: number): ScoreBand {
  if (score >= 134) return { key: "exemption",    label: "רמת פטור",            description: "Exemption level — strong performance", color: "success" };
  if (score >= 120) return { key: "intermediate", label: "רמה בינונית",          description: "Intermediate — may require 1–2 courses", color: "ink-soft" };
  if (score >= 100) return { key: "basic",        label: "רמה בסיסית",           description: "Basic level — likely requires English courses", color: "warn" };
  return { key: "needsWork",  label: "נדרש שיפור משמעותי", description: "Needs significant improvement", color: "danger" };
}
