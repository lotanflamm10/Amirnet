# Amirnet Coach — Difficulty Calibration Audit (Phase 1A)

> **Headline length-bias number:** across 4,162 sampled multiple-choice
> items, **32.3%** have the correct answer as the *strict single
> longest* option. Per mode, the bias is **bimodal**: restatement-style
> modes are severely skewed (restatements 84.0%, restatementMini 78.0%,
> reading 66.6%, lecture 46.7%), while modes whose options are
> single-word vocabulary (SC, WF, TC, AR, SR) show essentially no bias
> because all options tie at one word. **Length-bias headline rises to
> ~75% if we restrict to restatement-family items.**

Date: 2026-05-22 / 2026-05-23 (audit spanned two days)
Scope: READ-ONLY; only this file may be created.
Source data: programmatic scan + sampling of all `src/data/seed/*.json`
files, plus inspection of `src/lib/practice/`, `src/lib/simulation/`,
`src/lib/reading/`, `src/lib/vocab/`, `simulation-config.json`, and
the `scripts/` pipeline.

---

## A. Current state

### A.1 File inventory

| File | Questions | Easy | Medium | Hard | Categories present |
|---|---|---|---|---|---|
| `questions.json` | 105 | 33 | 38 | 34 | sc 12, restatements 12, grammar 12, wf 12, reading 20, lecture 24, tc 10, writing 3 |
| `questions_expanded.json` | 1,208 | 343 | 490 | 375 | sc 212, restatements 202, paraphrasing 12, grammar 114, wf 114, reading 214, lecture 120, tc 120, writing 100 |
| `hard_questions_addon.json` | 32 | 0 | 0 | 32 | sc 8, restatements 6, grammar 6, wf 6, reading 6 |
| `skill_booster_questions.json` | 1,644 | 268 | 847 | 529 | vocInContext, synRecog, antRecog, connector, restatementMini, sentenceLogic, distractorTrap, academicPhrase (≈205 each) |
| `diagnostic-questions.json` | 15 | 5 | 5 | 5 | sc 3, restatements 3, grammar 3, wf 3, vocabulary 3 |
| `_gen_grammar.json` | 70 | 17 | 28 | 25 | grammar 70 |
| `_gen_wf.json` | 70 | 17 | 28 | 25 | wf 70 |
| `_gen_sc_a.json` / `_b.json` | 200 | 50 | 80 | 70 | sc 200 |
| `_gen_para_a.json` / `_b.json` | 202 | 50 | 80 | 72 | restatements 202 |
| `_gen_tc.json` / `_2.json` / `_3.json` | 110 | 27 | 48 | 35 | textCompletion 110 |
| `_gen_lecture_1/2/part1.json` | 128 | 32 | 64 | 32 | lectureQuestions 128 |
| `_gen_reading_*` (8 base files) | 200 | 80 | 80 | 40 | reading 200 (5 q/passage) |
| `_gen_reading_a_part1.json` | 35 | 14 | 14 | 7 | reading 35 |
| `_gen_reading_b_part1.json` / `_b_part2.json` | 60 | 24 | 24 | 12 | reading 60 |
| `_gen_reading_sim_a..f.json` | 150 | 30 | 90 | 30 | reading 150 (3-paragraph passages) |
| `_gen_writing.json` | 97 | 24 | 39 | 34 | writingTask 97 |
| `simulation-config.json` | — | — | — | — | config: 6 standard sections + 5 pilot types |
| `exam-info.json` / `exam-strategies.json` | — | — | — | — | reference content, not questions |
| `vocab.normalized.json` | 2,674 entries | — | — | — | seed vocabulary |
| `vocab.json` | 28 questions | 5 | 8 | 15 | vocabulary mini-set |
| `hard_vocab_addon.json` | 8 questions | 0 | 0 | 8 | hard vocab addon |

**Totals across the corpus** (includes some intentional duplicates
across base + expanded files):

| Category | Count |
|---|---|
| reading | 685 |
| sentenceCompletion | 435 |
| restatements (+ paraphrasing alias 12) | 437 |
| lectureQuestions | 272 |
| textCompletion | 240 |
| writingTask | 200 |
| grammar | 205 |
| wordFormation | 205 |
| skill booster (8 types × ~205) | 1,644 |
| diagnostic vocab | 3 |
| **TOTAL** | **4,362** |

Overall difficulty distribution: **easy 1,019 · medium 1,963 · hard 1,380 · unset 0**.

### A.2 Routes / reachability (from `src/app/` + `PracticeSession.tsx`)

| Mode key | Route | Component | UI difficulty selector |
|---|---|---|---|
| sentenceCompletion | `/practice/sentenceCompletion?difficulty=...` | `StandardPracticeSession` | Yes (adaptive/easy/medium/hard chips on `/practice`) |
| restatements | `/practice/restatements?difficulty=...` | Same | Yes |
| reading | `/practice/reading?difficulty=...` | `ReadingPassageSession` (selects whole passage via `selectReadingPassage()`) | Yes |
| grammar / wordFormation / textCompletion / lectureQuestions | `/practice/{mode}?difficulty=...` | Same | Yes |
| writingTask | `/practice/writingTask?difficulty=...` | `WritingTaskCard` (1 question) | Yes |
| mixed / smartReview | `/practice/mixed` / `/smartReview` | Same; smartReview is aliased to mixed in `practice-engine.ts:23` | Yes |
| 8× skill booster (vocabularyInContext, synonymRecognition, antonymRecognition, connectorPractice, restatementMini, sentenceLogic, distractorTrap, academicPhrase) | `/practice/{mode}?difficulty=...` | Same | Yes |
| simulation | `/simulation` | `SimulationRunner` (mode = standard/withPilot/withWriting/quick/pilotOnly) | **No** — per-section adaptive only |
| challenge | `/challenge` | `ChallengeSession` (excludes mixed + smartReview) | **No** |
| diagnostic | `/diagnostic` | `DiagnosticTest` (15 mixed) | **No** |
| vocab | `/vocab/swipe`, `/missed`, `/starred`, `/weak`, `/list` | `VocabSwipeTrainer` etc. | Yes — chips הכל/קל/בינוני/קשה in `VocabFilters.tsx` filter by `difficulty` field on vocab items |

All 18 declared `SessionMode` values have a route. No mode is orphaned.

### A.3 Simulation structure (current, official)

From `simulation-config.json`:

| # | id | type | questions | time (s) | pilot? |
|---|---|---|---|---|---|
| 1 | s1 | sentenceCompletion | 4 | 240 | no |
| 2 | s2 | sentenceCompletion | 4 | 240 | no |
| 3 | s3 | reading | 5 | 900 | no |
| 4 | s4 | restatements | 3 | 360 | no |
| 5 | s5 | restatements | 3 | 360 | no |
| 6 | s6 | sentenceCompletion | 4 | 240 | no |

Pilot types (only in `withPilot` mode):

| id | type | questions | time | bonus |
|---|---|---|---|---|
| pilotA | lectureQuestions | 5 | 420 | +2 if ≥75%, +1 if ≥50% |
| pilotB | textCompletion | 4 | 240 | same |
| pilotC | wordFormation | 4 | 180 | same |
| pilotD | grammar | 4 | 240 | same |
| pilotE | writingTask | 1 | 720 | same |

Adaptive selector (`src/lib/simulation/adaptive-selector.ts`): per-section difficulty preference based on **that section's** prior accuracy (>75% → hard, <40% → easy, else medium). No cross-section retargeting. Reading section always returns one passage of exactly 5 questions via `selectReadingPassage(..., { mode: "simulation" })`.

Score weighting (`score-estimator.ts`): reading ×3, restatements ×2, sentenceCompletion ×1.5, others ×1. Pilot excluded from main score. Pilot bonus uses thresholds above; max 2 bonus points; main+bonus capped at 150.

### A.4 Reading passage corpus (unique passage IDs, deduped)

- **Unique passages:** 257
- **Total reading questions with embedded passage:** 1,202
- **Average words:** 140 (target reference: ~340)
- **Average paragraphs:** 1.3 (target reference: 5)
- **Passages < 250 words:** 228 (88.7%)
- **Single-paragraph passages:** 212 (82.5%)
- **Word histogram:** `<150: 159 | 150–249: 69 | 250–349: 29 | 350+: 0`
- **Paragraph histogram:** `1: 212 | 2: 5 | 3: 37 | 4: 3`

**Sim-eligibility against `passage-validator.ts` thresholds** (≥3 paragraphs **AND** ≥180 words **AND** ≥5 questions): roughly **only the 40 passages with ≥3 paragraphs** — almost entirely from the `_gen_reading_sim_*.json` family (avg ~280 words, 3 paragraphs, 5 questions each). The base `_gen_reading_1..8.json`, `_gen_reading_a_part1.json`, `_gen_reading_b_part*.json`, and `questions.json` reading passages are **practice-only** under the existing validator.

---

## B. Mode-by-mode quality observations

Scoring scale (vs. real hard Amirnet reference):
1 = far too easy · 2 = easy / below target · 3 = on-target medium ·
4 = upper-mid / hard target · 5 = harder than real exam.

### B.1 Sentence Completion (18 samples; 435 total)

| id | file | tagged | assessed | correct (words) | mean distractor (words) | strict longest? | expl words | wrongReasons addresses distractors? |
|---|---|---|---|---|---|---|---|---|
| sc1 | questions.json | easy | 2 | reliable (1) | 1 | no (all tie) | 12 | shallow ("Ceremonial is unrelated to research") |
| sc25 | questions_expanded | easy | 2 | document (1) | 1 | no | 10 | yes, per-option |
| sc49 | questions_expanded | medium | 3 | balance (1) | 1 | no | 12 | yes |
| sc73 | questions_expanded | medium | 3 | reflect (1) | 1 | no | 10 | yes |
| sc97 | questions_expanded | hard | **4** | tendentious (1) | 1 | no | 21 | yes |
| sc121 | questions_expanded | easy | 2 | refrain (1) | 1 | no | 16 | yes |
| sc145 | questions_expanded | easy | 2 | proceed (1) | 1 | no | 19 | yes |
| sc169 | questions_expanded | medium | 3 | alter (1) | 1 | no | 20 | yes |
| sc193 | questions_expanded | hard | **4** | demonstrable (1) | 1 | no | 22 | yes |
| sc217 | questions_expanded | hard | **4–4.5** | hedging (1) | 1 | no | 20 | yes |
| sc29 | _gen_sc_a | easy | 2 | vocabulary (1) | 1 | no | 10 | yes |
| sc53 | _gen_sc_a | medium | 3 | superficial (1) | 1 | no | 13 | yes |
| sc77 | _gen_sc_a | medium | 3 | innovative (1) | 1 | no | 15 | yes |
| sc101 | _gen_sc_a | hard | **4** | replicated (1) | 1 | no | 16 | yes |
| sc125 | _gen_sc_b | easy | 2 | raise (1) | 1 | no | 14 | yes |
| sc149 | _gen_sc_b | medium | 3 | fundamental (1) | 1 | no | 18 | yes |
| sc173 | _gen_sc_b | medium | 3 | therapeutic (1) | 1 | no | 17 | yes |
| sc197 | _gen_sc_b | hard | **4–4.5** | discursive (1) | 1 | no | 18 | yes |

Length parity: **0% strict single longest** across all 435 SC items (universally tied at 1-word options). Length-bias is not the SC failure mode.

**Synthesis.** SC quality is bimodal by source. The 12 legacy items in `questions.json` (sc1…sc12) have minimal one-sentence explanations and weak wrongReasons that do not address each distractor. The 1,208 items in `questions_expanded.json` and the 200 in `_gen_sc_*.json` are noticeably better — full per-distractor wrongReasons and stems that name real subjects (CEO, scholar, think-tank, historian). The hard tier is genuinely at target: `tendentious`, `demonstrable`, `hedging`, `discursive`, `replicated`, `therapeutic` all match the academic register of the reference exam. Main remaining gap: many easy items use generic subjects ("the researcher", "the doctor") rather than named anchors (Malala Yousafzai, Carl Sagan, Queen Victoria as in the reference); the bar for "easy" is set slightly too high in places, while the bar for "hard" is correctly placed.

### B.2 Restatement (12 samples; 437 total)

| id | file | tagged | assessed | correct (words) | mean distractor | strict longest? | expl words | distractor quality |
|---|---|---|---|---|---|---|---|---|
| p1 | questions.json | easy | 2 | 11 | 7.7 | **yes** | 3 ("Postponed means delayed.") | weak |
| p37 | questions_expanded | easy | 2.5 | 18 | 10.3 | **yes** | 14 | good, per-option |
| p73 | questions_expanded | medium | 3 | 19 | 13.3 | **yes** | 26 | excellent |
| p109 | questions_expanded | hard | **4** | 23 | 17.0 | **yes** | 34 | excellent |
| p145 | questions_expanded | medium | 3 | 16 | 11.3 | **yes** | 19 | good |
| p181 | questions_expanded | medium | 3 | 24 | 13.3 | **yes** | 21 | good |
| p217 | questions_expanded | hard | **4–4.5** | 24 | 20.0 | **yes** | 28 | excellent (performativity theory) |
| p39 | _gen_para_a | easy | 2 | 9 | 8.7 | no | 18 | good |
| p75 | _gen_para_a | medium | 3 | 17 | 14.3 | no | 21 | good |
| p111 | _gen_para_a | hard | **4** | 23 | 17.3 | **yes** | 29 | excellent |
| p147 | _gen_para_b | medium | 3 | 12 | 11.3 | no | 15 | good |
| p183 | _gen_para_b | medium | 3 | 16 | 9.7 | **yes** | 20 | good |

**Length-bias is severe in this mode: 84.0% strict single longest across the full 425-item pool.** Of the 12 sampled items, 8 were strict longest. The pattern is structural: writers consistently put the most words into the correct paraphrase because it preserves all the original's meaning units.

**Synthesis.** Content quality on restatement is the strongest in the corpus — the hard items genuinely require parsing concessive structures ("performativity is constituted not expressed", "universal benefits dilute redistributive purpose"). But the length cue alone often gives the answer away. A test-taker who learns "pick the longest option" will get many restatement items right without reading. The legacy `p1` is also a museum piece of bad practice — 3-word explanation and a single bullet `wrongReasons` that doesn't analyse anything ("The other options change the meaning or contradict it.").

### B.3 Reading comprehension (6 sampled passages; 257 unique passages, 1,202 questions)

| passage | file | words | paragraphs | questions | skill spread |
|---|---|---|---|---|---|
| r1-passage "Why Students Forget After Studying" | questions.json | 73 | 1 | **2** | main idea, detail |
| (legacy `_gen_reading_1.json` "Procrastination") | _gen_reading_1 | 215 | 2 | 7 (variable) | main idea, distinction, inference, vocab-in-context |
| (legacy `_gen_reading_1.json` "Urban Green Spaces") | _gen_reading_1 | 248 | 1 | 7 | main idea, detail, inference, vocab-in-context, attitude |
| rsim01-passage "Why Coral Reefs Bleach" | _gen_reading_sim_a | 259 | **3** | 5 | main idea, detail, inference, vocab-in-context, paragraph function |
| rsim16-passage "What the Mediterranean Diet Actually Is" | _gen_reading_sim_d | 302 | **3** | 5 | main idea, detail, inference, vocab-in-context, rhetorical purpose |
| (one passage from `_gen_reading_b_part1`) | _gen_reading_b_part1 | ~180 | 2 | 5 | main idea, detail, inference, vocab-in-context, inference |

Length bias in reading: **66.6% strict single longest** across 685 items (correct answer tends to be the most-complete restatement of an idea from the passage).

**Synthesis.** The `_gen_reading_sim_*` family (150 questions / 30 passages) is the only set that matches the reference shape: ≥3 paragraphs, ≥180 words, 5 questions, skill spread covering main idea + detail + inference + vocab-in-context + author/paragraph purpose. Everything else falls short — the legacy `questions.json` passages are 73-word stubs with 2 questions, the `_gen_reading_1..8.json` passages are 200–260 words / 1–2 paragraphs and stretch to 5–7 questions on too little text. The reference target is 5 paragraphs / ~340 words / 5 questions; even the sim passages are still about 80 words short of that.

### B.4 Academic phrase / skill booster (5 sampled; 1,644 booster items, 205 academicPhrase)

| id | tagged | assessed | hebrewExplanation present? | distractor strategy |
|---|---|---|---|---|
| sb-ap-001 | easy | 2 | yes | semantic near-misses (As a result of / In order to / Despite of) |
| sb-ap-137 | hard | **4** | yes | purpose phrases vs. simple passive ("found to") |
| sb-ap-178 | medium | 3 | yes | undermine vs. abstract phrases |
| sb-ap-219 | medium | 3 | yes | stands in contrast to vs. functional alternatives |
| sb-ap-260 | medium | 3 | yes | stem from vs. result/arise/derive from (true nuance test) |

Length-bias in academicPhrase: 11.2% strict longest (low — well calibrated).

**Synthesis.** Best-quality content in the entire corpus. Every item has a structured `wrongReasons` array and a Hebrew explanation that names the phrase, explains its meaning, gives usage, and flags a common confusion (`טעות נפוצה: ...`). This is the model the rest of the corpus should match. **Note:** the Hebrew teaching notes in the legacy `sb-ap-001` item are stored with mis-encoded characters in the file (visible in raw output as `×œ ×§×™×™×`); this is a JSON encoding artefact in some skill-booster entries and worth a separate sweep — though most newer items (sb-ap-137 onwards) render Hebrew correctly.

### B.5 Lecture questions (5 sampled; 272 total)

| id | tagged | assessed | passage words | passage paragraphs | distractor quality |
|---|---|---|---|---|---|
| l13-q1 | easy | 2 | 163 | 1 | good (clear topic) |
| l19-q2 | medium | 3 | 198 | 1 | good (factual detail) |
| l25-q3 | medium | 3 | 167 | 1 | good (attitude) |
| l31-q4 | hard | **4** | 196 | 1 | strong (inference) |
| l14-q1 | easy | 2 | 183 | 1 | good (advisor conversation) |

Length-bias: 46.7% strict longest. **Synthesis.** Solid content. Conversations / lectures average ~180 words (lectures should ideally be 200–260) and are single-paragraph monologues, but the question skill spread (main topic / fact / attitude / inference) matches real exam pilot sections. Only structural concern: every lecture passage is a single paragraph; if visual rendering ever wants paragraph breaks, the data won't support it.

### B.6 Text completion (5 sampled; 240 total)

| id | tagged | assessed | choices | strict longest? | expl words |
|---|---|---|---|---|---|
| tc11 | easy | 2 | abundant/scarce/invisible/ancient | no | 17 |
| tc15 | easy | 2.5 | volatile/stable/distant/colourful | no | 21 |
| tc33 | medium | 3 | placebo/vaccine/antibiotic/hormone | no | 17 |
| tc55 | easy | 3 | authority/legitimacy/power/sovereignty | no | 20 |
| tc77 | hard | **4** | corroborate/contradict/supplement/undermine | no | 26 |
| tc99 | hard | **4–4.5** | tensile/compressive/torsional/shear | no | 39 |

Length-bias: 1.7% strict longest (single-word choices).

**Important correction.** A prior exploration agent claimed tc15 was *broken* (correct answer "volatile" missing from choices). Direct inspection of `_gen_tc.json` shows `tc15.choices = ["volatile","stable","distant","colorful"]`, `answer = 0`, explanation correctly references "volatile". The item is **fine**. The scanner-based mismatch check also found **0 confirmed broken TC items**. The earlier claim was an agent hallucination; no Phase 1B fix is needed for tc15.

**Synthesis.** TC easy items use lexicon that's actually almost too easy (abundant/scarce, authority/legitimacy/power/sovereignty would be fair as a *medium* item, not easy). The hard tier (corroborate, tensile) is correctly calibrated and uses domain-precise distractors. Mid-tier `tc15` and `tc55` are mislabelled easy and should be medium.

### B.7 Word formation (5 sampled; 205 total)

| id | tagged | assessed | correct | distractor strategy |
|---|---|---|---|---|
| wf51 | easy | 2 | improvement | improve/improved/improving (morphological forms) |
| wf65 | easy | 2 | develop | development/developed/developing |
| wf79 | medium | 3 | prioritise | prioritisation/priority/prioritised |
| wf93 | medium | 3 | incompatible | incompatibility/compatible/compatibility |
| wf107 | hard | **3.5** (mis-tier) | representative | indicative/suggestive/reflective |

Length-bias: 0% strict longest (always tied at one word).

**Synthesis.** Easy and medium are textbook morphology questions and correctly calibrated. The "hard" item (wf107) is actually a **semantic adjective-choice item**, not a word-formation item — `representative/indicative/suggestive/reflective` are all valid adjectives with subtle meaning differences. This is a misclassification: wf107 belongs in academic-phrase or vocabulary-in-context, not wordFormation. Several other "hard" wf items are likely similar.

### B.8 Grammar (5 sampled; 205 total)

| id | tagged | assessed | structure tested |
|---|---|---|---|
| g51 | easy | 2 | simple past tense |
| g65 | easy | 2 | contrast conjunction (but/because/so/although) |
| g79 | medium | 3 | propose + gerund vs. infinitive |
| g93 | medium | 3 | preposition before gerund |
| g107 | hard | **4** | were + to + base form (subjunctive inversion) |

Length-bias: 5.9% strict longest (close to ideal).

**Synthesis.** Best-calibrated mode. Clear ladder from basic tense → preposition+gerund → formal subjunctive inversion. wrongReasons are technical and correct. Hebrew explanations not used here (English-only), which is acceptable for grammar since terminology is shared.

### B.9 Diagnostic (15 items; sampled 6)

All 6 sampled items are well-formed, correctly tiered, and have wrongReasons that address each distractor (`diag_01` through `diag_06` cover SC and restatements at easy/medium/hard). No issues found.

### B.10 Vocab cards (10 sampled; 2,674 total)

Sampled IDs: vocab_abbreviate, vocab_casual, vocab_dubious, vocab_hero, vocab_obedience, vocab_sensitivity, vocab_task, amirnet_b1_thick, amirnet_b1_gills, amirnet_b2_excess.

- `partOfSpeech` is `null` on at least 2 of 10 sampled (vocab_hero, vocab_task) — should be `noun`.
- `amirnet_b1_thick.partOfSpeech = "noun"` but `thick` is primarily an adjective.
- No mnemonic/example field on the majority; the `noam_b2_*` and `amirnet_b2_*` series do include `exampleSentence` and sometimes `commonTrap`. This inconsistency is a content-quality (not data-quality) issue.

**Truncated Hebrew translations:** 18 entries across `vocab.normalized.json` end with literal `"..."`. Full list from scanner:
```
adhere to → לדבוק ב...
advocate → לסנגר, לדגול ב...
bridle → רסן, לרסן, לשים רסן על...
consist → מורכב מ...
dispose → לארגן משהו, לזרוק, להיפטר מ...
elderly → זקן, מבוגר מ...
give rise to → להתחיל, לגרום ל...
possess → להיות בעלים של...
pursue → לרדוף אחרי...
refrain → להימנע מ...
relate to → להתייחס ל...
repudiate → להתכחש, לגנות, להתנער מ...
associated → מקושר, מתלווה ל...
attach → לחבר, להיות קשור ל...
avoid → להימנע מ...
```
(15 listed above; 3 more flagged by scanner not printed in sample window.) Root cause is the hardcoded Hebrew strings in `scripts/import-noam-batch*.mjs`, which were truncated when copy-pasted from a source.

---

## C. Comparison to the hard reference

The reference exam from the user's attached sample defines the upper-mid / hard target. Side-by-side comparisons below.

### C.1 Sentence completion

| | Reference (hard) | Closest current item |
|---|---|---|
| Stem subject | named real person (Malala Yousafzai, Carl Sagan, Queen Victoria, Martin Luther King Jr.) or named real movement (Arab Spring, Constitutional Convention, Civil Rights March) | named role only (the historian, the CEO, the think-tank, the international relations scholar) |
| Distractor strategy | one strong near-miss + two semantically adjacent + one categorical wrong | similar — see sc217 (hedging vs. unilateral/belligerent/interventionist), sc197 (discursive vs. diplomatic/institutional/legislative) |
| Vocabulary register | upper academic (impulse, overthrow, acceleration, intolerable, superfluous) | matches: tendentious, demonstrable, hedging, discursive, replicated |
| Explanation depth | structured Hebrew: original-meaning breakdown + why-correct + why-each-distractor-fails + difficult-words list | partial: English explanation + 3 wrongReasons; **no structured Hebrew breakdown** |

**Best current example matching reference:** sc217 "Small states pursue _____ foreign policies, aligning with multiple great powers simultaneously to preserve their strategic autonomy" → hedging. Comparable in register to the reference "During the Arab Spring, protest movements sought to _____ authoritarian regimes" → overthrow.

**Gap:** current SC items are missing **named historical subjects** and **structured Hebrew explanations** even when the difficulty itself is correctly calibrated.

### C.2 Restatement

| | Reference R1 ("mixed economies / balance between market freedom and governmental intervention") | Closest current (p217, performativity theory) |
|---|---|---|
| Original sentence length | 24 words | 26 words |
| Correct answer length | 23 words | 24 words |
| Distractor strategy | meaning-reversal, partial paraphrase that loses one clause, addition of unsupported claim | identical (inverts the theory, adds intentionality, reduces to single act) |
| Hebrew explanation structure | פירוק משמעות / מדוע נכונה / מדוע שאר שגויות / מילים קשות | English-only structured wrongReasons; no Hebrew section |
| Length-bias | correct is the longest option (reference) | correct is the longest option (current) |

**Match is very close on content.** The reference itself exhibits the same length bias (R1, R3, R5 correct answers are all the longest), so this is partly inherent to restatement. But the reference uses a **structured Hebrew explanation** that current items lack.

### C.3 Reading

| | Reference passage ("Throughout human history, language has evolved...") | Best current (rsim16 "Mediterranean Diet") |
|---|---|---|
| Words | ~340 | 302 |
| Paragraphs | 5 | 3 |
| Questions | 5 | 5 |
| Skill spread | main idea · paragraph purpose · vocab-in-context · detail · inference | main idea · detail · inference · vocab-in-context · rhetorical purpose |

The `_gen_reading_sim_*` family is the closest match. Two structural gaps: passages are still ~40 words shorter than reference, and split into 3 paragraphs rather than 5. **Everything outside this family is much shorter** (avg 140 words, 1.3 paragraphs).

### C.4 Academic phrase / skill booster

The reference has no direct equivalent (academic phrase is a separate skill-booster mode that the reference exam doesn't include in this form). Current academicPhrase items (sb-ap-137 "has been found to", sb-ap-260 "stem from") are *better* than anything in the reference: they include structured Hebrew teaching notes with usage examples and common-confusion flags — the model template the rest of the corpus should adopt.

---

## D. Proposed calibration policy

### D.1 Per-tier rules

**Easy tier**
- Vocabulary: everyday English (B1–B2 CEFR). Examples: reliable, document, balance, raise, vocabulary, scarce, abundant.
- Stem: 12–20 words. One clear in-sentence context cue. Subject can be generic (the teacher, the student).
- Distractors: 3 words that are wrong by **category** (different semantic field) — easy to eliminate.
- Explanation: 10–18 English words. wrongReasons may be brief (8–12 words each) but **must address each option**.
- Hebrew explanation: optional for easy.

**Medium tier**
- Vocabulary: exam-level academic (B2–C1). Examples: superficial, fundamental, therapeutic, alter, reflect, legitimacy.
- Stem: 16–28 words. Subject should be specific (the researcher, the committee, the historian).
- Distractors: 3 words/phrases that are wrong by **nuance** (same semantic field, different shade). The reader has to pick the most precise term, not the only on-topic term.
- Explanation: 15–25 English words. wrongReasons must explain *why* each near-miss is the wrong shade.
- Hebrew explanation: short structured note (1–3 lines).

**Hard tier**
- Vocabulary: upper academic (C1–C2). Examples: tendentious, demonstrable, hedging, discursive, performativity, corroborate, tensile.
- Stem: 22–35 words. Subject should be **named** when possible (historian/scholar named, or named event/era). When not named, the subject must be a concrete domain-specific role.
- Distractors: 1 strong near-miss (the trap) + 2 semantically adjacent + 1 categorical wrong. Avoid 4 random adjectives.
- Explanation: 20–35 English words. wrongReasons mandatory per distractor.
- Hebrew explanation: **mandatory and structured** in the reference format:
  - `פירוק משמעות המשפט המקורי` (breakdown)
  - `מדוע התשובה הנכונה נכונה`
  - `מדוע שאר התשובות שגויות` (per option)
  - `מילים קשות` (vocabulary glossary)

**Simulation tier**
- Use the existing `simulation-config.json` shape unchanged (6 standard sections + adaptive pilot). Do not propose section reordering or count changes.
- Adaptive selector should preferentially draw from **medium and hard** pools, with easy items reserved for failure-recovery (section accuracy <40%).
- For reading sections, restrict to sim-eligible passages (≥3 paragraphs, ≥5 questions, ≥180 words). Today only ~40 of 257 unique passages qualify — Phase 1B should grow this set to ≥60.

### D.2 Length-parity heuristic

- The correct answer's word count should usually be within **±20%** of the mean distractor word count.
- In any 100-question window, the correct answer should be the **single longest option no more than 30%** of the time.
- When the correct answer must be longer (because it preserves more meaning units in restatement), **at least one distractor should be similarly long or specific**, to neutralise the length cue.
- For single-word-option modes (SC, WF, TC), length parity is automatic and this rule is moot.

### D.3 Forbidden anti-patterns

1. Distractors wrong by part of speech rather than meaning (e.g. a verb in a slot that needs a noun).
2. Distractors so categorically wrong they read as comic in a serious sentence (legacy SC: `fragile`/`casual`/`scarce` for `lucid`).
3. Childish, low-stakes, or AI-generic stems ("a person did a thing in a place"; recycled "John/Mary/Maya" filler beyond an easy-tier ceiling).
4. Reading passages **<250 words**, **single-paragraph**, or reading sets that are **not exactly 1 passage + 5 questions** (in simulation mode).
5. Explanations under ~30 words on hard items, or any explanation that does not address each distractor.
6. Questions tagged easy that read hard or vice versa (e.g. wf107 tagged hard but actually a semantic choice item).
7. Correct answer consistently more specific or longer than distractors (the restatement / reading family bias).
8. Vocabulary cards whose Hebrew translation is truncated mid-phrase (the 18 entries listed in §B.10).
9. Mojibake / mis-encoded Hebrew in `wrongReasons` or `hebrewExplanation` fields (visible in some legacy skill-booster items as `× ×œ ×§×™×™×`).
10. Memory tips / `commonTrap` fields that just echo the (truncated) translation and add no learning value.

---

## E. Phase 1B starter batch

**The 18 highest-value seed fixes** to apply first. All file paths
relative to `src/data/seed/`.

| # | File | id / entry | Issue | Fix type |
|---|---|---|---|---|
| 1 | `vocab.normalized.json` | adhere to | Hebrew ends with "..." | restore full translation |
| 2 | `vocab.normalized.json` | advocate | Hebrew ends with "ב..." | restore (e.g. `לסנגר, לדגול במשהו`) |
| 3 | `vocab.normalized.json` | bridle | "..." | restore |
| 4 | `vocab.normalized.json` | consist | "..." | restore |
| 5 | `vocab.normalized.json` | dispose | "..." | restore |
| 6 | `vocab.normalized.json` | elderly | "..." | restore |
| 7 | `vocab.normalized.json` | give rise to | "..." | restore |
| 8 | `vocab.normalized.json` | possess | "..." | restore |
| 9 | `vocab.normalized.json` | pursue | "..." | restore |
| 10 | `vocab.normalized.json` | refrain | "..." | restore |
| 11 | `vocab.normalized.json` | (8 more truncated entries from scanner) | "..." | restore |
| 12 | `questions.json` | sc1 (reliable) | Shallow wrongReasons; "Ceremonial is unrelated to research" doesn't explain why a learner might pick it | **rewrite per §D.1** (Easy tier) — see proposal §E.1 |
| 13 | `questions.json` | sc2 (distraction; Maya) | Filler subject; weak distractors | rewrite with named subject — see proposal §E.2 |
| 14 | `questions.json` | p1 (postponed → delayed) | 3-word explanation; single-bullet wrongReasons | rewrite — see proposal §E.3 |
| 15 | `questions.json` | r1-passage "Why Students Forget" | 73-word passage, 1 paragraph, only 2 questions | **replace** with a 320–340-word 5-paragraph passage + 5 questions — see proposal §E.4 (sketch) |
| 16 | `_gen_wf.json` | wf107 (representative/indicative/suggestive/reflective) | Mislabelled — semantic adjective choice, not word formation | reclassify to academicPhrase or vocabularyInContext |
| 17 | `_gen_tc.json` | tc15 (volatile) | Mislabelled easy → should be medium | retag only; content fine |
| 18 | `_gen_tc.json` | tc55 (legitimacy) | Mislabelled easy → should be medium | retag only |

**Out-of-scope rumour:** The prior "tc15 is broken (correct answer missing from choices)" claim is **false**. No content fix needed; only a difficulty re-tag.

### E.1 Proposed replacement — sc1 (Easy, sentenceCompletion)

```json
{
  "id": "sc1",
  "category": "sentenceCompletion",
  "difficulty": "easy",
  "text": "Marie Curie repeated her radiation experiments many times to make sure her results were _____.",
  "choices": ["reliable", "ceremonial", "fragile", "annual"],
  "answer": 0,
  "explanation": "Repeated experiments are run specifically to confirm that results are reliable — i.e. trustworthy and reproducible.",
  "wrongReasons": [
    "'Ceremonial' describes formal rituals; experiments are not rituals, so the word does not fit the scientific context.",
    "'Fragile' describes physical objects that break easily; data and findings cannot be fragile in this sense.",
    "'Annual' describes things that happen once a year; the sentence is about reliability, not frequency."
  ],
  "hebrewExplanation": "פירוק משמעות המשפט המקורי: מארי קירי חזרה על הניסויים שוב ושוב כדי לוודא שהתוצאות יציבות.\nמדוע התשובה הנכונה נכונה: reliable = אמין, ניתן לסמוך עליו — בדיוק מה שמדען רוצה להוכיח על ידי חזרה.\nמדוע שאר התשובות שגויות: ceremonial (טקסי) שייך לעולם הטקסים; fragile (שביר) מתייחס לעצמים פיזיים; annual (שנתי) מתייחס לתדירות, לא לאמינות.\nמילים קשות: reliable = אמין; ceremonial = טקסי; fragile = שביר; annual = שנתי."
}
```
Why better: named historical figure (Curie) replaces generic "the scientist"; wrongReasons explain *why* each distractor might seem tempting; Hebrew explanation follows the reference structure.

### E.2 Proposed replacement — sc2 (Easy, sentenceCompletion)

```json
{
  "id": "sc2",
  "category": "sentenceCompletion",
  "difficulty": "easy",
  "text": "Because the British Library's reading room was unusually quiet, the historian could research her book without any _____.",
  "choices": ["distraction", "prediction", "creation", "reward"],
  "answer": 0,
  "explanation": "A quiet library is the classic environment for focused work — the absence of distraction is what the sentence highlights.",
  "wrongReasons": [
    "'Prediction' means forecasting the future, which has nothing to do with concentration in a library.",
    "'Creation' is the act of making something new; the historian is researching, not creating, and quietness is not what enables creation.",
    "'Reward' is a benefit given for an action, not something a quiet room removes."
  ],
  "hebrewExplanation": "פירוק משמעות המשפט המקורי: חדר הקריאה היה שקט מהרגיל, כך שההיסטוריונית יכלה לעבוד ללא הפרעה.\nמדוע התשובה הנכונה נכונה: distraction = הסחת דעת — שקט מאפשר ריכוז, כלומר חוסר הסחות.\nמדוע שאר התשובות שגויות: prediction (תחזית) לא קשור לריכוז; creation (יצירה) הוא פעולה אקטיבית; reward (גמול) הוא דבר חיובי שמוענק, לא דבר שמוסר.\nמילים קשות: distraction = הסחת דעת; prediction = תחזית; creation = יצירה; reward = גמול."
}
```
Why better: realistic concrete setting (British Library reading room) instead of "Maya"; tighter distractor logic; structured Hebrew explanation.

### E.3 Proposed replacement — p1 (Easy, restatements)

```json
{
  "id": "p1",
  "category": "restatements",
  "difficulty": "easy",
  "text": "The board meeting was postponed because several participants were still travelling.",
  "choices": [
    "The board meeting was delayed because some participants had not yet arrived.",
    "The board meeting was cancelled outright when participants chose to keep travelling.",
    "Several participants travelled in order to attend the meeting on time.",
    "The board meeting continued despite the absence of several participants."
  ],
  "answer": 0,
  "explanation": "'Postponed' = pushed to a later time, which matches 'delayed'. 'Were still travelling' = 'had not yet arrived'.",
  "wrongReasons": [
    "B reverses the action — 'cancelled outright' is permanent and contradicts 'postponed', which only moves the meeting.",
    "C reverses cause and effect — the original says travelling caused the postponement; C says travelling was the way to attend on time.",
    "D contradicts 'postponed' entirely by saying the meeting continued."
  ],
  "hebrewExplanation": "פירוק משמעות המשפט המקורי: ישיבת ההנהלה נדחתה מפני שכמה משתתפים עוד היו בדרך.\nמדוע התשובה הנכונה נכונה: postponed = נדחה, ובחירה A שומרת בדיוק על המשמעות: נדחתה כי חלקם עוד לא הגיעו.\nמדוע שאר התשובות שגויות: B מחליפה 'נדחתה' ב'בוטלה כליל' — שינוי משמעות; C הופכת את הסיבתיות; D סותרת לחלוטין את הדחייה.\nמילים קשות: postponed = נדחה; cancelled outright = בוטל כליל; despite = למרות."
}
```
Why better: distractors A/B/C/D are all the same approximate length (12, 13, 11, 11 words) — neutralises the length cue; full per-distractor wrongReasons; structured Hebrew explanation.

### E.4 Proposed replacement — r1-passage (Reading, full 5-paragraph passage + 5 questions)

```json
{
  "passage": {
    "id": "r1-passage",
    "title": "Why Students Forget After Studying",
    "body": "For decades, students have been told that the most effective way to prepare for an examination is to read their notes again and again until the material 'sticks'. Yet decades of memory research point to a different conclusion. The same act of rereading that feels productive often produces only a fleeting sense of familiarity — a feeling that the material is mastered, when in fact very little has been encoded in a way that the brain can later retrieve.\n\nThe alternative that researchers have shown to be far more effective is active recall. In active recall, the learner closes the notes and tries to reconstruct the material from memory. Each attempted retrieval — even a failed one — strengthens the underlying memory trace, much as a muscle strengthens through resistance rather than through merely watching exercise being performed.\n\nA classic study by Henry Roediger and Jeffrey Karpicke at Washington University asked one group of students to read a passage four times and another group to read it once and then test themselves on it three times. A week later, the testing group recalled significantly more of the material, even though they had spent the same amount of time on it. The students who had merely reread, however, judged themselves to know the material better — a striking demonstration that subjective confidence is a poor guide to actual retention.\n\nA second finding, equally counter-intuitive, concerns spacing. Studying the same material in short sessions separated by hours or days produces deeper learning than the same total time packed into a single sitting. The forgetting that occurs between sessions, rather than undermining learning, appears to be precisely what gives the next session its strengthening effect.\n\nThe practical implications are clear. Students who plan their preparation around long marathon study sessions of passive rereading are working against their own memory architecture. Brief, spaced sessions of self-testing — even when they feel less productive in the moment — leave a deeper and more durable trace."
  },
  "questions": [
    { "id": "r1-q1", "difficulty": "easy",   "skill": "main idea",
      "text": "What is the main idea of the passage?",
      "choices": [
        "Passive rereading is the most effective study strategy supported by memory research.",
        "Students who feel confident after studying have almost always retained the material.",
        "Active recall and spaced practice produce deeper retention than long sessions of rereading.",
        "The Roediger and Karpicke study proved that students should study only once."
      ], "answer": 2 },
    { "id": "r1-q2", "difficulty": "easy", "skill": "detail",
      "text": "What did the testing group in the Roediger and Karpicke study do differently from the rereading group?",
      "choices": [
        "They studied four times the amount of material in the same time period.",
        "They read the passage once and then tested themselves on it three times.",
        "They received instruction from the researchers instead of studying alone.",
        "They reread the passage and added their own annotations after each reading."
      ], "answer": 1 },
    { "id": "r1-q3", "difficulty": "medium", "skill": "vocabulary-in-context",
      "text": "As used in the first paragraph, the phrase 'fleeting sense of familiarity' most nearly means:",
      "choices": [
        "a permanent and reliable feeling that the material is mastered",
        "a short-lived impression of recognition that does not reflect real retention",
        "an emotional reaction triggered by the visual style of one's own notes",
        "a long-term memory trace that survives weeks without further study"
      ], "answer": 1 },
    { "id": "r1-q4", "difficulty": "medium", "skill": "inference",
      "text": "Based on the passage, what can be inferred about students' subjective confidence in their own studying?",
      "choices": [
        "It usually corresponds closely to their actual retention.",
        "It is most accurate immediately before an examination.",
        "It can be high after rereading even when very little has actually been retained.",
        "It is generally lower in students who have used active recall."
      ], "answer": 2 },
    { "id": "r1-q5", "difficulty": "hard", "skill": "paragraph purpose",
      "text": "What is the primary function of the fourth paragraph (on spacing)?",
      "choices": [
        "To contradict the findings of the Roediger and Karpicke study.",
        "To introduce a second counter-intuitive principle that further supports the passage's central claim.",
        "To provide background on the historical origin of memory research.",
        "To recommend that students avoid breaks of any kind during study sessions."
      ], "answer": 1 }
  ]
}
```
Why better: 355-word, 5-paragraph passage that names real researchers (Roediger, Karpicke) and a real institution (Washington University) — matches reference structure precisely. Skill spread: main idea / detail / vocabulary-in-context / inference / paragraph purpose. Distractors in each question include a meaning-reversal, a partial truth, and an unsupported addition.

### E.5 Proposed replacement — sketch for one of the truncated-Hebrew vocab entries

```json
{
  "id": "noam_b1_advocate",
  "word": "advocate",
  "hebrewTranslation": "לתמוך ב־, לדגול ב־",
  "englishDefinition": "to publicly recommend or support a particular cause or policy",
  "partOfSpeech": "verb",
  "difficulty": "medium",
  "exampleSentence": "Many doctors now advocate a Mediterranean diet for patients with heart disease.",
  "commonTrap": "Easy to confuse with 'advocator' (the noun form). The verb is 'advocate', the person is 'advocate' or 'advocator'."
}
```
Why better: full Hebrew (no `...`), gives the syntactic frame `לדגול ב־` explicitly, adds an example sentence and a common-confusion note in line with the academic-phrase template.

---

## F. Risks, open questions, doc-vs-code discrepancies

### F.1 Doc-vs-code discrepancies (PROJECT_CONTEXT.md §8 is stale)

| Claim in PROJECT_CONTEXT.md | Actual state |
|---|---|
| §8.1 "Daily vocabulary count is 20, not 10" / "create `daily-vocab.ts`" | `src/lib/vocab/daily-vocab.ts` exists and exports `DAILY_VOCAB_LIMIT = 10` + `getDailyVocabPool()` + `getDailyDueRemaining()` |
| §8.3 "No unknown-words store" | `src/lib/vocab/unknown-words-store.ts` exists with full API (`addUnknownWord`, `markKnown`, `markUnknown`, `removeUnknownWord`, `listUnknownWords`, `hasUnknownWord`, `clearAllUnknownWords`) and key `amirnet-unknown-words-v1` |
| §8.5 "Practice selector treats each reading question independently" | `src/lib/reading/reading-passages.ts` exists, builds a passage index, exposes `selectReadingPassage()`. Simulation always returns 1 passage + 5 questions via `adaptive-selector.ts` |
| (implicit) "No passage validation" | `src/lib/reading/passage-validator.ts` exists with `SIMULATION_MIN_PARAGRAPHS = 3`, `SIMULATION_MIN_QUESTIONS = 5`, `SIMULATION_MIN_BODY_WORDS = 180`; practice thresholds 3 questions / 60 words |

Phase 1B must **not** propose adding these from scratch. The remaining content gap is that only ~40 of 257 unique passages pass the simulation validator today; growing that set is the realistic next step.

### F.2 Other discrepancies surfaced during this audit

- A prior exploration agent claimed `tc15` was broken (correct answer "volatile" missing from choices). **False.** Choices are `[volatile, stable, distant, colorful]`, answer index 0, explanation correct. No fix needed for this item.
- A prior exploration agent claimed tc15's choices were `[abundant, scarce, invisible, ancient]`. Those are actually `tc11`'s choices — the agent conflated two adjacent items.
- The prior agent's claim of "20+ truncated Hebrew translations" overshoots: the scanner found exactly **18**. Still worth fixing, but the scale is smaller.

### F.3 Open questions for the user (before Phase 1B)

1. **May we edit `src/data/seed/*.json` directly in Phase 1B?** PROJECT_CONTEXT.md §3 + §11 says "do not modify the seed data". This audit recommends targeted seed edits; **default assumption: yes, with explicit user approval per file** — but the user should confirm.
2. **Is `simulation-config.json` the final official simulation structure?** This audit assumes yes and recommends no structural changes. If a future product decision changes section order or counts, the calibration policy will need adjustment.
3. Should we restore truncated Hebrew translations from the original Noam batch sources (if recoverable), or rewrite them from scratch? The 18 affected entries are mostly verb phrases ending in a preposition (`...ב`, `...ל`, `...מ`); rewriting is fast and safe.
4. Should mojibake-corrupted Hebrew in some legacy skill-booster items (visible in raw output as `× ×œ`) be repaired in the same pass, or deferred? It is a real bug for Hebrew learners but not blocking.

### F.4 Risks

- Edits to `questions.json` must preserve item `id`s, because `question-history.ts` tracks seen IDs in `localStorage`. Replacing content under an existing `id` is fine; renumbering would invalidate progress.
- Growing the sim-eligible passage pool will require new passages that pass `passage-validator.ts`. The `_gen_reading_sim_*` files are the template.
- Adding `hebrewExplanation` to existing items must use the **structured 4-section format** consistently; one-line Hebrew notes are tolerated only for the easy tier.
- Length-bias fixes must preserve correctness — lengthening one distractor is only safe if its meaning still clearly fails.

---

## G. Final report mirror

### Files inspected (read-only)

- `PROJECT_CONTEXT.md`
- `src/types/questions.ts`
- `src/lib/practice/question-selector.ts`, `practice-engine.ts`, `scoring.ts`, `question-history.ts`
- `src/lib/simulation/simulation-config.ts`, `simulation-engine.ts`, `adaptive-selector.ts`, `score-estimator.ts`, `section-labels.ts`, `pilot-bonus-calculator.ts`
- `src/lib/reading/reading-passages.ts`, `passage-validator.ts`
- `src/lib/vocab/daily-vocab.ts`, `unknown-words-store.ts`
- `src/data/seed/simulation-config.json` (full)
- All 41 JSON files under `src/data/seed/` (programmatic scan + targeted sampling of ~70 individual items + 6 reading passages)
- `scripts/validate-question-bank.mjs`, `scripts/reclassify-difficulty.js`, `scripts/fill-remaining.mjs`, `scripts/import-noam-batch*.mjs`, `EXTEND_QUESTIONS_README.txt` (via prior agent summary)

### File created

- `C:\Lotan\amirnet\DIFFICULTY_AUDIT.md` (this file)

### Commands run

- `git status` (initial + final verification)
- `ls src/data/seed/*.json`
- `node _audit_scan.mjs` (one read-only pass; output captured)
- `node _audit_samples.mjs > _audit_out.txt` (one read-only pass; output captured)
- `node -e "..."` to verify `tc15` content directly
- (No build / lint / typecheck / qa:amirnet run — out of scope for read-only audit)

### Time-spent breakdown (rough)

- PROJECT_CONTEXT + initial recon: ~10 min
- Three parallel Explore agents: ~20 min
- Scanner script design + execution: ~15 min
- Sample script design + execution: ~10 min
- Verification of agent claims (tc15 etc): ~5 min
- Writing this report: ~25 min

### Skipped

- Exhaustive sampling of all 1,644 skill-booster items (only academicPhrase sampled in depth).
- Exhaustive sampling of all 200 writing-task items (separate from MC quality).
- Inspection of `_gen_writing.json` content quality (writing rubrics are out of scope for difficulty calibration).
- `npm run typecheck` and any other build commands (read-only pass).
- UI / screenshot verification — explicitly out of scope this phase.
