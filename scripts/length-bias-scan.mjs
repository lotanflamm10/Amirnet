#!/usr/bin/env node
/**
 * length-bias-scan.mjs
 *
 * Scans restatement seed files for length bias: items where the correct
 * paraphrase is the strict-longest option, or within one word of the
 * longest distractor (a subtler bias a test-taker can still learn).
 *
 * Output: qa-report/length-bias-scan.md
 *
 * Usage:  node scripts/length-bias-scan.mjs
 *         npm run audit:length-bias
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const FILES = [
  "src/data/seed/_gen_para_a.json",
  "src/data/seed/_gen_para_b.json",
];

function wordCount(s) {
  return (s ?? "").trim().split(/\s+/).filter(Boolean).length;
}

function loadFile(rel) {
  const path = resolve(ROOT, rel);
  const json = JSON.parse(readFileSync(path, "utf8"));
  const items = json.paraphrasing ?? [];
  return items.map((q) => ({ ...q, _src: rel }));
}

function analyzeItem(q) {
  const choices = Array.isArray(q.choices) ? q.choices : [];
  const lengths = choices.map(wordCount);
  const correctIdx = typeof q.answer === "number" ? q.answer : -1;
  const correctLen = correctIdx >= 0 && correctIdx < lengths.length ? lengths[correctIdx] : 0;
  const distractorLens = lengths.filter((_, i) => i !== correctIdx);
  const maxDistractor = distractorLens.length ? Math.max(...distractorLens) : 0;
  const meanDistractor = distractorLens.length
    ? distractorLens.reduce((a, b) => a + b, 0) / distractorLens.length
    : 0;
  const strictLongest = correctIdx >= 0
    && lengths.every((len, i) => i === correctIdx || len < correctLen);
  // "Near-longest": correct is longest OR within 1 word of the longest distractor.
  const nearLongest = correctIdx >= 0 && correctLen >= maxDistractor - 1;
  const gap = correctLen - meanDistractor;
  const ratio = meanDistractor > 0 ? correctLen / meanDistractor : null;
  return {
    id: q.id,
    file: q._src,
    difficulty: q.difficulty,
    correctLen,
    meanDistractor: Math.round(meanDistractor * 10) / 10,
    maxDistractor,
    gap: Math.round(gap * 10) / 10,
    ratio: ratio === null ? null : Math.round(ratio * 100) / 100,
    strictLongest,
    nearLongest,
  };
}

const items = FILES.flatMap(loadFile);
const analyses = items.map(analyzeItem);

const total = analyses.length;
const strict = analyses.filter((a) => a.strictLongest).length;
const near = analyses.filter((a) => a.nearLongest).length;

const byFile = {};
for (const f of FILES) {
  const subset = analyses.filter((a) => a.file === f);
  byFile[f] = {
    total: subset.length,
    strict: subset.filter((a) => a.strictLongest).length,
    near: subset.filter((a) => a.nearLongest).length,
  };
}

const worst40 = [...analyses]
  .sort((a, b) => b.gap - a.gap)
  .slice(0, 40);

function pct(n, d) {
  return d ? `${((n / d) * 100).toFixed(1)}%` : "—";
}

const lines = [];
lines.push("# Restatement length-bias scan");
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push("Definitions:");
lines.push("- **Strict longest**: correct answer is the single longest option (no ties).");
lines.push("- **Near-longest**: correct answer's word count >= max distractor - 1.");
lines.push("- **Gap**: correct length minus mean distractor length (positive = longer).");
lines.push("");
lines.push("## Aggregate");
lines.push("");
lines.push(`- Total items scanned: **${total}**`);
lines.push(`- Strict-longest: **${strict}** (${pct(strict, total)})`);
lines.push(`- Near-longest:   **${near}** (${pct(near, total)})`);
lines.push("");
lines.push("## Per-file");
lines.push("");
lines.push("| file | total | strict-longest | near-longest |");
lines.push("|---|---:|---:|---:|");
for (const [file, agg] of Object.entries(byFile)) {
  lines.push(`| \`${file}\` | ${agg.total} | ${agg.strict} (${pct(agg.strict, agg.total)}) | ${agg.near} (${pct(agg.near, agg.total)}) |`);
}
lines.push("");
lines.push("## Worst 40 offenders (largest gap correct - mean distractor)");
lines.push("");
lines.push("| # | id | file | difficulty | correct words | mean distractor | gap | ratio | strict? |");
lines.push("|---:|---|---|---|---:|---:|---:|---:|---|");
worst40.forEach((a, i) => {
  lines.push(
    `| ${i + 1} | ${a.id} | \`${a.file.split("/").pop()}\` | ${a.difficulty} | ${a.correctLen} | ${a.meanDistractor} | ${a.gap} | ${a.ratio ?? "—"} | ${a.strictLongest ? "yes" : "no"} |`
  );
});
lines.push("");

const OUT_DIR = resolve(ROOT, "qa-report");
mkdirSync(OUT_DIR, { recursive: true });
const OUT_PATH = resolve(OUT_DIR, "length-bias-scan.md");
writeFileSync(OUT_PATH, lines.join("\n") + "\n");

console.log(`Wrote ${OUT_PATH}`);
console.log(`Strict-longest: ${strict}/${total} (${pct(strict, total)})`);
console.log(`Near-longest:   ${near}/${total} (${pct(near, total)})`);
