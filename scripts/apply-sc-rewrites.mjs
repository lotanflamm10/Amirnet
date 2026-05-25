/**
 * Apply a curated rewrites map to the SC items in questions_expanded.json.
 *
 * Reads ./sc-rewrites-data.json (the curated rewrites), then for each id
 * present replaces only the `text` field on the matching item. Preserves
 * every other field byte-for-byte. Writes back with 2-space indent.
 *
 * Run: node scripts/apply-sc-rewrites.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";

const target = "src/data/seed/questions_expanded.json";
const rewritesPath = "scripts/sc-rewrites-data.json";

const rewrites = JSON.parse(readFileSync(rewritesPath, "utf-8"));
const data = JSON.parse(readFileSync(target, "utf-8"));

let applied = 0;
let missing = 0;
for (const item of data.sentenceCompletion ?? []) {
  if (item.id in rewrites) {
    item.text = rewrites[item.id];
    applied++;
  }
}
for (const id of Object.keys(rewrites)) {
  const found = data.sentenceCompletion?.some((q) => q.id === id);
  if (!found) {
    console.warn(`[warn] rewrite for ${id} has no matching item`);
    missing++;
  }
}

writeFileSync(target, JSON.stringify(data, null, 2) + "\n", "utf-8");
console.log(`applied ${applied} rewrites, ${missing} unmatched`);
