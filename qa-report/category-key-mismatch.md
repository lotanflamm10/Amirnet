# questions_expanded.json — category vs top-level key mismatch survey

Generated: 2026-05-31T08:48:45.414Z

The practice selector (`src/lib/practice/question-selector.ts`) pulls items by
their TOP-LEVEL key in the JSON. The `category` field on each item is metadata
only — a misclassified item still surfaces in the wrong practice mode unless it
is physically moved (see Phase 3 Batch B wf107 relocation for the canonical fix).

This file is a SURVEY only. No fixes applied.

## Aggregate

- Total items scanned: **1207**
- Items where `category` mismatches their top-level key: **12**

## Per-key breakdown

| top-level key | total items | mismatches |
|---|---:|---:|
| `sentenceCompletion` | 212 | 0 |
| `paraphrasing` | 214 | 12 |
| `grammar` | 114 | 0 |
| `wordFormation` | 113 | 0 |
| `reading` | 214 | 0 |
| `lectureQuestions` | 120 | 0 |
| `textCompletion` | 120 | 0 |
| `writingTask` | 100 | 0 |

## First 20 mismatches

| top-level key | item id | declared category | expected |
|---|---|---|---|
| `paraphrasing` | `px001` | `paraphrasing` | `restatements` |
| `paraphrasing` | `px002` | `paraphrasing` | `restatements` |
| `paraphrasing` | `px003` | `paraphrasing` | `restatements` |
| `paraphrasing` | `px004` | `paraphrasing` | `restatements` |
| `paraphrasing` | `px005` | `paraphrasing` | `restatements` |
| `paraphrasing` | `px006` | `paraphrasing` | `restatements` |
| `paraphrasing` | `px007` | `paraphrasing` | `restatements` |
| `paraphrasing` | `px008` | `paraphrasing` | `restatements` |
| `paraphrasing` | `px009` | `paraphrasing` | `restatements` |
| `paraphrasing` | `px010` | `paraphrasing` | `restatements` |
| `paraphrasing` | `px011` | `paraphrasing` | `restatements` |
| `paraphrasing` | `px012` | `paraphrasing` | `restatements` |

