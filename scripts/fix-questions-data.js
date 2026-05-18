/**
 * Fix all broken question formats in questions.json:
 *  1. Reading  — flatten nested passage→questions[] to flat Question objects
 *  2. Lecture  — same (uses "transcript" key instead of "passage")
 *  3. WordFormation — add choices[] + convert string answer to index
 *  4. TextCompletion — convert string passage to {id,body,title} + add text field
 *  5. Add missing `category` field to every question
 *
 * Run: node scripts/fix-questions-data.js
 */

const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "../src/data/seed/questions.json");
const HARD_SRC = path.join(__dirname, "../src/data/seed/hard_questions_addon.json");
const data = JSON.parse(fs.readFileSync(SRC, "utf8"));
const hardData = JSON.parse(fs.readFileSync(HARD_SRC, "utf8"));

// ─── helpers ──────────────────────────────────────────────────────────────────

function stablePos(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return Math.abs(h) % 4;
}

// Generate 3 plausible wrong word-forms given baseWord + correct answer
function wfDistractors(baseWord, answer) {
  const cands = new Set();

  // Always try the base word itself
  cands.add(baseWord);

  const a = answer.toLowerCase();

  if (a.endsWith("tion") || a.endsWith("sion")) {
    cands.add(a.replace(/(tion|sion)$/, "tive"));
    cands.add(a.replace(/(tion|sion)$/, "tional"));
    cands.add(baseWord + "ing");
  } else if (a.endsWith("ment")) {
    cands.add(baseWord + "ing");
    cands.add(baseWord + "ed");
    cands.add(baseWord + "able");
  } else if (a.endsWith("ness")) {
    const root = a.replace(/ness$/, "");
    cands.add(root);          // the adjective
    cands.add(root + "ly");
    cands.add(root + "ful");
  } else if (a.endsWith("ity")) {
    cands.add(a.replace(/ity$/, "ious"));
    cands.add(a.replace(/ity$/, "iously"));
    cands.add(baseWord + "ness");
  } else if (a.endsWith("ly")) {
    const root = a.replace(/ly$/, "");
    cands.add(root);
    cands.add(root + "ness");
    cands.add(baseWord + "tion");
  } else if (a.endsWith("ance") || a.endsWith("ence")) {
    cands.add(a.replace(/(ance|ence)$/, "ant"));
    cands.add(a.replace(/(ance|ence)$/, "ent"));
    cands.add(baseWord + "ing");
  } else if (a.endsWith("al")) {
    cands.add(a.replace(/al$/, ""));
    cands.add(a + "ly");
    cands.add(baseWord + "ing");
  } else if (a.endsWith("ing")) {
    cands.add(baseWord);
    cands.add(baseWord + "ed");
    cands.add(baseWord + "ment");
  } else if (a.endsWith("ed")) {
    cands.add(baseWord);
    cands.add(baseWord + "ing");
    cands.add(baseWord + "ment");
  } else {
    // generic fallbacks
    cands.add(baseWord + "ing");
    cands.add(baseWord + "tion");
    cands.add(baseWord + "ness");
  }

  return [...cands]
    .filter((c) => c !== answer && c.length >= 3 && c.length <= answer.length + 8)
    .slice(0, 3);
}

// ─── 1. Flatten Reading ───────────────────────────────────────────────────────
function fixReading(passages) {
  const out = [];
  for (const p of passages) {
    if (!p.questions) continue; // already flat
    const subs = p.questions;
    subs.forEach((sq, qi) => {
      out.push({
        id: `${p.id}-q${qi + 1}`,
        category: "reading",
        difficulty: p.difficulty,
        text: sq.question,
        choices: sq.choices,
        answer: sq.answer,
        explanation: sq.explanation ?? "",
        wrongReasons: sq.wrongReasons ?? [],
        passage: {
          id: `${p.id}-passage`,
          title: p.title,
          body: p.passage, // passage field is a string in the original
        },
      });
    });
  }
  return out;
}

// ─── 2. Flatten Lecture ───────────────────────────────────────────────────────
function fixLecture(lectures) {
  const out = [];
  for (const l of lectures) {
    if (!l.questions) continue;
    const subs = l.questions;
    subs.forEach((sq, qi) => {
      out.push({
        id: `${l.id}-q${qi + 1}`,
        category: "lectureQuestions",
        difficulty: l.difficulty,
        text: sq.question,
        choices: sq.choices,
        answer: sq.answer,
        explanation: sq.explanation ?? "",
        wrongReasons: sq.wrongReasons ?? [],
        passage: {
          id: `${l.id}-passage`,
          title: `Lecture: ${l.title ?? ""}`.trim(),
          body: l.transcript ?? "",
        },
      });
    });
  }
  return out;
}

// ─── 3. Fix Word Formation ───────────────────────────────────────────────────
function fixWordFormation(items) {
  return items.map((q) => {
    // Already has choices → just add category
    if (Array.isArray(q.choices) && typeof q.answer === "number") {
      return { ...q, category: "wordFormation" };
    }

    const answer = String(q.answer);
    const base = q.baseWord ?? answer;
    let distractors = wfDistractors(base, answer);

    // Pad with generic forms if not enough
    const fallbacks = [base + "s", base + "er", base + "ful", base + "less", answer + "s"];
    for (const f of fallbacks) {
      if (distractors.length >= 3) break;
      if (f !== answer && !distractors.includes(f)) distractors.push(f);
    }
    distractors = distractors.slice(0, 3);

    const pos = stablePos(q.id);
    const choices = [...distractors];
    choices.splice(pos, 0, answer);

    return {
      id: q.id,
      category: "wordFormation",
      difficulty: q.difficulty,
      text: q.text,
      choices,
      answer: pos,
      explanation: q.explanation ?? "",
      wrongReasons: q.wrongReasons ?? [],
    };
  });
}

// ─── 4. Fix Text Completion ───────────────────────────────────────────────────
function fixTextCompletion(items) {
  return items.map((q) => {
    // Already structured correctly
    if (typeof q.text === "string" && q.text.length > 0 && typeof q.passage === "object" && !Array.isArray(q.passage)) {
      return { ...q, category: "textCompletion" };
    }
    return {
      id: q.id,
      category: "textCompletion",
      difficulty: q.difficulty,
      text: "Choose the word that best completes the passage:",
      choices: q.choices,
      answer: q.answer,
      explanation: q.explanation ?? "",
      wrongReasons: q.wrongReasons ?? [],
      passage: {
        id: `${q.id}-passage`,
        title: q.title,
        body: typeof q.passage === "string" ? q.passage : (q.passage?.body ?? ""),
      },
    };
  });
}

// ─── 5. Fix flat categories (sentenceCompletion, paraphrasing, grammar) ──────
function addCategory(items, category) {
  return items.map((q) => ({ ...q, category: q.category ?? category }));
}

// ─── Apply all fixes ──────────────────────────────────────────────────────────
const fixed = {
  sentenceCompletion: addCategory(data.sentenceCompletion ?? [], "sentenceCompletion"),
  paraphrasing:       addCategory(data.paraphrasing ?? [], "restatements"),
  grammar:            addCategory(data.grammar ?? [], "grammar"),
  wordFormation:      fixWordFormation(data.wordFormation ?? []),
  reading:            fixReading(data.reading ?? []),
  lectureQuestions:   fixLecture(data.lectureQuestions ?? []),
  textCompletion:     fixTextCompletion(data.textCompletion ?? []),
};

const fixedHard = {
  sentenceCompletion: addCategory(hardData.sentenceCompletion ?? [], "sentenceCompletion"),
  paraphrasing:       addCategory(hardData.paraphrasing ?? [], "restatements"),
  grammar:            addCategory(hardData.grammar ?? [], "grammar"),
  wordFormation:      fixWordFormation(hardData.wordFormation ?? []),
  reading:            fixReading(hardData.reading ?? []),
  lectureQuestions:   fixLecture(hardData.lectureQuestions ?? []),
  textCompletion:     fixTextCompletion(hardData.textCompletion ?? []),
};

// Report
console.log("--- questions.json ---");
Object.entries(fixed).forEach(([k, v]) => console.log(`  ${k}: ${v.length}`));
console.log("--- hard_questions_addon.json ---");
Object.entries(fixedHard).forEach(([k, v]) => { if (v.length) console.log(`  ${k}: ${v.length}`); });

// Validate both
let issues = 0;
for (const [src, obj] of [["main", fixed], ["hard", fixedHard]]) {
  for (const [key, arr] of Object.entries(obj)) {
    for (const q of arr) {
      if (!q.text)            { console.error(`MISSING text: ${src}/${key}/${q.id}`); issues++; }
      if (!q.choices?.length) { console.error(`MISSING choices: ${src}/${key}/${q.id}`); issues++; }
      if (typeof q.answer !== "number") { console.error(`BAD answer: ${src}/${key}/${q.id}`); issues++; }
    }
  }
}
if (issues === 0) console.log("\n✓ All questions valid");
else console.error(`\n✗ ${issues} validation errors`);

fs.writeFileSync(SRC, JSON.stringify(fixed, null, 2));
fs.writeFileSync(HARD_SRC, JSON.stringify(fixedHard, null, 2));
console.log("Saved both files.");
