# Phase 3 Batch D — Final Report

**Status:** Complete (NOT yet committed — paused at user's request).

## Headline numbers

| Metric | Before Batch D | After Batch D | Delta |
|---|---:|---:|---:|
| Scoped passages (Batch-D editable files) | 29 | 29 | — |
| Sim-eligible in scope | 6 (20.7%) | **26 (89.7%)** | **+20** |
| Pool-wide sim-eligible (incl. read-only families) | 43 | **63** | **+20** |
| Target | ≥60 | hit | ✓ |

Validator thresholds enforced (`src/lib/reading/passage-validator.ts`): ≥3 paragraphs ∧ ≥180 words ∧ ≥5 questions.

## What changed by group

All 20 planned passages successfully promoted to sim-eligibility; **zero reverts**.

### Group 1 (`r14, r33, r34, r35, r36`) — T1 paragraph polish
- `r14`: already 3 paragraphs / 179 words. Added a closing 28-word sentence (197 words total) tying the conclusion back to Seoul/Copenhagen examples. All 5 questions untouched.
- `r33, r34, r35, r36`: each already 5 questions / ≥186 words / 1 paragraph. Split each into 3 paragraphs at natural topic-shift boundaries via 2 surgical Edits per passage. No semantic edits, no question changes.

### Group 2 (`r37, r38, r39, r40, r41`) — T1 paragraph polish
- All five: ≥189 words / 1 paragraph / 5 questions → split into 3 paragraphs each.
- `r37` (Economics of Education), `r38` (Cognitive Load and Memory), `r39` (Psychology of Advertising), `r40` (How Oceans Store Carbon), `r41` (Rise of Citizen Science). No question changes; no body content changes beyond `\n\n` insertions.

### Group 3 (`r42, r43, r44, r13, r3`) — Mixed
- `r42, r43, r44, r13`: T1 paragraph polish — split into 3 paragraphs each. `r13` was already 2 paragraphs; one additional split inside the second paragraph. No question changes.
- `r3` (T2): full grow from 80 words / 1 paragraph / 2 questions → **315 words / 4 paragraphs / 5 questions**. Title preserved. Existing `r3-q1` and `r3-q2` preserved byte-for-byte. Added `r3-q3` (easy, vocab-in-context: "lock-in"), `r3-q4` (medium, inference: QWERTY/Edison principle), `r3-q5` (hard, paragraph-purpose: closing synthesis). Body extends original network-effects argument with QWERTY (Christopher Sholes, 1873; Dvorak 1936) and Edison vs Tesla (AC/DC current war) historical anchors per user Q2 guidance for T2 items.

### Group 4 (`r5, r6, r8, r9, r10`) — T2 full grow
All five: 80–103 words / 1 paragraph / 2 questions → **3 paragraphs each, 5 questions each**.

| Passage | Title | Words after | New named anchors (T2 guidance: natural fit only) |
|---|---|---:|---|
| `r5` | Ocean Acidification | 230 | Industrial Revolution; Great Barrier Reef |
| `r6` | The Paradox of Choice | 236 | Barry Schwartz / Swarthmore (already present); California jam experiment |
| `r8` | Urban Heat Islands | 241 | 2003 European heatwave (Paris, London); Singapore, Medellín |
| `r9` | The Limits of Multitasking | 231 | Stanford (heavy media multitasking research) |
| `r10` | The Role of Mistakes in Learning | 266 | Robert and Elizabeth Bjork (desirable difficulty) |

In every Group 4 passage: original 2 questions kept byte-for-byte; original semantic claims kept; r5–r10 q3 added (easy, vocab-in-context), q4 added (medium, inference), q5 added (hard, paragraph-purpose).

Bonus content fix in `r10`: the previous body contained UTF-8 mojibake (`Ã¢â‚¬â€` for em-dash) at two positions; the rewrite uses proper em-dashes throughout.

## Validation gates — all green after every group

| Gate | Baseline | Post-Batch-D |
|---|---|---|
| `npm run typecheck` | 0 errors | 0 errors |
| `npm run validate:questions` | 36 errors (synonymRec + antonymRec duplicate-stem baseline; reading clean) | 36 errors (same; reading still clean) |
| `npm run audit:passage-eligibility` | 6 scoped / 43 pool-wide | 26 scoped / **63 pool-wide** |
| `npm run audit:length-bias` | 142/202 (70.3%) | 142/202 (70.3%) — flat |
| `npm run audit:sc-amirnet` | 150/150 (100.0%) | 150/150 (100.0%) |

## Files touched (Batch D)

```
M src/data/seed/_gen_reading_a_part1.json   (r14, r13 — 3 Edits)
M src/data/seed/_gen_reading_b_part1.json   (r33–r38 — 12 Edits)
M src/data/seed/_gen_reading_b_part2.json   (r39–r44 — 12 Edits)
M src/data/seed/questions.json              (r3 + r5/r6/r8/r9/r10 — 1 body-replace Edit + 1 splice script + 1 splice script)
M qa-report/passage-eligibility-scan.md     (refreshed by audit script)
? qa-report/seed-backup-phase3/_gen_reading_a_part1.json   (pre-Batch-D backup)
? qa-report/seed-backup-phase3/_gen_reading_b_part1.json   (pre-Batch-D backup)
? qa-report/seed-backup-phase3/_gen_reading_b_part2.json   (pre-Batch-D backup)
```

`qa-report/seed-backup-phase3/questions.json` was **not** touched — the pre-Phase-3 original from Batch B is preserved as required by the handoff.

Two helper scripts in `.tmp/` (untracked, not for commit): `.tmp/insert-r3-questions.mjs`, `.tmp/group4-insert.mjs`. Pure string-level surgical inserts — no `JSON.parse → modify → JSON.stringify` round-tripping of the whole file (per Phase 3 contract).

## Carry-forward issues (do NOT fix this session — track for the user)

Verbatim from the handoff, plus three new items discovered during Batch D:

1. **questions_expanded.json category/key mismatches (12 items)** — surveyed during Batch C, report at `qa-report/category-key-mismatch.md`. Needs a focused mini-batch shaped like the wf107 relocation in Batch B. Recommended before Phase 4.
2. **Restatement length-bias residual** — 142 still-strict-longest restatement items remain in the pool after Batch C. A future content sweep could take another ~30 down.
3. **`_gen_reading_1..8.json` passages untouched** — most are 200–260 words / 1–2 paragraphs and could be promoted to sim-eligibility with a follow-up sweep if the +20 in Batch D isn't enough headroom. Currently 37 pool-wide eligible come from this family + `_sim_*` (unchanged this session).
4. **`PracticeSession.handleWritingComplete` no longer bumps streak/dailyGoal** (Phase 2 FIX 5 side-effect). If writing should count toward daily activity, a small new `recordWritingTaskParticipation()` helper is needed.
5. **DIFFICULTY_AUDIT.md §B.10 stale** — 15 of 18 truncation entries were pre-fixed by commit `5bbdcd1`. Audit doc needs its own ticket; not edited as part of Phase 3.
6. **NEW: r2, r4, r7 stubs remain practice-only** (intentional). All 3 are <80-word / 1-paragraph / 2-question legacy items in `questions.json`. Skipped per the +20 / +17-minimum plan to keep T2 scope manageable. A future micro-batch could promote them via the same recipe used in Group 4 (~30 min of work each).
7. **NEW: anchor-heuristic cosmetic gap for r9, r10, r13** — these passages are sim-eligible by validator (paragraphs/words/questions) but the `hasNamedAnchor` script still reports "no anchor" because their existing topical titles don't trigger the ≥2-consecutive-caps heuristic. The eligibility validator does not gate on anchor, so this is reporting noise, not a quality issue. No action needed unless the script's heuristic is later widened.
8. **NEW: `'` apostrophe escape inconsistency** — the original questions.json escapes apostrophes as `'`, while the new question objects added in Groups 3/4 use plain `'`. Both parse identically; this is purely a stylistic inconsistency. Could be normalised in a one-line sed in a future polish pass.

## Things I did NOT verify

- I did NOT run `npm run build` (per handoff — only at the end, and the user has paused before commit).
- I did NOT manually exercise the new reading passages through the simulation UI in a browser. The dev server is running on port 3000 (owned by another process), `daniel/daniel1908` login returns 200 OK with a session cookie, and typecheck + validate confirm the JSON loads and types match. But I cannot claim "user clicked through r5–r10 and saw correct rendering" — only "the data shape is correct and the loader sees it."
- I did NOT inspect Hebrew explanations because none of the original r2–r10 questions had `hebrewExplanation` fields, so the rewrite contract's "preserve existing hebrewExplanation byte-for-byte" was vacuously satisfied and no new Hebrew was authored.

## Next step the user asked me to NOT take

> "STOP at the final report, don't commit — you'll bundle Phase 3 Batches A/B/C/D into one commit after Batch D lands."

The working tree is staged-ready per the handoff's POST-BATCH-D COMMIT PLAN. When the user is ready to commit, the explicit `git add` list to use is:

```
package.json
scripts/length-bias-scan.mjs
scripts/scan-category-key-mismatch.mjs
scripts/passage-eligibility-scan.mjs
src/data/seed/_gen_para_a.json
src/data/seed/_gen_para_b.json
src/data/seed/_gen_reading_a_part1.json
src/data/seed/_gen_reading_b_part1.json
src/data/seed/_gen_reading_b_part2.json
src/data/seed/questions.json
qa-report/length-bias-scan.md
qa-report/category-key-mismatch.md
qa-report/passage-eligibility-scan.md
qa-report/sc-amirnet-composition.md
qa-report/phase3-batch-d-report.md
qa-report/seed-backup-phase3/_gen_para_a.json
qa-report/seed-backup-phase3/_gen_para_b.json
qa-report/seed-backup-phase3/_gen_reading_a_part1.json
qa-report/seed-backup-phase3/_gen_reading_b_part1.json
qa-report/seed-backup-phase3/_gen_reading_b_part2.json
tsconfig.tsbuildinfo
```

`.tmp/` and root `QA_AUDIT_REPORT.md` remain untracked, matching the session-start state.
