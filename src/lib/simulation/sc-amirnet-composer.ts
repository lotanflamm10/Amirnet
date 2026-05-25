import type { Question } from "@/types/questions";
import { hashSentence } from "@/lib/practice/question-history";

/**
 * Pure, side-effect-free composer for the Sentence Completion sections
 * inside an AMIRNET simulation.
 *
 * Why this exists: the historical adaptive-selector.ts branches by
 * previousAccuracy and ends up filling sections with whatever happens to
 * be in the pool after shuffling. The audit (DIFFICULTY_AUDIT §B.1/§C.1)
 * confirmed the SC bank already contains AMIRNET-tier hard items — they
 * just rarely surface in a real run because the selector has no fixed
 * composition policy and no preference for named-subject stems.
 *
 * This module enforces a FIXED difficulty composition per SC section and
 * prefers items whose stem mentions a named historical subject. Anything
 * else (adaptive-by-accuracy, score weighting, dedup rules) stays in the
 * caller (adaptive-selector.ts).
 */

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
] as const;

const NAMED_ANCHOR_HAYSTACK = NAMED_ANCHORS.map((a) => a.toLowerCase());

/**
 * Common articles / pronouns / conjunctions that happen to be
 * capitalised when they open a sentence. They should never count as
 * proper-noun joiners even when they appear inside a run of capitalised
 * tokens (e.g. "Roman And Greek" → not "And" as part of the anchor).
 */
const COMMON_NOUN_JOINERS = new Set([
  "The", "A", "An", "And", "Or", "But", "Of", "In", "On", "At",
  "By", "For", "To", "With", "From", "As", "If", "When", "While",
  "Although", "Because", "Since", "Until", "Unless", "Despite", "However",
  "Yet", "So", "Then", "Now", "Here", "There", "This", "That", "These", "Those",
  "His", "Her", "Their", "Its", "Our", "Your", "My",
  "Many", "Some", "Most", "Few", "All", "Several", "Other", "Another", "Such",
]);

const CAPITAL_TOKEN_RE = /^[A-Z][A-Za-z'’\-]*$/;

/**
 * True iff a stem contains a named historical subject. Two recognisers
 * are combined: an allowlist substring match and a generic
 * 2+-consecutive-capitalised-tokens scan that skips sentence-initial
 * positions and common joiners.
 */
export function hasNamedAnchor(stem: string): boolean {
  if (!stem) return false;
  const lower = stem.toLowerCase();

  // 1) Allowlist substring match. Case-insensitive; handles multi-word
  //    entries like "Magna Carta" and "Industrial Revolution".
  for (const anchor of NAMED_ANCHOR_HAYSTACK) {
    if (lower.includes(anchor)) {
      // Require a word boundary on at least one side so "Roman" doesn't
      // match "romance". This is cheap and good enough for our stems.
      const idx = lower.indexOf(anchor);
      const before = idx === 0 ? " " : lower[idx - 1];
      const after = idx + anchor.length >= lower.length
        ? " "
        : lower[idx + anchor.length];
      if (!/[a-z]/i.test(before) && !/[a-z]/i.test(after)) return true;
    }
  }

  // 2) Generic scan: 2+ consecutive capitalised tokens that are NOT at
  //    sentence start (token index 0) and NOT common joiners. Splitting
  //    on whitespace + leading punctuation handles most real stems.
  const tokens = stem.split(/[\s]+/).filter(Boolean);
  let runLength = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].replace(/^[(\[{"'“‘]+|[)\]}.,;:!?"'”’]+$/g, "");
    const isCap = CAPITAL_TOKEN_RE.test(t);
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

export interface ScCompositionResult {
  selected: Question[];
  composition: { hard: number; medium: number; easy: number };
  /** Items that scored top of the pool but were skipped because the
   *  composition was already full — useful for the audit. */
  alternates: Question[];
  /** Per-bucket fallback fired (e.g. not enough hard items). */
  fallbacks: { hard: boolean; medium: boolean; easy: boolean };
}

type Difficulty = "easy" | "medium" | "hard";

/** Spec-stated AMIRNET composition table — indexed by section size. */
function targetComposition(
  questionCount: number,
): { hard: number; medium: number; easy: number } {
  switch (questionCount) {
    case 3: return { hard: 1, medium: 2, easy: 0 };
    case 4: return { hard: 1, medium: 2, easy: 1 };
    case 5: return { hard: 1, medium: 3, easy: 1 };
    default: {
      // Generic fallback for off-spec counts: 25% hard / 50% medium / 25% easy,
      // rounded with hard taking priority on the leftover.
      const hard = Math.max(1, Math.round(questionCount * 0.25));
      const easy = Math.max(0, Math.floor(questionCount * 0.25));
      const medium = Math.max(0, questionCount - hard - easy);
      return { hard, medium, easy };
    }
  }
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sort by named-anchor preference: items whose stem mentions a named
 * historical subject come first, then non-anchored items. Within each
 * sub-group the order is randomised so back-to-back runs don't repeat
 * the same item every time.
 */
function sortByAnchorPreference(items: Question[]): Question[] {
  const anchored: Question[] = [];
  const generic: Question[] = [];
  for (const q of items) {
    if (hasNamedAnchor(q.text)) anchored.push(q);
    else generic.push(q);
  }
  return [...shuffle(anchored), ...shuffle(generic)];
}

interface DedupSets {
  usedIds: Set<string>;
  usedHashes: Set<string>;
}

function tryTake(
  ordered: Question[],
  dedup: DedupSets,
  n: number,
): { picked: Question[]; remaining: Question[] } {
  const picked: Question[] = [];
  const remaining: Question[] = [];
  for (const q of ordered) {
    if (picked.length >= n) {
      remaining.push(q);
      continue;
    }
    if (dedup.usedIds.has(q.id)) continue;
    const h = hashSentence(q.text);
    if (dedup.usedHashes.has(h)) continue;
    dedup.usedIds.add(q.id);
    dedup.usedHashes.add(h);
    picked.push(q);
  }
  return { picked, remaining };
}

export function composeAmirnetScSection(
  pool: Question[],
  questionCount: number,
  excludeIds: Set<string>,
  excludeHashes: Set<string>,
): ScCompositionResult {
  const target = targetComposition(questionCount);
  const dedup: DedupSets = {
    usedIds: new Set(excludeIds),
    usedHashes: new Set(excludeHashes),
  };

  // Snapshot the pre-exclude pool so a section that prefers a tagged
  // difficulty can still find candidates even when one bucket is small.
  const eligiblePool = pool.filter((q) => {
    if (dedup.usedIds.has(q.id)) return false;
    if (dedup.usedHashes.has(hashSentence(q.text))) return false;
    return q.category === "sentenceCompletion"
      || q.category === undefined; // tolerate seed inconsistency
  });

  const byDifficulty: Record<Difficulty, Question[]> = {
    hard:   eligiblePool.filter((q) => q.difficulty === "hard"),
    medium: eligiblePool.filter((q) => q.difficulty === "medium"),
    easy:   eligiblePool.filter((q) => q.difficulty === "easy"),
  };

  const fallbacks = { hard: false, medium: false, easy: false };
  const selected: Question[] = [];
  const alternateBuckets: Question[] = [];

  // Pass 1 — bucket-by-bucket primary fill. HARD first so its scarcity
  // gets first pick of unspent slots and we maximise the chance of a
  // hard-tier item making it into every section.
  const tierOrder: Difficulty[] = ["hard", "medium", "easy"];
  const shortfalls: Record<Difficulty, number> = { hard: 0, medium: 0, easy: 0 };
  for (const tier of tierOrder) {
    const need = target[tier];
    if (need <= 0) continue;
    const ordered = sortByAnchorPreference(byDifficulty[tier]);
    const { picked, remaining } = tryTake(ordered, dedup, need);
    selected.push(...picked);
    alternateBuckets.push(...remaining.slice(0, 3));
    if (picked.length < need) {
      fallbacks[tier] = true;
      shortfalls[tier] = need - picked.length;
    }
  }

  // Pass 2 — borrow to cover any shortfall, in the spec's escalation
  // order. Each donor bucket is consulted in turn; tryTake auto-skips
  // anything already picked or hashed in Pass 1.
  for (const tier of tierOrder) {
    if (shortfalls[tier] <= 0) continue;
    const donors = borrowOrder(tier);
    let stillNeeded = shortfalls[tier];
    for (const donor of donors) {
      if (stillNeeded <= 0) break;
      const donorOrdered = sortByAnchorPreference(byDifficulty[donor]);
      const { picked } = tryTake(donorOrdered, dedup, stillNeeded);
      if (picked.length > 0 && process.env.NODE_ENV !== "production") {
        console.warn(
          `[sc-amirnet-composer] fallback: ${tier} bucket short by ${shortfalls[tier]}, borrowed ${picked.length} from ${donor}`,
        );
      }
      selected.push(...picked);
      stillNeeded -= picked.length;
    }
  }

  return {
    selected: selected.slice(0, questionCount),
    composition: countComposition(selected.slice(0, questionCount)),
    alternates: alternateBuckets,
    fallbacks,
  };
}

function borrowOrder(tier: Difficulty): Difficulty[] {
  switch (tier) {
    case "hard":   return ["medium", "easy"];
    case "medium": return ["hard", "easy"];
    case "easy":   return ["medium", "hard"];
  }
}

function countComposition(items: Question[]): { hard: number; medium: number; easy: number } {
  let hard = 0, medium = 0, easy = 0;
  for (const q of items) {
    if (q.difficulty === "hard") hard++;
    else if (q.difficulty === "medium") medium++;
    else if (q.difficulty === "easy") easy++;
  }
  return { hard, medium, easy };
}
