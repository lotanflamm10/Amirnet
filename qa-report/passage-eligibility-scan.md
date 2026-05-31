# Reading-passage eligibility scan (Phase 3 Batch D)

Generated: 2026-05-31T12:14:56.587Z

Thresholds (from `src/lib/reading/passage-validator.ts`):
- ≥ 3 paragraphs
- ≥ 180 words
- ≥ 5 questions

## Aggregate — Batch D scoped files

Files: `questions.json`, `_gen_reading_a_part1.json`, `_gen_reading_b_part1.json`, `_gen_reading_b_part2.json`

- Unique passages in scope: **29**
- Sim-eligible: **26** (89.7%)
- Near-eligible (fails exactly 1 threshold): **0**

## Pool-wide eligible count (for context — includes read-only families)

- Scoped eligible: 26
- Context eligible (\_gen\_reading\_1..8 + \_sim\_*): 37
- **Pool-wide total: 63**

## Per-file breakdown (scoped)

| file | unique passages | eligible | near-eligible |
|---|---:|---:|---:|
| `questions.json` | 10 | 7 | 0 |
| `_gen_reading_a_part1.json` | 7 | 7 | 0 |
| `_gen_reading_b_part1.json` | 6 | 6 | 0 |
| `_gen_reading_b_part2.json` | 6 | 6 | 0 |

## Top 30 growth candidates

Ranking favours: anchor-already-present + near-eligible + larger base material.

| # | id | file | words | paragraphs | questions | anchor? | suggested anchor |
|---:|---|---|---:|---:|---:|---|---|
| 1 | `r2-passage` | `questions.json` | 79 | 1 | 2 | yes | present (generic) |
| 2 | `r7-passage` | `questions.json` | 78 | 1 | 2 | yes | present (generic) |
| 3 | `r4-passage` | `questions.json` | 77 | 1 | 2 | yes | present (generic) |

