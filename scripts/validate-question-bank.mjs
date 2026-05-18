#!/usr/bin/env node
/**
 * validate-question-bank.mjs
 * Checks all question seed files for integrity and prints a count table.
 * Usage: node scripts/validate-question-bank.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// --- Files to validate ---
const FILES = [
  resolve(ROOT, "src/data/seed/questions.json"),
  resolve(ROOT, "src/data/seed/hard_questions_addon.json"),
  resolve(ROOT, "src/data/seed/questions_expanded.json"),
  resolve(ROOT, "src/data/seed/skill_booster_questions.json"),
  resolve(ROOT, "src/data/seed/diagnostic-questions.json"),
];

// --- Target minimums (after dedup) ---
const TARGETS = {
  sentenceCompletion: 220,
  paraphrasing:       220,
  grammar:            120,
  wordFormation:      120,
  reading:            220,
  lectureQuestions:   120,
  textCompletion:     120,
  writingTask:        100,
};

// Categories that intentionally share passage objects across questions
const PASSAGE_SHARE_ALLOWED = new Set(["reading", "lectureQuestions", "textCompletion"]);

// Writing-task questions have no choices and answer = -1
const WRITING_CATEGORIES = new Set(["writingTask"]);

// Skill booster categories (no passage needed)
const SKILL_BOOSTER_CATS = new Set([
  "vocabularyInContext","synonymRecognition","antonymRecognition",
  "connectorPractice","restatementMini","sentenceLogic","distractorTrap","academicPhrase",
]);

// --- Helpers ---
function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function loadJSON(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null; // file may not exist yet
  }
}

// --- Merge all files into a flat map: category → Question[] ---
// questions_expanded is optional (may not exist yet)
function mergeAll() {
  const merged = {};
  const allIds = new Set();
  let globalDupIds = 0;

  function addQuestions(key, items, srcFile) {
    if (!Array.isArray(items)) return;
    if (!merged[key]) merged[key] = [];
    for (const q of items) {
      if (!q || typeof q !== "object") continue;
      if (allIds.has(q.id)) {
        globalDupIds++;
      } else {
        allIds.add(q.id);
        merged[key].push({ ...q, _src: srcFile });
      }
    }
  }

  for (const filePath of FILES) {
    const data = loadJSON(filePath);
    if (!data) continue;
    const src = filePath.split(/[/\\]/).slice(-1)[0];

    if (Array.isArray(data)) {
      // diagnostic-questions is a flat array
      addQuestions("_diagnostic", data, src);
    } else {
      for (const [key, items] of Object.entries(data)) {
        addQuestions(key, items, src);
      }
    }
  }

  return { merged, globalDupIds };
}

// --- Validation ---
let totalErrors = 0;
let totalWarnings = 0;

function err(msg)  { console.error(`  ❌ ${msg}`); totalErrors++; }
function warn(msg) { console.warn (`  ⚠️  ${msg}`); totalWarnings++; }

function validateCategory(key, questions) {
  const isWriting = WRITING_CATEGORIES.has(key);
  const allowPassageShare = PASSAGE_SHARE_ALLOWED.has(key);

  const seenTexts   = new Map(); // normalizedText → id
  const seenPassage = new Map(); // passageId → first questionId

  for (const q of questions) {
    const qid = q.id ?? "(no id)";
    const prefix = `[${key}/${qid}]`;

    // --- Basic required fields ---
    if (!q.text || q.text.trim() === "")
      err(`${prefix} empty text`);

    if (!isWriting) {
      if (!Array.isArray(q.choices) || q.choices.length === 0)
        err(`${prefix} missing choices`);
      else if (q.choices.length < 4)
        err(`${prefix} fewer than 4 choices (has ${q.choices.length})`);

      if (typeof q.answer !== "number" || q.answer < 0)
        err(`${prefix} invalid answer index: ${q.answer}`);
      else if (Array.isArray(q.choices) && q.answer >= q.choices.length)
        err(`${prefix} answer index ${q.answer} out of bounds (${q.choices.length} choices)`);
    }

    if (!q.explanation || q.explanation.trim() === "")
      err(`${prefix} empty explanation`);

    if (!isWriting) {
      if (!Array.isArray(q.wrongReasons) || q.wrongReasons.length === 0)
        err(`${prefix} empty wrongReasons`);
    }

    if (!q.difficulty || !["easy","medium","hard"].includes(q.difficulty))
      err(`${prefix} invalid difficulty: ${q.difficulty}`);

    // --- Duplicate text ---
    // For passage-based questions, key on passage.id + text so that the same
    // question phrasing (e.g. "What is the main idea?") is allowed across
    // different passages, and textCompletion's fixed prompt text is allowed.
    const norm = normalizeText(q.text ?? "");
    const stemKey = q.passage ? (q.passage.id + "|" + norm) : norm;
    if (seenTexts.has(stemKey)) {
      err(`${prefix} duplicate stem (same as ${seenTexts.get(stemKey)})`);
    } else {
      seenTexts.set(stemKey, qid);
    }

    // --- Passage reuse check ---
    if (q.passage) {
      const pid = q.passage.id;
      if (!allowPassageShare && seenPassage.has(pid)) {
        warn(`${prefix} passage "${pid}" reused (first use: ${seenPassage.get(pid)})`);
      } else if (!seenPassage.has(pid)) {
        seenPassage.set(pid, qid);
      }

      if (!q.passage.body || q.passage.body.trim() === "")
        err(`${prefix} passage has empty body`);
    }
  }

  return seenTexts.size; // unique stems
}

// --- Main ---
const { merged, globalDupIds } = mergeAll();

if (globalDupIds > 0) {
  console.log(`\n⚠️  ${globalDupIds} duplicate ID(s) found across files (later copies skipped in merge)\n`);
}

console.log("\n=== Per-category validation ===\n");

const summary = [];

for (const [key, questions] of Object.entries(merged)) {
  if (key === "_diagnostic") continue; // skip diagnostic flat array
  if (questions.length === 0) continue;

  console.log(`▶ ${key} (${questions.length} total)`);
  const uniqueStems = validateCategory(key, questions);

  const easy   = questions.filter(q => q.difficulty === "easy").length;
  const medium = questions.filter(q => q.difficulty === "medium").length;
  const hard   = questions.filter(q => q.difficulty === "hard").length;
  const dups   = questions.length - uniqueStems;

  summary.push({ key, total: questions.length, uniqueStems, easy, medium, hard, dups });
}

// --- Count table ---
console.log("\n=== Count table ===\n");
const colW = [22, 7, 8, 6, 8, 6, 8, 10];
const header = ["category","total","unique","easy","medium","hard","dups","target?"];
console.log(header.map((h,i) => h.padEnd(colW[i])).join("  "));
console.log("-".repeat(colW.reduce((a,b)=>a+b,0) + colW.length * 2));

for (const row of summary) {
  const target  = TARGETS[row.key];
  const reached = !target ? "—" : row.uniqueStems >= target ? "✅" : `❌ (need ${target - row.uniqueStems} more)`;
  const cols = [
    row.key,
    String(row.total),
    String(row.uniqueStems),
    String(row.easy),
    String(row.medium),
    String(row.hard),
    row.dups > 0 ? `⚠️ ${row.dups}` : "0",
    reached,
  ];
  console.log(cols.map((c,i) => c.padEnd(colW[i])).join("  "));
}

// --- Final verdict ---
console.log("");
if (totalErrors === 0 && totalWarnings === 0) {
  console.log("✅ All checks passed.");
} else {
  if (totalErrors   > 0) console.error(`❌ ${totalErrors} error(s) found.`);
  if (totalWarnings > 0) console.warn (`⚠️  ${totalWarnings} warning(s) found.`);
}

// Check targets
const missedTargets = summary.filter(r => {
  const t = TARGETS[r.key];
  return t && r.uniqueStems < t;
});
if (missedTargets.length > 0) {
  console.log(`\n📋 ${missedTargets.length} category/categories below target:`);
  for (const r of missedTargets) {
    console.log(`   ${r.key}: ${r.uniqueStems} unique / ${TARGETS[r.key]} needed`);
  }
  process.exit(1);
} else if (totalErrors > 0) {
  process.exit(1);
}
