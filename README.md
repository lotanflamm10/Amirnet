# AMIRNET Trainer

Independent AMIRNET (formerly AMIRAM) English preparation app for Israeli students.

> Not affiliated with NITE. Scores, simulations, and predictions are unofficial.

## Stack

- Next.js 16 App Router · TypeScript · Tailwind CSS v4
- localStorage progress (Supabase-ready architecture)
- Mock auth and mock billing

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Re-run vocab import

If you update `src/data/import/psychometric_vocab_he.txt`:

```bash
node src/data/import/run-vocab-import.mjs
```

Outputs:
- `src/data/seed/vocab.normalized.json` — 1,692 parsed entries
- `src/data/seed/vocab.import-report.json` — import statistics

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home / landing |
| `/app` | Student dashboard |
| `/practice` | Practice mode picker |
| `/practice/[mode]` | Practice session |
| `/simulation` | Simulation launcher |
| `/review` | Smart review queue |
| `/vocab` | Vocab hub |
| `/vocab/swipe` | Flashcard swipe |
| `/vocab/list` | Full vocab list |
| `/vocab/starred` | Starred words |
| `/vocab/weak` | Weak words |
| `/pricing` | Pricing page |
| `/account` | Account page |
| `/admin` | Admin dashboard |
| `/admin/vocab` | Vocab admin |
| `/admin/questions` | Question admin |
| `/legal/privacy` | Privacy policy |
| `/legal/terms` | Terms of use |

## Legacy prototype

Original vanilla JS prototype is preserved in `/legacy-prototype`. Do not delete.

## Disclaimer

Independent AMIRNET preparation tool. Not affiliated with NITE. Scores, simulations, and predictions are unofficial.
The vocabulary deck is based on user-provided study material and original enrichment. It is not an official NITE word list.
