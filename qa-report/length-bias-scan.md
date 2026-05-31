# Restatement length-bias scan

Generated: 2026-05-31T12:14:57.186Z

Definitions:
- **Strict longest**: correct answer is the single longest option (no ties).
- **Near-longest**: correct answer's word count >= max distractor - 1.
- **Gap**: correct length minus mean distractor length (positive = longer).

## Aggregate

- Total items scanned: **202**
- Strict-longest: **142** (70.3%)
- Near-longest:   **174** (86.1%)

## Per-file

| file | total | strict-longest | near-longest |
|---|---:|---:|---:|
| `src/data/seed/_gen_para_a.json` | 101 | 70 (69.3%) | 89 (88.1%) |
| `src/data/seed/_gen_para_b.json` | 101 | 72 (71.3%) | 85 (84.2%) |

## Worst 40 offenders (largest gap correct - mean distractor)

| # | id | file | difficulty | correct words | mean distractor | gap | ratio | strict? |
|---:|---|---|---|---:|---:|---:|---:|---|
| 1 | p98 | `_gen_para_a.json` | hard | 28 | 18.3 | 9.7 | 1.53 | yes |
| 2 | p122 | `_gen_para_b.json` | easy | 18 | 8.3 | 9.7 | 2.16 | yes |
| 3 | p86 | `_gen_para_a.json` | hard | 25 | 15.7 | 9.3 | 1.6 | yes |
| 4 | p151 | `_gen_para_b.json` | medium | 23 | 13.7 | 9.3 | 1.68 | yes |
| 5 | p190 | `_gen_para_b.json` | hard | 28 | 18.7 | 9.3 | 1.5 | yes |
| 6 | p211 | `_gen_para_b.json` | hard | 28 | 18.7 | 9.3 | 1.5 | yes |
| 7 | p46 | `_gen_para_a.json` | medium | 20 | 11 | 9 | 1.82 | yes |
| 8 | p96 | `_gen_para_a.json` | hard | 23 | 14 | 9 | 1.64 | yes |
| 9 | p140 | `_gen_para_b.json` | easy | 17 | 8 | 9 | 2.13 | yes |
| 10 | p195 | `_gen_para_b.json` | hard | 29 | 20 | 9 | 1.45 | yes |
| 11 | p79 | `_gen_para_a.json` | medium | 25 | 16.3 | 8.7 | 1.53 | no |
| 12 | p156 | `_gen_para_b.json` | medium | 20 | 11.3 | 8.7 | 1.76 | yes |
| 13 | p202 | `_gen_para_b.json` | hard | 26 | 17.3 | 8.7 | 1.5 | yes |
| 14 | p214 | `_gen_para_b.json` | hard | 26 | 17.3 | 8.7 | 1.5 | yes |
| 15 | p29 | `_gen_para_a.json` | easy | 18 | 9.7 | 8.3 | 1.86 | yes |
| 16 | p54 | `_gen_para_a.json` | medium | 21 | 12.7 | 8.3 | 1.66 | yes |
| 17 | p61 | `_gen_para_a.json` | medium | 20 | 11.7 | 8.3 | 1.71 | yes |
| 18 | p90 | `_gen_para_a.json` | hard | 29 | 20.7 | 8.3 | 1.4 | no |
| 19 | p175 | `_gen_para_b.json` | medium | 24 | 15.7 | 8.3 | 1.53 | no |
| 20 | p200 | `_gen_para_b.json` | hard | 28 | 19.7 | 8.3 | 1.42 | yes |
| 21 | p50 | `_gen_para_a.json` | medium | 21 | 13 | 8 | 1.62 | yes |
| 22 | p72 | `_gen_para_a.json` | medium | 22 | 14 | 8 | 1.57 | yes |
| 23 | p74 | `_gen_para_a.json` | medium | 20 | 12 | 8 | 1.67 | yes |
| 24 | p87 | `_gen_para_a.json` | hard | 22 | 14 | 8 | 1.57 | yes |
| 25 | p92 | `_gen_para_a.json` | hard | 25 | 17 | 8 | 1.47 | yes |
| 26 | p189 | `_gen_para_b.json` | hard | 26 | 18 | 8 | 1.44 | no |
| 27 | p37 | `_gen_para_a.json` | easy | 18 | 10.3 | 7.7 | 1.74 | yes |
| 28 | p78 | `_gen_para_a.json` | medium | 21 | 13.3 | 7.7 | 1.58 | yes |
| 29 | p81 | `_gen_para_a.json` | medium | 21 | 13.3 | 7.7 | 1.58 | yes |
| 30 | p106 | `_gen_para_a.json` | hard | 27 | 19.3 | 7.7 | 1.4 | yes |
| 31 | p107 | `_gen_para_a.json` | hard | 31 | 23.3 | 7.7 | 1.33 | no |
| 32 | p108 | `_gen_para_a.json` | hard | 27 | 19.3 | 7.7 | 1.4 | no |
| 33 | p112 | `_gen_para_a.json` | hard | 29 | 21.3 | 7.7 | 1.36 | no |
| 34 | p125 | `_gen_para_b.json` | easy | 17 | 9.3 | 7.7 | 1.82 | yes |
| 35 | p143 | `_gen_para_b.json` | easy | 23 | 15.3 | 7.7 | 1.5 | no |
| 36 | p191 | `_gen_para_b.json` | hard | 24 | 16.3 | 7.7 | 1.47 | yes |
| 37 | p198 | `_gen_para_b.json` | hard | 24 | 16.3 | 7.7 | 1.47 | yes |
| 38 | p203 | `_gen_para_b.json` | hard | 27 | 19.3 | 7.7 | 1.4 | yes |
| 39 | p21 | `_gen_para_a.json` | easy | 16 | 8.7 | 7.3 | 1.85 | yes |
| 40 | p85 | `_gen_para_a.json` | hard | 27 | 19.7 | 7.3 | 1.37 | no |

