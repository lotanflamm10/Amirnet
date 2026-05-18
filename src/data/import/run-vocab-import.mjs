/**
 * Run with: node src/data/import/run-vocab-import.mjs
 * Reads psychometric_vocab_he.txt, parses it, writes to src/data/seed/
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../../..");

// --- Inline the parser (no TypeScript transform needed) ---

function makeId(word) {
  return "vocab_" + word.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "_");
}

function guessCategory(word) {
  const w = word.toLowerCase();
  const CONNECTORS = ["according to", "as a result", "in contrast", "on the other hand", "in addition", "however", "therefore", "moreover", "furthermore", "although", "despite", "whereas", "consequently", "by contrast", "in spite of", "due to", "on account of", "in order to", "rather than", "as well as", "even though", "by all means", "above all", "at least", "in fact", "for instance", "in particular", "such as", "in terms of", "with regard to", "as opposed to", "at the same time"];
  if (CONNECTORS.some((c) => w === c || w.startsWith(c + " "))) return "connectors";
  const ACADEMIC_VERBS = ["analyze", "argue", "assess", "assume", "calculate", "cause", "challenge", "classify", "compare", "conclude", "confirm", "construct", "contribute", "define", "demonstrate", "describe", "determine", "develop", "discuss", "distinguish", "emphasize", "establish", "evaluate", "examine", "explain", "explore", "express", "formulate", "generate", "identify", "illustrate", "imply", "indicate", "influence", "interpret", "investigate", "justify", "maintain", "measure", "modify", "obtain", "observe", "outline", "predict", "propose", "prove", "provide", "recognize", "refer", "relate", "represent", "require", "reveal", "select", "show", "solve", "suggest", "summarize", "support", "test", "understand", "utilize"];
  if (ACADEMIC_VERBS.some((v) => w === v || w.startsWith(v))) return "academic verbs";
  const SCIENCE = ["absorb", "absorption", "accelerate", "accumulate", "analysis", "atom", "bacteria", "catalyst", "cell", "chemical", "classify", "compound", "conduct", "current", "decay", "density", "diagnosis", "digest", "disease", "ecology", "element", "energy", "enzyme", "experiment", "ferment", "genetic", "gravity", "hypothesis", "immune", "infection", "laboratory", "matter", "membrane", "molecule", "mutation", "nerve", "nucleus", "organ", "organism", "oxygen", "particle", "phenomenon", "protein", "radiation", "react", "reproduce", "respiration", "stimulus", "tissue", "toxic", "variable", "virus"];
  if (SCIENCE.some((s) => w.startsWith(s))) return "science and research";
  return "basic vocabulary";
}

function guessPartOfSpeech(word) {
  const w = word.toLowerCase().trim();
  if (w.endsWith("tion") || w.endsWith("sion") || w.endsWith("ment") || w.endsWith("ness") || w.endsWith("ity") || w.endsWith("ance") || w.endsWith("ence") || w.endsWith("age") || w.endsWith("ism") || w.endsWith("ist")) return "noun";
  if (w.endsWith("ly")) return "adverb";
  if (w.endsWith("ful") || w.endsWith("less") || w.endsWith("ive") || w.endsWith("ous") || w.endsWith("al") || w.endsWith("ic") || w.endsWith("able") || w.endsWith("ible")) return "adjective";
  if (w.endsWith("ize") || w.endsWith("ise") || w.endsWith("ate") || w.endsWith("ify") || w.endsWith("en")) return "verb";
  if (w.includes(" ")) return "phrase";
  return null;
}

function splitLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const hebrewStart = trimmed.search(/[א-תיִ-פֿ]/);
  if (hebrewStart > 1) {
    const eng = trimmed.slice(0, hebrewStart).trim();
    const heb = trimmed.slice(hebrewStart).trim();
    if (eng && heb) return { english: eng, hebrew: heb };
  }
  const tabMatch = trimmed.match(/^(.+?)\t(.+)$/);
  if (tabMatch) {
    const eng = tabMatch[1].trim();
    const heb = tabMatch[2].trim();
    if (/[א-ת]/.test(heb)) return { english: eng, hebrew: heb };
  }
  return null;
}

function parseVocabText(fileContent) {
  const rawLines = fileContent.split("\n");
  const now = new Date().toISOString();
  const issues = [];
  const items = [];
  const seenNormalized = new Map();
  let totalParsed = 0;
  let duplicateCount = 0;
  let missingTranslations = 0;

  const startLine = rawLines[0]?.includes("רשימה") ? 1 : 0;

  for (let i = startLine; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (/^רשימה/.test(trimmed)) continue;

    totalParsed++;
    const parsed = splitLine(trimmed);

    if (!parsed) {
      const looksEnglish = /^[a-zA-Z\s'',()\-/]+$/.test(trimmed) && trimmed.length > 1;
      if (looksEnglish) {
        missingTranslations++;
        if (issues.length < 200) issues.push({ line: i + 1, originalLine: trimmed, issueType: "missing_hebrew", detail: "No Hebrew translation found" });
      }
      continue;
    }

    const { english, hebrew } = parsed;
    const normalizedWord = english.toLowerCase().replace(/\s+/g, " ").trim();
    if (!normalizedWord || normalizedWord.length < 2) continue;

    const cleanEnglish = english.replace(/[^\w\s'',()\-/]/g, "").trim();

    const existingIdx = seenNormalized.get(normalizedWord);
    if (existingIdx !== undefined) {
      duplicateCount++;
      const existing = items[existingIdx];
      if (!existing.hebrewTranslation && hebrew) {
        existing.hebrewTranslation = hebrew;
        existing.updatedAt = now;
      }
      if (issues.length < 200) issues.push({ line: i + 1, originalLine: trimmed, issueType: "duplicate", detail: `Duplicate of "${existing.word}"` });
      continue;
    }

    const id = makeId(normalizedWord);
    const category = guessCategory(normalizedWord);
    const partOfSpeech = guessPartOfSpeech(normalizedWord);
    const needsReview = hebrew.length < 2 || cleanEnglish.length < 2;

    const item = {
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

  const report = {
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
    },
    sampleIssues: issues.slice(0, 50),
    missingDefinitions: items.length,
    missingTranslations,
  };

  return { items, report };
}

// --- Run ---
const txtPath = join(__dirname, "psychometric_vocab_he.txt");
const content = readFileSync(txtPath, "utf8");

console.log("Parsing vocab file...");
const { items, report } = parseVocabText(content);

const seedDir = join(ROOT, "src/data/seed");
writeFileSync(join(seedDir, "vocab.normalized.json"), JSON.stringify(items, null, 2), "utf8");
writeFileSync(join(seedDir, "vocab.import-report.json"), JSON.stringify(report, null, 2), "utf8");

console.log(`✓ Parsed ${report.totalRawLines} raw lines`);
console.log(`✓ Valid entries: ${report.totalValid}`);
console.log(`✓ Duplicates removed: ${report.duplicateCount}`);
console.log(`✓ Needs review: ${report.needsReviewCount}`);
console.log(`✓ Missing translations: ${report.missingTranslations}`);
console.log(`✓ Written to src/data/seed/vocab.normalized.json`);
console.log(`✓ Written to src/data/seed/vocab.import-report.json`);
