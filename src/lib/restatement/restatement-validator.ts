import type { Question } from "@/types/questions";

/**
 * Minimum requirements a restatement question must satisfy to be eligible
 * for an AMIRAM-style simulation section (ניסוח מחדש).
 *
 * Mirrors the spec in PROJECT_CONTEXT.md and the AMIRNET_SAMPLE_MEDIUM
 * reference: real Amirnet medium restatement stems run 14–35 words, with
 * all four options of comparable length so the test-taker cannot pick
 * the right answer purely from a length cue.
 */
export const SIMULATION_MIN_STEM_WORDS = 14;
export const OPTION_LENGTH_TOLERANCE = 0.25;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * True iff this restatement is fit for a simulation section:
 *   - tagged medium or hard
 *   - stem ≥ SIMULATION_MIN_STEM_WORDS words
 *   - all 4 options within ±OPTION_LENGTH_TOLERANCE of their mean length
 */
export function isSimulationEligibleRestatement(q: Question): boolean {
  if (q.difficulty !== "medium" && q.difficulty !== "hard") return false;
  if (wordCount(q.text) < SIMULATION_MIN_STEM_WORDS) return false;

  const choices = q.choices ?? [];
  if (choices.length < 2) return false;

  const lengths = choices.map(wordCount);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean <= 0) return false;

  const maxDeviation = Math.max(...lengths.map((l) => Math.abs(l - mean) / mean));
  return maxDeviation <= OPTION_LENGTH_TOLERANCE;
}

export interface RestatementPoolFilterResult {
  eligible: Question[];
  fallback: Question[];
}

/**
 * Split a candidate pool into:
 *   - `eligible`: items that pass the simulation predicate
 *   - `fallback`: items sorted by stem length (longest first), then hard before medium,
 *                 used only when the eligible set is smaller than the section's
 *                 requested question count.
 *
 * Easy items can be in the fallback list as a last resort but are sorted last.
 */
export function filterRestatementsForSimulation(
  pool: Question[]
): RestatementPoolFilterResult {
  const eligible = pool.filter(isSimulationEligibleRestatement);

  const difficultyRank = (q: Question): number => {
    if (q.difficulty === "hard") return 0;
    if (q.difficulty === "medium") return 1;
    return 2;
  };

  const fallback = [...pool]
    .filter((q) => !eligible.includes(q))
    .sort((a, b) => {
      const drank = difficultyRank(a) - difficultyRank(b);
      if (drank !== 0) return drank;
      return wordCount(b.text) - wordCount(a.text);
    });

  return { eligible, fallback };
}
