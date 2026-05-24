import type { VocabItem } from "@/types/vocab";
import { getMemoryEnrichment } from "./memory-hint";

export interface CardExample {
  en?: string;
  he?: string;
}

export interface CardSections {
  /** Real example entries — English sentence, Hebrew translation, or context sentence. */
  examples: CardExample[];
  /** Combined memory tip text (core meaning). May be undefined when seed is silent. */
  memoryTip?: string;
  /** Active-recall prompt — clean text, "שאלת שליפה:" prefix stripped. */
  recallQuestion?: string;
  /** Optional confusion warning ("don't mix up with X"). */
  confusion?: string;
  /** Optional collocations — short two-to-four-word English phrases. */
  collocations: string[];
  /** Optional Hebrew pronunciation hint. */
  pronunciation?: string;
}

const FORBIDDEN_LITERAL = new Set([
  "undefined",
  "null",
  "TODO",
  "todo",
  "Anchor",
  "עוגן",
  "anchor",
]);

const RECALL_PREFIX_HE = /^שאלת\s+שליפה\s*[:：]\s*/;
const RECALL_PREFIX_EN = /^recall\s+question\s*[:：]\s*/i;

function clean(raw: string | null | undefined): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  // Reject exact placeholder values that would leak into the UI.
  if (FORBIDDEN_LITERAL.has(trimmed)) return undefined;
  return trimmed;
}

/**
 * Single source of truth for which content lives on the revealed face of a
 * vocabulary card. The renderer must call this and treat the result as
 * authoritative — no ad-hoc field reads from `getMemoryEnrichment` should
 * appear in the JSX.
 *
 * The three labelled sections per spec:
 *   • Examples       — `examples[]` (en sentence + optional he gloss, or
 *                       a standalone Hebrew context sentence)
 *   • Memory tip     — `memoryTip` (one short Hebrew sentence)
 *   • Recall prompt  — `recallQuestion` (active-recall question, never
 *                       hidden inside "More examples")
 *
 * Anything that doesn't fit those slots (collocations, confusion,
 * pronunciation) is exposed as separate small affordances.
 */
export function getCardSections(item: VocabItem): CardSections {
  const enrich = getMemoryEnrichment(item);

  // ── Examples ────────────────────────────────────────────────────────────
  // Pair-up rule: if we have both an English example sentence and its
  // Hebrew translation, count them as ONE example (rendered together).
  // A bare Hebrew context sentence (heContextSentence) is a separate
  // standalone example.
  const examples: CardExample[] = [];
  const en = clean(enrich.exampleEn);
  const he = clean(enrich.exampleHe);
  if (en || he) {
    examples.push({ en, he });
  }
  const ctx = clean(item.heContextSentence);
  if (ctx) {
    examples.push({ he: ctx });
  }

  // ── Memory tip ──────────────────────────────────────────────────────────
  // The "core meaning" sentence is the natural tip. We deliberately exclude
  // memoryAnchor ("word = X") because the revealed face already shows the
  // word and its Hebrew translation hero, so the anchor is duplicate noise.
  const memoryTip = clean(enrich.coreMeaning);

  // ── Recall question ─────────────────────────────────────────────────────
  // Strip any "שאלת שליפה:" / "Recall question:" prefix the underlying
  // generator might emit — the UI renders its own localized header above
  // the text. Filter the same FORBIDDEN literals as above.
  let recallQuestion = clean(enrich.retrieval);
  if (recallQuestion) {
    recallQuestion = recallQuestion
      .replace(RECALL_PREFIX_HE, "")
      .replace(RECALL_PREFIX_EN, "")
      .trim();
    if (!recallQuestion) recallQuestion = undefined;
  }

  // ── Confusion + collocations + pronunciation ────────────────────────────
  const confusion = clean(enrich.confusion);
  const collocations = (enrich.collocations ?? [])
    .map((c) => clean(c))
    .filter((c): c is string => Boolean(c));
  const pronunciation = clean(enrich.pronunciation);

  return {
    examples,
    memoryTip,
    recallQuestion,
    confusion,
    collocations,
    pronunciation,
  };
}

/**
 * Per spec — show all examples inline only when there are ≤2 of them AND
 * each line is short. Anything else means we should put the first inline
 * and stash the rest behind "More examples".
 */
export const INLINE_EXAMPLE_MAX_COUNT = 2;
export const INLINE_EXAMPLE_MAX_CHARS = 90;

export function exampleLineLength(example: CardExample): number {
  return Math.max((example.en ?? "").length, (example.he ?? "").length);
}

/**
 * Split the examples array into the portion that should render inline on
 * the revealed face, and the portion that lives behind the "More examples"
 * toggle. Returns `extra: []` when the More button is unnecessary.
 */
export function partitionExamples(examples: CardExample[]): {
  inline: CardExample[];
  extra: CardExample[];
} {
  if (examples.length === 0) return { inline: [], extra: [] };

  const anyLong = examples.some((e) => exampleLineLength(e) > INLINE_EXAMPLE_MAX_CHARS);
  if (!anyLong && examples.length <= INLINE_EXAMPLE_MAX_COUNT) {
    return { inline: examples, extra: [] };
  }

  return {
    inline: examples.slice(0, 1),
    extra: examples.slice(1),
  };
}
