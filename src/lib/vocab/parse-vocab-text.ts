import type { VocabItem, VocabImportResult, VocabImportIssue, VocabCategory } from "@/types/vocab";

// Generates stable slug-based IDs: "account for" → "vocab_account_for"
function makeId(word: string): string {
  return "vocab_" + word.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "_");
}

function guessCategory(word: string): VocabCategory {
  const w = word.toLowerCase();
  const CONNECTORS = ["according to", "as a result", "in contrast", "on the other hand", "in addition", "however", "therefore", "moreover", "furthermore", "although", "despite", "whereas", "consequently", "by contrast", "in spite of", "due to", "on account of", "in order to", "rather than", "as well as", "even though", "by all means", "above all", "at least", "in fact", "for instance", "in particular", "such as", "in terms of", "with regard to", "as opposed to", "at the same time"];
  if (CONNECTORS.some((c) => w.startsWith(c) || w === c)) return "connectors";

  const ACADEMIC_VERBS = ["analyze", "argue", "assess", "assume", "calculate", "cause", "challenge", "classify", "compare", "conclude", "confirm", "construct", "contribute", "define", "demonstrate", "describe", "determine", "develop", "discuss", "distinguish", "emphasize", "establish", "evaluate", "examine", "explain", "explore", "express", "formulate", "generate", "identify", "illustrate", "imply", "indicate", "influence", "interpret", "investigate", "justify", "maintain", "measure", "modify", "obtain", "observe", "outline", "predict", "propose", "prove", "provide", "recognize", "refer", "relate", "represent", "require", "reveal", "select", "show", "solve", "suggest", "summarize", "support", "test", "understand", "utilize"];
  if (ACADEMIC_VERBS.some((v) => w === v || w.startsWith(v))) return "academic verbs";

  const SCIENCE = ["absorb", "absorption", "accelerate", "accumulate", "analysis", "atom", "bacteria", "catalyst", "cell", "chemical", "classify", "compound", "conduct", "current", "decay", "density", "diagnosis", "digest", "disease", "ecology", "element", "energy", "enzyme", "experiment", "ferment", "genetic", "gravity", "hypothesis", "immune", "infection", "laboratory", "matter", "membrane", "molecule", "mutation", "nerve", "nucleus", "organ", "organism", "oxygen", "particle", "phenomenon", "protein", "radiation", "react", "reproduce", "respiration", "stimulus", "tissue", "toxic", "variable", "virus"];
  if (SCIENCE.some((s) => w.startsWith(s))) return "science and research";

  return "basic vocabulary";
}

function guessPartOfSpeech(word: string): string | null {
  const w = word.toLowerCase().trim();
  if (w.endsWith("tion") || w.endsWith("sion") || w.endsWith("ment") || w.endsWith("ness") || w.endsWith("ity") || w.endsWith("ance") || w.endsWith("ence") || w.endsWith("age") || w.endsWith("ism") || w.endsWith("ist")) return "noun";
  if (w.endsWith("ly")) return "adverb";
  if (w.endsWith("ful") || w.endsWith("less") || w.endsWith("ive") || w.endsWith("ous") || w.endsWith("al") || w.endsWith("ic") || w.endsWith("able") || w.endsWith("ible")) return "adjective";
  if (w.endsWith("ize") || w.endsWith("ise") || w.endsWith("ate") || w.endsWith("ify") || w.endsWith("en")) return "verb";
  if (w.includes(" ")) return "phrase";
  return null;
}

function splitLine(line: string): { english: string; hebrew: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // The file format is: "english_word(s)   hebrew_translation"
  // Hebrew characters are U+0590–U+05FF and common punctuation
  const hebrewMatch = trimmed.match(/^(.+?)\s{2,}(.+)$/) || trimmed.match(/^(.+?)\t(.+)$/);
  if (hebrewMatch) {
    const eng = hebrewMatch[1].trim();
    const heb = hebrewMatch[2].trim();
    if (/[֐-׿]/.test(heb)) return { english: eng, hebrew: heb };
  }

  // Single space between — find where Hebrew starts
  const hebrewStart = trimmed.search(/[֐-׿]/);
  if (hebrewStart > 1) {
    const eng = trimmed.slice(0, hebrewStart).trim();
    const heb = trimmed.slice(hebrewStart).trim();
    if (eng && heb) return { english: eng, hebrew: heb };
  }

  return null;
}

export function parseVocabText(fileContent: string): VocabImportResult {
  const rawLines = fileContent.split("\n");
  const now = new Date().toISOString();
  const issues: VocabImportIssue[] = [];
  const items: VocabItem[] = [];
  const seenNormalized = new Map<string, number>(); // normalizedWord → index in items

  let totalParsed = 0;
  let duplicateCount = 0;
  let missingTranslations = 0;

  // Skip the first line if it's a header (contains "רשימה" or similar)
  const startLine = rawLines[0]?.includes("רשימה") ? 1 : 0;

  for (let i = startLine; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const trimmed = raw.trim();

    if (!trimmed) continue;

    // Skip pure-header lines
    if (/^רשימה/.test(trimmed) || /^:$/.test(trimmed)) continue;

    totalParsed++;

    const parsed = splitLine(trimmed);

    if (!parsed) {
      // Could be a line with only English and no Hebrew
      const looksEnglish = /^[a-zA-Z\s''\-(),/]+$/.test(trimmed);
      if (looksEnglish && trimmed.length > 1) {
        missingTranslations++;
        issues.push({ line: i + 1, originalLine: trimmed, issueType: "missing_hebrew", detail: "No Hebrew translation found" });
      }
      continue;
    }

    const { english, hebrew } = parsed;
    const normalizedWord = english.toLowerCase().replace(/\s+/g, " ").trim();

    if (!normalizedWord) continue;

    // Clean strange punctuation from english side
    const cleanEnglish = english.replace(/[^\w\s''\-(),/]/g, "").trim();

    // Deduplicate case-insensitively
    const existingIdx = seenNormalized.get(normalizedWord);
    if (existingIdx !== undefined) {
      duplicateCount++;
      // Merge: if existing has empty hebrew and this has hebrew, update
      const existing = items[existingIdx];
      if (!existing.hebrewTranslation && hebrew) {
        existing.hebrewTranslation = hebrew;
        existing.updatedAt = now;
      }
      issues.push({ line: i + 1, originalLine: trimmed, issueType: "duplicate", detail: `Duplicate of "${existing.word}"` });
      continue;
    }

    const id = makeId(normalizedWord);
    const category = guessCategory(normalizedWord);
    const partOfSpeech = guessPartOfSpeech(normalizedWord);

    // Mark needsReview if hebrew looks incomplete or english is suspicious
    const needsReview =
      hebrew.length < 2 ||
      /[^֐-׿\s,''.\-/()]/.test(hebrew) ||
      cleanEnglish.length < 2 ||
      /[^a-zA-Z\s''\-(),/]/.test(cleanEnglish);

    if (needsReview && issues.length < 200) {
      issues.push({ line: i + 1, originalLine: trimmed, issueType: "strange_formatting", detail: "Flagged for manual review" });
    }

    const item: VocabItem = {
      id,
      word: cleanEnglish,
      normalizedWord,
      hebrewTranslation: hebrew,
      englishDefinition: null,
      partOfSpeech,
      difficulty: "medium",
      category,
      exampleSentence: null,
      exampleSentenceHebrew: null,
      synonyms: [],
      antonyms: [],
      confusingWords: [],
      commonTrap: null,
      tags: [],
      source: "user_psychometric_vocab_file",
      originalLine: trimmed,
      needsReview,
      studyPriority: 2,
      createdAt: now,
      updatedAt: now,
    };

    seenNormalized.set(normalizedWord, items.length);
    items.push(item);
  }

  const needsReviewCount = items.filter((i) => i.needsReview).length;

  return {
    totalRawLines: rawLines.length,
    totalParsed,
    totalValid: items.length,
    duplicateCount,
    needsReviewCount,
    sourceBreakdown: {
      user_psychometric_vocab_file: items.length,
      existing_vocab_json: 0,
      hard_vocab_addon: 0,
      generated_original_enrichment: 0,
      amirnet_batch1: 0,
      amirnet_batch2: 0,
      amirnet_batch3: 0,
      amirnet_batch4: 0,
      custom: 0,
    },
    sampleIssues: issues.slice(0, 50),
    missingDefinitions: items.length,
    missingTranslations,
    items,
  };
}
