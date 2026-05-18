#!/usr/bin/env node
/**
 * Merges all _gen_*.json files into questions_expanded.json,
 * normalising answer-index distribution to 0/1/2/3 round-robin.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED = resolve(__dirname, "../src/data/seed");

const GEN_FILES = [
  "_gen_sc_a.json",
  "_gen_sc_b.json",
  "_gen_para_a.json",
  "_gen_para_b.json",
  "_gen_reading_1.json",
  "_gen_reading_2.json",
  "_gen_reading_3.json",
  "_gen_reading_4.json",
  "_gen_reading_5.json",
  "_gen_reading_6.json",
  "_gen_reading_7.json",
  "_gen_reading_8.json",
  "_gen_lecture_1.json",
  "_gen_lecture_2.json",
  "_gen_tc.json",
  "_gen_tc_2.json",
  "_gen_tc_3.json",
  "_gen_grammar.json",
  "_gen_wf.json",
  "_gen_writing.json",
];

/**
 * Rotate each non-writing question's correct answer to a round-robin target
 * index (0,1,2,3,0,1,…), swapping choices accordingly.
 * wrongReasons stay in the original wrong-choice order, which is preserved
 * by the splice-insert so no re-ordering is needed.
 */
function normalizeAnswers(questions) {
  let counter = 0;
  return questions.map((q) => {
    if (q.answer === -1) return q; // writing tasks — no choices

    const targetIdx = counter % 4;
    counter++;

    if (q.answer === targetIdx) return q; // already at right index

    const correctChoice = q.choices[q.answer];
    // Remove correct answer, leaving wrong choices in original relative order
    const wrongChoices = q.choices.filter((_, i) => i !== q.answer);
    // Re-insert correct answer at target index
    const newChoices = [...wrongChoices];
    newChoices.splice(targetIdx, 0, correctChoice);

    return { ...q, choices: newChoices, answer: targetIdx };
  });
}

// --- Collect from all _gen_ files ---
const collected = {};
const collectedIds = {};

for (const fname of GEN_FILES) {
  const fpath = resolve(SEED, fname);
  if (!existsSync(fpath)) { console.log(`SKIP  (missing) ${fname}`); continue; }

  let data;
  try { data = JSON.parse(readFileSync(fpath, "utf8")); }
  catch (e) { console.error(`ERROR parsing ${fname}: ${e.message}`); continue; }

  for (const [key, items] of Object.entries(data)) {
    if (!Array.isArray(items)) continue;
    if (!collected[key]) { collected[key] = []; collectedIds[key] = new Set(); }
    let added = 0;
    for (const q of items) {
      if (!collectedIds[key].has(q.id)) {
        collected[key].push(q);
        collectedIds[key].add(q.id);
        added++;
      }
    }
    if (added > 0) console.log(`  ${fname} → ${key} +${added}`);
  }
}

// Normalize answer distribution per category
for (const [key, questions] of Object.entries(collected)) {
  collected[key] = normalizeAnswers(questions);
}

// Print stats
console.log("\n=== Normalized counts ===");
for (const [key, questions] of Object.entries(collected)) {
  const dist = [0, 1, 2, 3]
    .map((i) => questions.filter((q) => q.answer === i).length)
    .join("/");
  const writing = questions.filter((q) => q.answer === -1).length;
  const line = writing > 0
    ? `${questions.length} total (${writing} writing tasks)`
    : `${questions.length} total, answer dist 0/1/2/3 = ${dist}`;
  console.log(`  ${key}: ${line}`);
}

// --- Read the existing questions_expanded.json ---
const expPath = resolve(SEED, "questions_expanded.json");
const existing = JSON.parse(readFileSync(expPath, "utf8"));

// Merge collected into existing (ID-dedup)
let totalAdded = 0;
for (const [key, items] of Object.entries(collected)) {
  if (!existing[key]) existing[key] = [];
  const existingIds = new Set(existing[key].map((q) => q.id));
  let added = 0;
  for (const q of items) {
    if (!existingIds.has(q.id)) {
      existing[key].push(q);
      existingIds.add(q.id);
      added++;
    }
  }
  if (added > 0) { console.log(`  questions_expanded.json ${key}: +${added}`); totalAdded += added; }
}

writeFileSync(expPath, JSON.stringify(existing, null, 2), "utf8");
console.log(`\nDone. ${totalAdded} questions added to questions_expanded.json.`);
