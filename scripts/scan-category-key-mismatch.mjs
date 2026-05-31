#!/usr/bin/env node
/**
 * scan-category-key-mismatch.mjs
 *
 * Surveys questions_expanded.json for items whose `category` metadata
 * does NOT match the top-level array key they live under. The practice
 * selector pulls items by top-level KEY, so a vocabularyInContext-tagged
 * item under the wordFormation key still surfaces in /practice/wordFormation.
 *
 * This is a SURVEY only — no fixes applied. Output sets up scope for a
 * future sweep similar to the wf107 relocation done in Phase 3 Batch B.
 *
 * Output: qa-report/category-key-mismatch.md
 *
 * Usage:  node scripts/scan-category-key-mismatch.mjs
 *         npm run audit:category-key
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Map top-level key -> the category string that ought to match. Some keys
// (e.g. "paraphrasing") are stored under a different category label by
// convention; record the expected category so the comparison is fair.
const KEY_TO_EXPECTED_CATEGORY = {
  sentenceCompletion: "sentenceCompletion",
  paraphrasing: "restatements",
  reading: "reading",
  grammar: "grammar",
  wordFormation: "wordFormation",
  lectureQuestions: "lectureQuestions",
  textCompletion: "textCompletion",
  writingTask: "writingTask",
};

const TARGET = "src/data/seed/questions_expanded.json";
const data = JSON.parse(readFileSync(resolve(ROOT, TARGET), "utf8"));

const perKey = {};
const mismatches = [];

for (const [key, items] of Object.entries(data)) {
  if (!Array.isArray(items)) continue;
  const expected = KEY_TO_EXPECTED_CATEGORY[key];
  if (!expected) continue; // unrecognised key — skip rather than false-positive
  perKey[key] = { total: items.length, mismatch: 0 };
  for (const q of items) {
    const cat = q?.category;
    if (typeof cat === "string" && cat !== expected) {
      perKey[key].mismatch++;
      if (mismatches.length < 20) {
        mismatches.push({ key, id: q.id, category: cat, expected });
      } else {
        mismatches.push(null); // count only
      }
    }
  }
}

const totalMismatch = Object.values(perKey).reduce((s, v) => s + v.mismatch, 0);
const totalItems = Object.values(perKey).reduce((s, v) => s + v.total, 0);

const lines = [];
lines.push("# questions_expanded.json — category vs top-level key mismatch survey");
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push("The practice selector (`src/lib/practice/question-selector.ts`) pulls items by");
lines.push("their TOP-LEVEL key in the JSON. The `category` field on each item is metadata");
lines.push("only — a misclassified item still surfaces in the wrong practice mode unless it");
lines.push("is physically moved (see Phase 3 Batch B wf107 relocation for the canonical fix).");
lines.push("");
lines.push("This file is a SURVEY only. No fixes applied.");
lines.push("");
lines.push("## Aggregate");
lines.push("");
lines.push(`- Total items scanned: **${totalItems}**`);
lines.push(`- Items where \`category\` mismatches their top-level key: **${totalMismatch}**`);
lines.push("");
lines.push("## Per-key breakdown");
lines.push("");
lines.push("| top-level key | total items | mismatches |");
lines.push("|---|---:|---:|");
for (const [key, v] of Object.entries(perKey)) {
  lines.push(`| \`${key}\` | ${v.total} | ${v.mismatch} |`);
}
lines.push("");
lines.push("## First 20 mismatches");
lines.push("");
lines.push("| top-level key | item id | declared category | expected |");
lines.push("|---|---|---|---|");
for (const m of mismatches.filter(Boolean).slice(0, 20)) {
  lines.push(`| \`${m.key}\` | \`${m.id}\` | \`${m.category}\` | \`${m.expected}\` |`);
}
lines.push("");

const OUT_PATH = resolve(ROOT, "qa-report", "category-key-mismatch.md");
mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, lines.join("\n") + "\n");

console.log(`Wrote ${OUT_PATH}`);
console.log(`Total mismatches: ${totalMismatch} / ${totalItems}`);
