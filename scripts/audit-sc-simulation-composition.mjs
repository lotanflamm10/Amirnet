/**
 * SC Simulation Composition Audit
 *
 * Simulates fresh AMIRNET-mode runs and reports what the SC composer
 * produces for sections s1, s2, s6 — both per-run detail and the
 * aggregate hit rates the new composer is supposed to achieve.
 *
 * NOTE — DELIBERATE DUPLICATION
 * This script shadows src/lib/simulation/sc-amirnet-composer.ts and
 * src/lib/practice/question-history.ts (hashSentence). It does NOT
 * import them — both are TS modules with `@/` path aliases, and the
 * audit must run under plain Node with zero new dependencies. Keep the
 * two implementations in sync: if you change the composition rule or
 * the named-anchor list, mirror it here.
 *
 * Run with: npm run audit:sc-amirnet
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ─── Load seed files exactly as SimulationRunner.tsx does ─────────────
// Keep this list in sync with buildQuestionsPool() in
// src/components/simulation/SimulationRunner.tsx.
const SEED_FILES = [
  "src/data/seed/questions.json",
  "src/data/seed/hard_questions_addon.json",
  "src/data/seed/_gen_para_complex.json",
  "src/data/seed/questions_expanded.json",
  "src/data/seed/_gen_sc_a.json",
  "src/data/seed/_gen_sc_b.json",
];

function loadJson(rel) {
  return JSON.parse(readFileSync(resolve(root, rel), "utf-8"));
}

function buildPool() {
  const base = loadJson(SEED_FILES[0]);
  const merged = { ...base };
  for (let i = 1; i < SEED_FILES.length; i++) {
    const src = loadJson(SEED_FILES[i]);
    for (const [k, v] of Object.entries(src)) {
      const existing = new Set((merged[k] ?? []).map((q) => q.id));
      merged[k] = [...(merged[k] ?? []), ...v.filter((q) => !existing.has(q.id))];
    }
  }
  return merged;
}

// ─── Shadow of hashSentence (src/lib/practice/question-history.ts) ────
function hashSentence(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 10)
    .join(" ");
}

// ─── Shadow of named-anchor detection (sc-amirnet-composer.ts) ────────
const NAMED_ANCHORS = [
  "Korematsu", "Hubble", "Wright", "Roosevelt", "Einstein",
  "Madison", "Curie", "Galileo", "Renaissance", "Roman", "Greek",
  "Babylonian", "Eiffel", "Alexander", "Caesar", "Lincoln",
  "Washington", "Constitution", "Magna Carta", "Newton", "Darwin",
  "Mandela", "Gandhi", "Tesla", "Edison", "Goodall", "Sagan",
  "Yousafzai", "Victoria", "Cleopatra", "Tolkien", "Hemingway",
  "Shakespeare", "Beethoven", "Mozart", "Matisse", "Picasso",
  "Hughes", "Korean", "Harlem", "Babylon", "Bauhaus",
  "Industrial Revolution", "Cold War", "Cuban", "World War",
  "Apollo", "NASA", "Stonewall", "Suffragette", "Reformation",
  "Enlightenment", "Crusades", "Byzantine", "Ottoman", "Mongol",
  "Inca", "Aztec", "Mayan",
];
const ANCHOR_LOWER = NAMED_ANCHORS.map((a) => a.toLowerCase());
const COMMON_NOUN_JOINERS = new Set([
  "The", "A", "An", "And", "Or", "But", "Of", "In", "On", "At",
  "By", "For", "To", "With", "From", "As", "If", "When", "While",
  "Although", "Because", "Since", "Until", "Unless", "Despite", "However",
  "Yet", "So", "Then", "Now", "Here", "There", "This", "That", "These", "Those",
  "His", "Her", "Their", "Its", "Our", "Your", "My",
  "Many", "Some", "Most", "Few", "All", "Several", "Other", "Another", "Such",
]);
const CAP_RE = /^[A-Z][A-Za-z'’\-]*$/;

function hasNamedAnchor(stem) {
  if (!stem) return false;
  const lower = stem.toLowerCase();
  for (const anchor of ANCHOR_LOWER) {
    const idx = lower.indexOf(anchor);
    if (idx === -1) continue;
    const before = idx === 0 ? " " : lower[idx - 1];
    const after = idx + anchor.length >= lower.length ? " " : lower[idx + anchor.length];
    if (!/[a-z]/i.test(before) && !/[a-z]/i.test(after)) return true;
  }
  const tokens = stem.split(/[\s]+/).filter(Boolean);
  let runLength = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].replace(/^[(\[{"'“‘]+|[)\]}.,;:!?"'”’]+$/g, "");
    const isCap = CAP_RE.test(t);
    const isFirst = i === 0;
    const isJoiner = COMMON_NOUN_JOINERS.has(t);
    if (isCap && !isFirst && !isJoiner) {
      runLength++;
      if (runLength >= 2) return true;
    } else {
      runLength = 0;
    }
  }
  return false;
}

// ─── Shadow of composeAmirnetScSection ────────────────────────────────
function targetComposition(qc) {
  switch (qc) {
    case 3: return { hard: 1, medium: 2, easy: 0 };
    case 4: return { hard: 1, medium: 2, easy: 1 };
    case 5: return { hard: 1, medium: 3, easy: 1 };
    default: {
      const hard = Math.max(1, Math.round(qc * 0.25));
      const easy = Math.max(0, Math.floor(qc * 0.25));
      const medium = Math.max(0, qc - hard - easy);
      return { hard, medium, easy };
    }
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sortByAnchorPreference(items) {
  const anchored = [], generic = [];
  for (const q of items) {
    if (hasNamedAnchor(q.text)) anchored.push(q);
    else generic.push(q);
  }
  return [...shuffle(anchored), ...shuffle(generic)];
}

function tryTake(ordered, dedup, n) {
  const picked = [], remaining = [];
  for (const q of ordered) {
    if (picked.length >= n) { remaining.push(q); continue; }
    if (dedup.usedIds.has(q.id)) continue;
    const h = hashSentence(q.text);
    if (dedup.usedHashes.has(h)) continue;
    dedup.usedIds.add(q.id);
    dedup.usedHashes.add(h);
    picked.push(q);
  }
  return { picked, remaining };
}

function borrowOrder(tier) {
  switch (tier) {
    case "hard":   return ["medium", "easy"];
    case "medium": return ["hard", "easy"];
    case "easy":   return ["medium", "hard"];
  }
}

function composeAmirnetScSection(pool, questionCount, excludeIds, excludeHashes) {
  const target = targetComposition(questionCount);
  const dedup = {
    usedIds: new Set(excludeIds),
    usedHashes: new Set(excludeHashes),
  };
  const eligible = pool.filter((q) => {
    if (dedup.usedIds.has(q.id)) return false;
    if (dedup.usedHashes.has(hashSentence(q.text))) return false;
    return q.category === "sentenceCompletion" || q.category === undefined;
  });
  const byDiff = {
    hard:   eligible.filter((q) => q.difficulty === "hard"),
    medium: eligible.filter((q) => q.difficulty === "medium"),
    easy:   eligible.filter((q) => q.difficulty === "easy"),
  };
  const fallbacks = { hard: false, medium: false, easy: false };
  const selected = [];
  const shortfalls = { hard: 0, medium: 0, easy: 0 };
  for (const tier of ["hard", "medium", "easy"]) {
    const need = target[tier];
    if (need <= 0) continue;
    const ordered = sortByAnchorPreference(byDiff[tier]);
    const { picked } = tryTake(ordered, dedup, need);
    selected.push(...picked);
    if (picked.length < need) {
      fallbacks[tier] = true;
      shortfalls[tier] = need - picked.length;
    }
  }
  for (const tier of ["hard", "medium", "easy"]) {
    if (shortfalls[tier] <= 0) continue;
    let stillNeeded = shortfalls[tier];
    for (const donor of borrowOrder(tier)) {
      if (stillNeeded <= 0) break;
      const ordered = sortByAnchorPreference(byDiff[donor]);
      const { picked } = tryTake(ordered, dedup, stillNeeded);
      selected.push(...picked);
      stillNeeded -= picked.length;
    }
  }
  return {
    selected: selected.slice(0, questionCount),
    fallbacks,
  };
}

function countComposition(items) {
  let h = 0, m = 0, e = 0;
  for (const q of items) {
    if (q.difficulty === "hard") h++;
    else if (q.difficulty === "medium") m++;
    else if (q.difficulty === "easy") e++;
  }
  return { hard: h, medium: m, easy: e };
}

// ─── Simulate 50 runs over s1, s2, s6 ─────────────────────────────────
const SIM_RUNS = 50;
const SC_SECTIONS = [
  { id: "s1", questionCount: 4 },
  { id: "s2", questionCount: 4 },
  { id: "s6", questionCount: 4 },
];

const pool = (buildPool().sentenceCompletion ?? []).filter((q) => q && q.text);

const runs = [];
const aggregate = {
  totalSections: 0,
  compositionHits: 0,
  hardSlots: { total: 0, anchored: 0 },
  mediumSlots: { total: 0, anchored: 0 },
  easySlots: { total: 0, anchored: 0 },
  fallbacks: { hard: 0, medium: 0, easy: 0 },
};
for (let r = 0; r < SIM_RUNS; r++) {
  const excludeIds = new Set();
  const excludeHashes = new Set();
  const runSections = [];
  for (const section of SC_SECTIONS) {
    const { selected, fallbacks } = composeAmirnetScSection(
      pool, section.questionCount, excludeIds, excludeHashes,
    );
    for (const q of selected) {
      excludeIds.add(q.id);
      excludeHashes.add(hashSentence(q.text));
    }
    const composition = countComposition(selected);
    const target = targetComposition(section.questionCount);
    const isHit =
      composition.hard === target.hard &&
      composition.medium === target.medium &&
      composition.easy === target.easy;
    aggregate.totalSections++;
    if (isHit) aggregate.compositionHits++;
    if (fallbacks.hard) aggregate.fallbacks.hard++;
    if (fallbacks.medium) aggregate.fallbacks.medium++;
    if (fallbacks.easy) aggregate.fallbacks.easy++;
    for (const q of selected) {
      const anchored = hasNamedAnchor(q.text);
      const bucket = q.difficulty === "hard" ? aggregate.hardSlots
        : q.difficulty === "medium" ? aggregate.mediumSlots
        : aggregate.easySlots;
      bucket.total++;
      if (anchored) bucket.anchored++;
    }
    runSections.push({ section: section.id, selected, composition, fallbacks, isHit });
  }
  runs.push({ run: r + 1, sections: runSections });
}

// ─── Render qa-report/sc-amirnet-composition.md ───────────────────────
function pct(num, den) { return den === 0 ? "—" : ((100 * num) / den).toFixed(1) + "%"; }

const lines = [];
lines.push("# SC Simulation Composition Audit");
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push(`Runs: ${SIM_RUNS} · Sections audited: ${aggregate.totalSections} (s1/s2/s6, 4 questions each)`);
lines.push(`SC pool size (post-build): ${pool.length} items`);
lines.push("");
lines.push("## Aggregate");
lines.push("");
lines.push("| Metric | Value |");
lines.push("|---|---|");
lines.push(`| Composition hits (1H + 2M + 1E) | ${pct(aggregate.compositionHits, aggregate.totalSections)} (${aggregate.compositionHits}/${aggregate.totalSections}) |`);
lines.push(`| Hard slots — named-anchor rate | ${pct(aggregate.hardSlots.anchored, aggregate.hardSlots.total)} (${aggregate.hardSlots.anchored}/${aggregate.hardSlots.total}) |`);
lines.push(`| Medium slots — named-anchor rate | ${pct(aggregate.mediumSlots.anchored, aggregate.mediumSlots.total)} (${aggregate.mediumSlots.anchored}/${aggregate.mediumSlots.total}) |`);
lines.push(`| Easy slots — named-anchor rate | ${pct(aggregate.easySlots.anchored, aggregate.easySlots.total)} (${aggregate.easySlots.anchored}/${aggregate.easySlots.total}) |`);
const totalAnchored = aggregate.hardSlots.anchored + aggregate.mediumSlots.anchored + aggregate.easySlots.anchored;
const totalSlots = aggregate.hardSlots.total + aggregate.mediumSlots.total + aggregate.easySlots.total;
lines.push(`| Overall named-anchor rate | ${pct(totalAnchored, totalSlots)} (${totalAnchored}/${totalSlots}) |`);
lines.push(`| Hard-bucket fallback rate | ${pct(aggregate.fallbacks.hard, aggregate.totalSections)} (${aggregate.fallbacks.hard}/${aggregate.totalSections}) |`);
lines.push(`| Medium-bucket fallback rate | ${pct(aggregate.fallbacks.medium, aggregate.totalSections)} (${aggregate.fallbacks.medium}/${aggregate.totalSections}) |`);
lines.push(`| Easy-bucket fallback rate | ${pct(aggregate.fallbacks.easy, aggregate.totalSections)} (${aggregate.fallbacks.easy}/${aggregate.totalSections}) |`);
lines.push("");

lines.push("## Per-run detail");
lines.push("");
for (const run of runs) {
  lines.push(`### Run ${run.run}`);
  lines.push("");
  lines.push("| Section | Hit | Items |");
  lines.push("|---|---|---|");
  for (const sec of run.sections) {
    const itemsCol = sec.selected.map((q) => {
      const anchored = hasNamedAnchor(q.text) ? " ⚑" : "";
      return `${q.id} · ${q.difficulty}${anchored}`;
    }).join(" · ");
    const hit = sec.isHit ? "✓" : "✗";
    const fb = [
      sec.fallbacks.hard ? "H↓" : null,
      sec.fallbacks.medium ? "M↓" : null,
      sec.fallbacks.easy ? "E↓" : null,
    ].filter(Boolean).join(" ");
    lines.push(`| ${sec.section} | ${hit}${fb ? " " + fb : ""} | ${itemsCol} |`);
  }
  lines.push("");
}

const outDir = resolve(root, "qa-report");
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "sc-amirnet-composition.md");
writeFileSync(outPath, lines.join("\n"), "utf-8");

console.log(`Audit written to ${outPath}`);
console.log(`Composition hits: ${aggregate.compositionHits}/${aggregate.totalSections} (${pct(aggregate.compositionHits, aggregate.totalSections)})`);
console.log(`Named-anchor (hard / overall): ${pct(aggregate.hardSlots.anchored, aggregate.hardSlots.total)} / ${pct(totalAnchored, totalSlots)}`);
console.log(`Fallback rates — hard: ${pct(aggregate.fallbacks.hard, aggregate.totalSections)}, medium: ${pct(aggregate.fallbacks.medium, aggregate.totalSections)}, easy: ${pct(aggregate.fallbacks.easy, aggregate.totalSections)}`);
