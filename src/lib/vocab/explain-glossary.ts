import type { Question } from "@/types/questions";
import vocabRaw from "@/data/seed/vocab.normalized.json";
import { SC_CHOICE_GLOSSARY } from "./sc-choice-glossary";

export interface GlossaryRow {
  en: string;
  he: string;
}

/**
 * Stopwords that get skipped in the glossary. Short, frequent function words
 * that a learner doesn't need to look up — kept conservative so we don't
 * accidentally drop content words.
 */
const STOPWORDS: ReadonlySet<string> = new Set([
  "a", "an", "the",
  "is", "was", "be", "are", "were", "been", "being",
  "has", "have", "had",
  "do", "does", "did",
  "of", "to", "and", "or", "but", "in", "on", "at", "for", "with", "by",
  "that", "this", "these", "those",
  "it", "its", "as", "if", "than", "then",
  "not", "no", "so", "also", "only", "very",
  "from", "into", "out", "up", "down", "over", "under", "about",
  "i", "you", "he", "she", "we", "they", "them", "his", "her", "their",
  "my", "your", "our", "us", "me",
]);

const MIN_WORD_LENGTH = 4;
const MAX_ROWS_BEFORE_SHOW_MORE = 12;

/**
 * Seed-vocab lookup. Built ONCE at module load — iterating the 2,674-entry
 * array per question would be wasteful. Keys are lowercased so case doesn't
 * affect lookup.
 */
interface VocabEntry {
  word?: string;
  normalizedWord?: string;
  hebrewTranslation?: string;
}

const DICT: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  const entries = vocabRaw as VocabEntry[];
  for (const entry of entries) {
    const he = entry.hebrewTranslation?.trim();
    if (!he) continue;
    const word = (entry.normalizedWord ?? entry.word ?? "").toLowerCase().trim();
    if (word && !map.has(word)) map.set(word, he);
  }
  return map;
})();

function normalizeWord(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z'-]/g, "");
}

/**
 * Light-touch lemmatizer for the glossary lookup. Generates likely base
 * forms of an inflected English word so we can find a seed dictionary
 * hit on "demands" via "demand", "innovating" via "innovate", etc.
 */
function lemmaCandidates(word: string): string[] {
  const out = [word];
  if (word.length <= 3) return out;
  if (word.endsWith("ies")) out.push(word.slice(0, -3) + "y");
  if (word.endsWith("es") && word.length > 3) {
    out.push(word.slice(0, -2));
    out.push(word.slice(0, -1));
  }
  if (word.endsWith("s") && !word.endsWith("ss")) out.push(word.slice(0, -1));
  if (word.endsWith("ed") && word.length > 3) {
    out.push(word.slice(0, -1));
    out.push(word.slice(0, -2));
  }
  if (word.endsWith("ing") && word.length > 4) {
    out.push(word.slice(0, -3));
    out.push(word.slice(0, -3) + "e");
  }
  return out;
}

/**
 * Resolve a normalized English word to a Hebrew translation. Tries the
 * seed dictionary first (direct + lemma forms), then falls back to the
 * curated SC choice glossary. Returns null if nothing matches.
 */
function lookupHebrew(normalizedWord: string): string | null {
  if (!normalizedWord) return null;
  for (const candidate of lemmaCandidates(normalizedWord)) {
    const seedHit = DICT.get(candidate);
    if (seedHit) return seedHit;
    const curatedHit = SC_CHOICE_GLOSSARY[candidate];
    if (curatedHit) return curatedHit;
  }
  return null;
}

/**
 * Extract candidate English words from a chunk of text, dedup-preserving order.
 * Strips punctuation, filters stopwords and very short tokens.
 */
function extractContentWords(text: string, seen: Set<string>): string[] {
  if (!text) return [];
  const out: string[] = [];
  const tokens = text.split(/\s+/);
  for (const raw of tokens) {
    const norm = normalizeWord(raw);
    if (!norm) continue;
    if (norm.length < MIN_WORD_LENGTH) continue;
    if (STOPWORDS.has(norm)) continue;
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(norm);
  }
  return out;
}

interface GetGlossaryOptions {
  /** Include explanation + wrongReasons in the source text (post-answer use). */
  includeExplanation?: boolean;
}

/**
 * Build the en→he glossary rows for a given question. Pulls unique content
 * words from the stem + choices (always) and explanation + wrongReasons
 * (only when `includeExplanation` is true). Words missing from the seed
 * vocab are silently omitted — the panel stays tight.
 *
 * Sorted by word length DESC as a proxy for "hardest first".
 */
const SC_MISSING_TRANSLATION_HE = "(אין תרגום)";

export function getGlossaryForQuestion(
  question: Question,
  options: GetGlossaryOptions = {}
): GlossaryRow[] {
  const isSC = question.category === "sentenceCompletion";
  const seen = new Set<string>();
  const rows: GlossaryRow[] = [];

  // ── SC mode: the 4 answer choices ARE the learning surface, so they
  //   come first in the glossary, in original order, and ONLY them — no
  //   stem/explanation noise. Lookup goes seed dictionary → curated SC
  //   choice glossary → "(אין תרגום)" only as a last-resort safety net
  //   when both miss.
  if (isSC) {
    for (const choice of question.choices ?? []) {
      const display = (choice ?? "").trim();
      if (!display) continue;
      const key = normalizeWord(display);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      // Try the raw lowercased form first so multi-word phrases like
      // "complying with" or "ostensibly secular" can match curated
      // entries by their full text; fall through to the normalized
      // single-word + lemma path for everything else.
      const phraseKey = display.toLowerCase();
      const he = SC_CHOICE_GLOSSARY[phraseKey] ?? lookupHebrew(key);
      rows.push({ en: display, he: he ?? SC_MISSING_TRANSLATION_HE });
    }
    return rows;
  }

  // ── Non-SC modes: stem + choices + (optionally) explanation/wrongReasons.
  //   Dictionary-hit only — words missing from the seed vocab are silently
  //   omitted so the panel stays tight.
  const words: string[] = [];
  words.push(...extractContentWords(question.text ?? "", seen));
  for (const choice of question.choices ?? []) {
    words.push(...extractContentWords(choice, seen));
  }
  if (options.includeExplanation) {
    words.push(...extractContentWords(question.explanation ?? "", seen));
    for (const reason of question.wrongReasons ?? []) {
      words.push(...extractContentWords(reason, seen));
    }
  }

  const stemRows: GlossaryRow[] = [];
  for (const word of words) {
    const he = DICT.get(word);
    if (!he) continue;
    stemRows.push({ en: word, he });
  }
  stemRows.sort((a, b) => b.en.length - a.en.length);

  rows.push(...stemRows);
  return rows;
}

export { MAX_ROWS_BEFORE_SHOW_MORE };
