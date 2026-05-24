/**
 * Diagnostic-only category weighting.
 *
 * The 15-question diagnostic spreads items across both core Amirnet
 * sections (sentence completion, restatements, vocabulary depth) and
 * skill-booster categories (grammar mechanics, word-formation morphology).
 * Both groups are useful learning signals, but only the CORE categories
 * actually map onto the real exam's scoring weight — so we let only those
 * drive the headline estimated-score number.
 *
 * Booster categories still flow into the recommendations / daily plan
 * pipeline so a weak grammar score still produces a practice suggestion;
 * they just don't pull the headline score down.
 *
 * This file is intentionally diagnostic-only. The simulation scorer
 * (src/lib/simulation/score-estimator.ts) uses its own AMIRAM-aligned
 * weights (reading ×3, restatements ×2, SC ×1.5, others ×1) and is NOT
 * affected by anything here.
 */

export type DiagnosticCategory = string;

export const DIAGNOSTIC_CORE_CATEGORIES: readonly DiagnosticCategory[] = [
  "sentenceCompletion",
  "restatements",
  // Reading is the highest-weight component of the real Amirnet exam.
  // We mirror that weighting so a reading-strong student sees their
  // estimated score reflect it.
  "reading",
  // Vocabulary depth is the underlying skill driving SC + restatements.
  // The diagnostic phrases its vocab items as bare "what does X mean"
  // prompts, but the construct is exam-relevant.
  "vocabulary",
] as const;

/**
 * No booster categories appear in the diagnostic any more (the prior
 * grammar + wordFormation entries were removed from the seed). Kept here
 * as an explicit empty list so callers can still ask isBoosterCategory()
 * without breaking — they will simply always get false.
 */
export const DIAGNOSTIC_BOOSTER_CATEGORIES: readonly DiagnosticCategory[] = [
] as const;

/**
 * Per-category weight in the diagnostic estimated-score formula. Weights
 * mirror the simulation scorer's spirit (reading carries the most weight,
 * restatements second, SC and vocabulary equal) without copying its exact
 * numbers — the simulation scorer at src/lib/simulation/score-estimator.ts
 * is a separate system.
 */
export const DIAGNOSTIC_CATEGORY_WEIGHTS: Record<string, number> = {
  reading: 3,
  restatements: 2,
  sentenceCompletion: 1.5,
  vocabulary: 1.5,
};

export function isCoreCategory(category: string): boolean {
  return DIAGNOSTIC_CORE_CATEGORIES.includes(category);
}

export function isBoosterCategory(category: string): boolean {
  return DIAGNOSTIC_BOOSTER_CATEGORIES.includes(category);
}
