import type { VocabItem } from "@/types/vocab";
import vocabRaw from "@/data/seed/vocab.normalized.json";
import { normalizeWordKey } from "./unknown-words-store";

const vocabData = vocabRaw as unknown as VocabItem[];

// Build the lookup table once per browser session.
let DICT: Map<string, string> | null = null;

function buildDict(): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of vocabData) {
    const translation = item.hebrewTranslation?.trim();
    if (!translation) continue;
    const candidates = [
      item.normalizedWord,
      item.word,
    ].filter(Boolean);
    for (const c of candidates) {
      const key = normalizeWordKey(c);
      if (!key) continue;
      if (!map.has(key)) map.set(key, translation);
    }
  }
  return map;
}

function getDict(): Map<string, string> {
  if (!DICT) DICT = buildDict();
  return DICT;
}

const FALLBACK_HE = "(תרגום לא זמין)";

export interface LookupResult {
  /** The original highlighted text, trimmed. */
  source: string;
  /** The Hebrew translation, or a clean fallback. */
  translation: string;
  /** True if the whole phrase was found verbatim in the dictionary. */
  matchedWhole: boolean;
  /** Per-token breakdown — present for phrases of >1 word. */
  tokens?: { word: string; translation: string | null }[];
}

/**
 * Look up a Hebrew translation for an English word or phrase. Strategy:
 *   1) Try a direct phrase match (normalized).
 *   2) For multi-word inputs, also build a per-token breakdown.
 *   3) If nothing was found at all, return the fallback string.
 */
export function lookupTranslation(input: string): LookupResult {
  const source = input.trim();
  if (!source) {
    return { source, translation: FALLBACK_HE, matchedWhole: false };
  }
  const dict = getDict();
  const wholeKey = normalizeWordKey(source);
  const whole = dict.get(wholeKey);

  if (whole) {
    return { source, translation: whole, matchedWhole: true };
  }

  // Tokenize phrases — strip surrounding punctuation per token.
  const tokens = source
    .split(/\s+/)
    .map((t) => t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean);

  if (tokens.length <= 1) {
    return { source, translation: FALLBACK_HE, matchedWhole: false };
  }

  const tokenLookups = tokens.map((tok) => ({
    word: tok,
    translation: dict.get(normalizeWordKey(tok)) ?? null,
  }));

  const hits = tokenLookups.filter((t) => t.translation);
  if (hits.length === 0) {
    return {
      source,
      translation: FALLBACK_HE,
      matchedWhole: false,
      tokens: tokenLookups,
    };
  }

  // Join the per-word translations in the original word order. RTL display
  // is the caller's responsibility (the popup uses dir="rtl" for Hebrew).
  const joined = tokenLookups
    .map((t) => t.translation ?? `[${t.word}]`)
    .join(" ");

  return {
    source,
    translation: joined,
    matchedWhole: false,
    tokens: tokenLookups,
  };
}
