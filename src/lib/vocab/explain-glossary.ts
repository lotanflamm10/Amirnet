import type { Question } from "@/types/questions";
import vocabRaw from "@/data/seed/vocab.normalized.json";

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
export function getGlossaryForQuestion(
  question: Question,
  options: GetGlossaryOptions = {}
): GlossaryRow[] {
  const seen = new Set<string>();
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

  const rows: GlossaryRow[] = [];
  for (const word of words) {
    const he = DICT.get(word);
    if (!he) continue;
    rows.push({ en: word, he });
  }

  rows.sort((a, b) => b.en.length - a.en.length);
  return rows;
}

export { MAX_ROWS_BEFORE_SHOW_MORE };
