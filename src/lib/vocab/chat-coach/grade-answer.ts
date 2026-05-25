import type { VocabItem } from "@/types/vocab";
import { getChatEnrichment } from "./enrichment";

export type GradeConfidence = "exact" | "alias" | "partial" | "wrong" | "blank";
export type MistakeType = "confusion" | "partial" | "wrong_word" | "blank";

export interface GradeResult {
  correct: boolean;
  confidence: GradeConfidence;
  /** Short HE explanation suitable for the "still need work" expander. */
  reason: string;
  /** First canonical Hebrew answer (with the "..." stripped). */
  expectedAnswer: string;
  /** Only set when the answer is wrong/partial. */
  mistakeType?: MistakeType;
  /** Which alias the user matched on (for debug + reason text). */
  matchedAlias?: string;
}

/**
 * Strip a trailing literal "..." from the seed's hebrewTranslation. ~18
 * legacy entries in vocab.normalized.json end with "..." mid-phrase (e.g.
 * "לדבוק ב...") — see DIFFICULTY_AUDIT §B.10. Without this strip the chat
 * coach grader would refuse every legitimate answer for those words.
 */
function stripTruncation(raw: string): string {
  return raw.replace(/\.{3,}$/u, "").trim();
}

const SPLIT_RE = /\s*(?:[,/;]|\s;\s)\s*/u;

export function splitAliases(rawTranslation: string): string[] {
  const stripped = stripTruncation(rawTranslation);
  if (!stripped) return [];
  return stripped
    .split(SPLIT_RE)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Normalize a Hebrew answer for comparison. Removes punctuation, collapses
 * whitespace, normalizes gershayim/quotation marks/apostrophes. DOES NOT
 * normalize final-letter forms (ך/ם/ן/ף/ץ) — those carry orthographic
 * meaning and matching them implicitly would mask real mistakes.
 */
export function normalizeForCompare(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[‘’ʼʹʻʽ']/g, "'")
    .replace(/[“”״]/g, '"')
    .replace(/[.,!?״”’'"`׳]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const HEBREW_LETTER_RE = /[֐-׿]/g;

function countHebrewLetters(s: string): number {
  return (s.match(HEBREW_LETTER_RE) ?? []).length;
}

/**
 * Strip a leading prefix-לetter from a verb-particle answer. Some learners
 * type "דבוק" instead of "לדבוק" — we surface that as "partial", not "wrong".
 */
function stripLamedPrefix(s: string): string {
  return s.startsWith("ל") && s.length > 2 ? s.slice(1).trim() : s;
}

export function gradeVocabAnswer(item: VocabItem, userAnswer: string): GradeResult {
  const enrich = getChatEnrichment(item.id);
  const canonicalRaw = stripTruncation(item.hebrewTranslation ?? "");
  const aliases = [
    ...splitAliases(item.hebrewTranslation ?? ""),
    ...(enrich?.extraAliases ?? []).map(stripTruncation),
  ];
  const canonical = aliases[0] ?? canonicalRaw;
  const expectedAnswer = canonical;

  const userNorm = normalizeForCompare(userAnswer ?? "");
  if (!userNorm) {
    return {
      correct: false,
      confidence: "blank",
      reason: "השארת ריק — נסה לכתוב את התרגום בעברית.",
      expectedAnswer,
      mistakeType: "blank",
    };
  }

  const normedAliases = aliases.map(normalizeForCompare).filter((a) => a.length > 0);

  // Exact match against the canonical (first alias).
  const canonicalNorm = normedAliases[0] ?? "";
  if (canonicalNorm && userNorm === canonicalNorm) {
    return {
      correct: true,
      confidence: "exact",
      reason: "תרגום מדויק.",
      expectedAnswer,
      matchedAlias: aliases[0],
    };
  }

  // Match against any other alias.
  for (let i = 1; i < normedAliases.length; i++) {
    if (userNorm === normedAliases[i]) {
      return {
        correct: true,
        confidence: "alias",
        reason: `נכון. ההצגה הראשית בכרטיס היא "${aliases[0]}", אבל גם "${aliases[i]}" תקין.`,
        expectedAnswer,
        matchedAlias: aliases[i],
      };
    }
  }

  // Curated confusion hit — these are common wrong-but-plausible answers.
  for (const conf of enrich?.confusions ?? []) {
    if (normalizeForCompare(conf) === userNorm) {
      return {
        correct: false,
        confidence: "wrong",
        reason: `"${conf}" — קרוב אבל לא נכון. שים לב לבלבול הזה.`,
        expectedAnswer,
        mistakeType: "confusion",
        matchedAlias: canonical,
      };
    }
  }

  // Partial match: substring of a canonical that itself is ≥3 Hebrew letters,
  // OR the answer matches an alias after stripping a leading ל. Strict mode:
  // partial is still "not correct" and the word is treated as weak.
  for (const alias of normedAliases) {
    if (countHebrewLetters(alias) < 3) continue;
    if (alias.includes(userNorm) && userNorm.length > 0 && userNorm !== alias) {
      return {
        correct: false,
        confidence: "partial",
        reason: `חלקי. התשובה המלאה היא "${aliases[0]}".`,
        expectedAnswer,
        mistakeType: "partial",
      };
    }
    if (stripLamedPrefix(alias) === stripLamedPrefix(userNorm) && alias !== userNorm) {
      return {
        correct: false,
        confidence: "partial",
        reason: `כמעט. חסר ה־"ל" של שם הפועל: "${aliases[0]}".`,
        expectedAnswer,
        mistakeType: "partial",
      };
    }
  }

  // Outright wrong.
  return {
    correct: false,
    confidence: "wrong",
    reason: `התשובה הנכונה: "${aliases[0]}".`,
    expectedAnswer,
    mistakeType: "wrong_word",
  };
}
