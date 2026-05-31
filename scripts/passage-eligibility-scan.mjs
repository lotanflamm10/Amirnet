#!/usr/bin/env node
/**
 * passage-eligibility-scan.mjs
 *
 * Surveys reading-passage seed files for AMIRAM simulation eligibility
 * (≥3 paragraphs AND ≥180 words AND ≥5 questions per passage).
 *
 * Scoped to the four files Phase 3 Batch D authorises to edit, plus
 * a pool-wide section that also includes the read-only families
 * (_gen_reading_1..8, _gen_reading_sim_*) for context.
 *
 * Output: qa-report/passage-eligibility-scan.md
 *
 * Usage:  node scripts/passage-eligibility-scan.mjs
 *         npm run audit:passage-eligibility
 */
import { readFileSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const MIN_PARAGRAPHS = 3;
const MIN_QUESTIONS = 5;
const MIN_WORDS = 180;

// Files Phase 3 Batch D may edit
const SCOPED = [
  "src/data/seed/questions.json",
  "src/data/seed/_gen_reading_a_part1.json",
  "src/data/seed/_gen_reading_b_part1.json",
  "src/data/seed/_gen_reading_b_part2.json",
];

// Read-only context (out of Batch D scope)
const CONTEXT = [
  "_gen_reading_1.json", "_gen_reading_2.json", "_gen_reading_3.json",
  "_gen_reading_4.json", "_gen_reading_5.json", "_gen_reading_6.json",
  "_gen_reading_7.json", "_gen_reading_8.json",
  "_gen_reading_sim_a.json", "_gen_reading_sim_b.json", "_gen_reading_sim_c.json",
  "_gen_reading_sim_d.json", "_gen_reading_sim_e.json", "_gen_reading_sim_f.json",
].map((f) => `src/data/seed/${f}`);

// ── hasNamedAnchor — mirrored from src/lib/simulation/sc-amirnet-composer.ts ──
const NAMED_ANCHORS = [
  "Korematsu","Hubble","Wright","Roosevelt","Einstein","Madison","Curie","Galileo",
  "Renaissance","Roman","Greek","Babylonian","Eiffel","Alexander","Caesar","Lincoln",
  "Washington","Constitution","Magna Carta","Newton","Darwin","Mandela","Gandhi","Tesla",
  "Edison","Goodall","Sagan","Yousafzai","Victoria","Cleopatra","Tolkien","Hemingway",
  "Shakespeare","Beethoven","Mozart","Matisse","Picasso","Hughes","Korean","Harlem",
  "Babylon","Bauhaus","Industrial Revolution","Cold War","Cuban","World War","Apollo",
  "NASA","Stonewall","Suffragette","Reformation","Enlightenment","Crusades","Byzantine",
  "Ottoman","Mongol","Inca","Aztec","Mayan",
];
const HAY = NAMED_ANCHORS.map((a) => a.toLowerCase());
const JOINERS = new Set([
  "The","A","An","And","Or","But","Of","In","On","At","By","For","To","With","From","As",
  "If","When","While","Although","Because","Since","Until","Unless","Despite","However",
  "Yet","So","Then","Now","Here","There","This","That","These","Those","His","Her","Their",
  "Its","Our","Your","My","Many","Some","Most","Few","All","Several","Other","Another","Such",
]);
const CAP_RE = /^[A-Z][A-Za-z'’\-]*$/;

function hasNamedAnchor(stem) {
  if (!stem) return false;
  const lower = stem.toLowerCase();
  for (const a of HAY) {
    if (lower.includes(a)) {
      const idx = lower.indexOf(a);
      const before = idx === 0 ? " " : lower[idx - 1];
      const after = idx + a.length >= lower.length ? " " : lower[idx + a.length];
      if (!/[a-z]/i.test(before) && !/[a-z]/i.test(after)) return true;
    }
  }
  const tokens = stem.split(/\s+/).filter(Boolean);
  let run = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].replace(/^[(\[{"'“‘]+|[)\]}.,;:!?"'”’]+$/g, "");
    const isCap = CAP_RE.test(t);
    if (isCap && i !== 0 && !JOINERS.has(t)) {
      run++;
      if (run >= 2) return true;
    } else run = 0;
  }
  return false;
}

function wordCount(s) {
  return (s ?? "").trim().split(/\s+/).filter(Boolean).length;
}
function paragraphCount(s) {
  return (s ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).length;
}

function loadReadingItems(relPath) {
  const path = resolve(ROOT, relPath);
  let raw;
  try { raw = JSON.parse(readFileSync(path, "utf8")); }
  catch { return []; }
  let items = [];
  if (Array.isArray(raw)) items = raw;
  else if (Array.isArray(raw.reading)) items = raw.reading;
  else return [];
  return items
    .filter((q) => q && q.passage && q.passage.id)
    .map((q) => ({ ...q, _src: relPath }));
}

function buildPassageIndex(items) {
  const map = new Map();
  for (const q of items) {
    const pid = q.passage.id;
    if (!map.has(pid)) {
      map.set(pid, {
        id: pid,
        title: q.passage.title ?? null,
        body: q.passage.body ?? "",
        file: q._src,
        questions: [],
      });
    }
    map.get(pid).questions.push({ id: q.id, difficulty: q.difficulty, text: q.text });
  }
  return [...map.values()];
}

function analysePassage(p) {
  const words = wordCount(p.body);
  const paragraphs = paragraphCount(p.body);
  const qs = p.questions.length;
  const okParas = paragraphs >= MIN_PARAGRAPHS;
  const okWords = words >= MIN_WORDS;
  const okQs = qs >= MIN_QUESTIONS;
  const eligible = okParas && okWords && okQs;
  const failCount = [okParas, okWords, okQs].filter((x) => !x).length;
  const nearEligible = !eligible && failCount === 1;
  // Anchor detection: title or first paragraph
  const firstPara = (p.body.split(/\n{2,}/)[0] ?? "").trim();
  const anchor = hasNamedAnchor(p.title ?? "") || hasNamedAnchor(firstPara);
  return { ...p, words, paragraphs, qs, eligible, nearEligible, anchor };
}

// ── Scoped scan (Batch D editable files) ──
const scopedItems = SCOPED.flatMap(loadReadingItems);
const scopedPassages = buildPassageIndex(scopedItems).map(analysePassage);
const scopedEligible = scopedPassages.filter((p) => p.eligible);
const scopedNear = scopedPassages.filter((p) => p.nearEligible);

// ── Context scan (pool-wide eligible count) ──
const contextItems = CONTEXT.flatMap(loadReadingItems);
const contextPassages = buildPassageIndex(contextItems).map(analysePassage);
const contextEligible = contextPassages.filter((p) => p.eligible);

const poolWideEligible = scopedEligible.length + contextEligible.length;

// ── Top 30 growth candidates from scoped pool ──
// Score: prefer near-eligible, prefer anchor-already-present, prefer higher base material.
function candidateScore(p) {
  if (p.eligible) return -1000; // exclude
  let s = 0;
  if (p.anchor) s += 50;
  if (p.nearEligible) s += 30;
  s += Math.min(p.words, 150); // up to 150 from existing body
  s += p.paragraphs * 10;
  s += p.qs * 8;
  return s;
}
const candidates = scopedPassages
  .filter((p) => !p.eligible)
  .map((p) => ({ ...p, _score: candidateScore(p) }))
  .sort((a, b) => b._score - a._score)
  .slice(0, 30);

// ── Suggested anchor heuristic for non-anchor passages ──
function suggestAnchor(p) {
  if (p.anchor) {
    // Try to surface which anchor already matched in title or first para
    const text = `${p.title ?? ""} ${p.body.split(/\n{2,}/)[0] ?? ""}`.toLowerCase();
    for (const a of NAMED_ANCHORS) {
      if (text.includes(a.toLowerCase())) return `present: ${a}`;
    }
    return "present (generic)";
  }
  // Heuristic topical suggestions based on keywords in title/body
  const t = `${p.title ?? ""} ${p.body}`.toLowerCase();
  if (t.includes("procrastinat") || t.includes("psychology")) return "Stanford/Harvard study";
  if (t.includes("climat") || t.includes("carbon")) return "Industrial Revolution / Apollo";
  if (t.includes("vacc") || t.includes("disease") || t.includes("medicine")) return "Pasteur / Curie";
  if (t.includes("space") || t.includes("planet")) return "NASA / Sagan / Hubble";
  if (t.includes("art") || t.includes("paint") || t.includes("sculpt")) return "Picasso / Matisse / Renaissance";
  if (t.includes("music") || t.includes("symphony")) return "Beethoven / Mozart";
  if (t.includes("language") || t.includes("literat")) return "Shakespeare / Hemingway";
  if (t.includes("democrac") || t.includes("vote") || t.includes("election")) return "Lincoln / Madison / Constitution";
  if (t.includes("war") || t.includes("conflict") || t.includes("military")) return "Cold War / World War";
  if (t.includes("revolution") || t.includes("industrial")) return "Industrial Revolution";
  if (t.includes("ancient") || t.includes("empire")) return "Roman / Byzantine / Ottoman";
  if (t.includes("evolu") || t.includes("species") || t.includes("biolog")) return "Darwin / Goodall";
  if (t.includes("invent") || t.includes("technolog")) return "Edison / Tesla";
  if (t.includes("right") || t.includes("equal")) return "Mandela / Yousafzai / Suffragette";
  return "—";
}

const lines = [];
lines.push("# Reading-passage eligibility scan (Phase 3 Batch D)");
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push("Thresholds (from `src/lib/reading/passage-validator.ts`):");
lines.push(`- ≥ ${MIN_PARAGRAPHS} paragraphs`);
lines.push(`- ≥ ${MIN_WORDS} words`);
lines.push(`- ≥ ${MIN_QUESTIONS} questions`);
lines.push("");
lines.push("## Aggregate — Batch D scoped files");
lines.push("");
lines.push(`Files: ${SCOPED.map((s) => "`" + s.split("/").pop() + "`").join(", ")}`);
lines.push("");
lines.push(`- Unique passages in scope: **${scopedPassages.length}**`);
lines.push(`- Sim-eligible: **${scopedEligible.length}** (${(scopedEligible.length / scopedPassages.length * 100).toFixed(1)}%)`);
lines.push(`- Near-eligible (fails exactly 1 threshold): **${scopedNear.length}**`);
lines.push("");
lines.push("## Pool-wide eligible count (for context — includes read-only families)");
lines.push("");
lines.push(`- Scoped eligible: ${scopedEligible.length}`);
lines.push(`- Context eligible (\\_gen\\_reading\\_1..8 + \\_sim\\_*): ${contextEligible.length}`);
lines.push(`- **Pool-wide total: ${poolWideEligible}**`);
lines.push("");
lines.push("## Per-file breakdown (scoped)");
lines.push("");
lines.push("| file | unique passages | eligible | near-eligible |");
lines.push("|---|---:|---:|---:|");
for (const file of SCOPED) {
  const subset = scopedPassages.filter((p) => p.file === file);
  if (!subset.length) {
    lines.push(`| \`${basename(file)}\` | 0 | 0 | 0 |`);
    continue;
  }
  const elig = subset.filter((p) => p.eligible).length;
  const near = subset.filter((p) => p.nearEligible).length;
  lines.push(`| \`${basename(file)}\` | ${subset.length} | ${elig} | ${near} |`);
}
lines.push("");
lines.push("## Top 30 growth candidates");
lines.push("");
lines.push("Ranking favours: anchor-already-present + near-eligible + larger base material.");
lines.push("");
lines.push("| # | id | file | words | paragraphs | questions | anchor? | suggested anchor |");
lines.push("|---:|---|---|---:|---:|---:|---|---|");
candidates.forEach((p, i) => {
  lines.push(
    `| ${i + 1} | \`${p.id}\` | \`${basename(p.file)}\` | ${p.words} | ${p.paragraphs} | ${p.qs} | ${p.anchor ? "yes" : "no"} | ${suggestAnchor(p)} |`
  );
});
lines.push("");

const OUT_DIR = resolve(ROOT, "qa-report");
mkdirSync(OUT_DIR, { recursive: true });
const OUT_PATH = resolve(OUT_DIR, "passage-eligibility-scan.md");
writeFileSync(OUT_PATH, lines.join("\n") + "\n");

console.log(`Wrote ${OUT_PATH}`);
console.log(`Scoped passages: ${scopedPassages.length}, eligible: ${scopedEligible.length}, near-eligible: ${scopedNear.length}`);
console.log(`Pool-wide eligible (incl. read-only families): ${poolWideEligible}`);
