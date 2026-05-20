# Project Context

This document is the permanent handoff for any future AI model or developer working on the **Amirnet Coach** codebase. Read this file first before making changes.

---

## 1. Project Overview

**Amirnet Coach** (`Amirnet Coach — המאמן האישי שלך לאמירנט`) is a self-study web app for Israeli students preparing for the **AMIRNET / AMIRAM** English psychometric exam. It is an independent prep tool — explicitly not affiliated with NITE.

The product is currently a frontend-only Next.js app. All progress, vocabulary state, and settings live in the browser's `localStorage`. There is no real backend, no real authentication, and no real billing — there is a mock plan/entitlement system instead.

The app's main goal is to give a student a personalized daily training plan, a vocabulary trainer, AMIRAM-style practice categories, full timed simulations, and a readiness/score-prediction widget.

The primary audience is **Hebrew-speaking** students; the UI is therefore primarily RTL Hebrew. English UI is supported as a secondary language and must look natural in LTR.

---

## 2. Tech Stack

- **Framework**: Next.js `16.2.4` (App Router) — see [package.json](package.json)
- **Runtime**: React `19.2.4`, React DOM `19.2.4`
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss` — there is **no `tailwind.config.*` file**; design tokens live in [src/app/globals.css](src/app/globals.css) under `:root` (dark) and `[data-theme="light"]` and are exposed to Tailwind through `@theme inline { ... }`
- **Icons**: `lucide-react` — centralized in [src/components/icons/NavIcons.tsx](src/components/icons/NavIcons.tsx)
- **Fonts**: `Plus_Jakarta_Sans` and `Rubik` via `next/font/google` (both Latin + Hebrew subsets)
- **State**:
  - React Context for `theme` and `language`
  - Plain functions over `localStorage` for everything else (progress, vocab review state, custom vocab, simulation history, practice history, question history)
- **Routing**: Next.js App Router (`src/app/**/page.tsx`)
- **No external backend**, no API calls, no DB
- **Test/QA**: Playwright + `tsx` for an in-house QA agent (`qa-agent/`)
- **Linting**: ESLint 9 with `eslint-config-next`
- **Build scripts**: `dev`, `build`, `start`, `lint`, `typecheck`, `qa:amirnet:*`, `validate:questions`

Important: **Do not add new dependencies** unless explicitly approved.

---

## 3. Folder Structure

```
C:\Lotan\amirnet\
├─ src\
│  ├─ app\                          ← Next.js App Router pages
│  │  ├─ layout.tsx                 ← Root layout (theme + lang providers + AppShell)
│  │  ├─ page.tsx                   ← Marketing homepage
│  │  ├─ globals.css                ← Design tokens + RTL/LTR layout rules
│  │  ├─ app\page.tsx               ← Dashboard ("/app")
│  │  ├─ account\page.tsx
│  │  ├─ practice\page.tsx + [mode]\page.tsx
│  │  ├─ vocab\(swipe|list|missed|starred|weak|custom)\page.tsx
│  │  ├─ simulation, diagnostic, challenge, review, learning-engine\
│  │  ├─ pricing, admin\
│  │  └─ legal\(privacy|terms)\
│  ├─ components\
│  │  ├─ brand\BrandMark.tsx        ← Reusable logo + "Amirnet Coach" wordmark
│  │  ├─ icons\NavIcons.tsx         ← Centralized Lucide icon registry
│  │  ├─ layout\AppShell.tsx        ← Wraps the entire app, picks dir from lang
│  │  ├─ layout\Sidebar.tsx         ← Desktop sidebar (≥ lg)
│  │  ├─ layout\BottomTabBar.tsx    ← Mobile bottom nav (< lg)
│  │  ├─ layout\AppFooter.tsx
│  │  ├─ dashboard\*                ← Dashboard widgets
│  │  ├─ vocab\*                    ← Vocab swipe trainer, lists, filters
│  │  ├─ practice\*                 ← Practice session UI
│  │  ├─ simulation\*               ← Full simulation runner
│  │  ├─ diagnostic\, learning-engine\, challenge\
│  ├─ contexts\
│  │  ├─ LanguageContext.tsx        ← he / en + dom dir/lang sync
│  │  └─ ThemeContext.tsx           ← dark / light / system + accent + bg hue
│  ├─ lib\
│  │  ├─ i18n\translations.ts       ← Translations (partial)
│  │  ├─ analytics\daily-plan.ts    ← Daily plan generator
│  │  ├─ analytics\mastery-engine.ts
│  │  ├─ vocab\(vocab-store|custom-vocab-store|spaced-repetition|...).ts
│  │  ├─ practice\(question-selector|practice-engine|scoring|question-history).ts
│  │  ├─ progress\local-progress-store.ts
│  │  ├─ simulation\*, scoring\*, gamification\xp-system.ts
│  │  ├─ billing\*                  ← Mock plans + placeholder Stripe / Cardcom / PayPlus
│  │  ├─ auth\mock-auth.ts
│  │  └─ entitlements.ts
│  ├─ data\seed\                    ← Large seed JSON for vocab + questions
│  │  ├─ vocab.normalized.json      ← ~2600+ vocab items
│  │  ├─ questions.json, questions_expanded.json, hard_questions_addon.json
│  │  ├─ skill_booster_questions.json
│  │  ├─ _gen_reading_1..8.json     ← Reading passages + their questions
│  │  ├─ _gen_lecture_*, _gen_tc_*, _gen_sc_*, _gen_para_*, _gen_wf_*, _gen_grammar.json
│  │  ├─ diagnostic-questions.json, simulation-config.json
│  │  └─ exam-info.json, exam-strategies.json, learningTips.ts
│  ├─ types\(vocab|questions|progress|billing|learning).ts
│  └─ middleware.ts
├─ scripts\                          ← Validators / migrators
├─ qa-agent\, qa-report\             ← Playwright-driven QA harness
├─ public\, node_modules\, .next\
└─ package.json
```

**Do NOT touch** unless explicitly asked: `legacy-prototype/**`, root `index.html` / `script.js` / `style.css`, `node_modules`, `.next`, `qa-report`, `qa-agent`, `scripts`, and the large seed JSON files under `src/data/seed/**` (treat as read-only data).

---

## 4. Main User Flows

### Vocabulary Learning ("vocab swipe")
- Entry: [/vocab](src/app/vocab/page.tsx) → [/vocab/swipe](src/app/vocab/swipe/page.tsx)
- Component: [VocabSwipeTrainer](src/components/vocab/VocabSwipeTrainer.tsx)
- Pool built by `buildPool()` from `vocab.normalized.json` + custom items, with filters (difficulty, status, card type)
- Session size is hardcoded to `SESSION_SIZE = 20` at [VocabSwipeTrainer.tsx:28](src/components/vocab/VocabSwipeTrainer.tsx#L28) — **this is what needs to drop to 10 per day** (see §8)
- Each card → user marks "knew it" / "review again" → spaced-repetition state updates via [vocab-store.ts](src/lib/vocab/vocab-store.ts)

### Vocabulary Review (review queue)
- Same component, filtered by `status="due"` (`getDueItems`) — uses spaced-repetition `nextReviewAt`
- Lists also exist at `/vocab/missed`, `/vocab/starred`, `/vocab/weak`

### Reading Comprehension
- Mode key: `"reading"`
- Questions live in `src/data/seed/_gen_reading_1..8.json` (and a few related files)
- **Each question already carries an embedded `passage: { id, title, body }` object** ([types/questions.ts:62-67](src/types/questions.ts#L62-L67)); `body` contains `\n\n`-separated paragraphs (multi-paragraph passages already exist)
- BUT the practice flow ([PracticeSession.tsx](src/components/practice/PracticeSession.tsx)) selects 20 random reading questions across all passages — it does **not** group 5 questions belonging to the same passage. This is the gap that must be fixed (see §8).

### Academic Phrases
- Skill-booster mode key: `"academicPhrase"` → pulls from `skill_booster_questions.json`
- Configured in [question-selector.ts](src/lib/practice/question-selector.ts) (`SKILL_BOOSTER_KEYS`)

### Mixed Practice
- Mode key: `"mixed"`
- Weighted blend of core categories + skill boosters — see `MIXED_WEIGHTS` / `MIXED_BOOSTER_KEYS` in [question-selector.ts](src/lib/practice/question-selector.ts)

### Dashboard
- Route: [/app](src/app/app/page.tsx)
- Render order: greeting → diagnostic CTA (if not completed) → `ReadinessWidget` → `XPBar` → `TodaysTraining` → `DashboardStats` → vocab/sim mini cards → `WeakAreas` → `RecommendedActivity`

### User Progress
- Single `UserProgress` object kept in `localStorage` under `amirnet-progress-v1` (see §7)
- Daily goal: `dailyGoal.targetQuestions` (default 20), `questionsAnsweredToday`, resets at midnight by date string
- Streak, XP, level, estimated score, simulation history, per-category accuracy, weakness profile, diagnostic state

### Language Switching
- Globe button in the sidebar (`toggleLang`) → flips `lang` between `"he"` and `"en"` → persisted to `localStorage`, and `document.documentElement.lang` + `.dir` are updated synchronously. See [LanguageContext.tsx](src/contexts/LanguageContext.tsx).

---

## 5. UI Direction and Language System

### Source of truth
- `LanguageProvider` ([src/contexts/LanguageContext.tsx](src/contexts/LanguageContext.tsx))
- `lang: "he" | "en"` is stored in `localStorage` under key **`amirnet-lang`** (default `"he"`)
- `applyLangToDom(lang)` writes:
  - `document.documentElement.lang = lang`
  - `document.documentElement.dir = lang === "he" ? "rtl" : "ltr"`
- Components get text via `const { t, lang, toggle } = useLang()`

### Translations
- File: [src/lib/i18n/translations.ts](src/lib/i18n/translations.ts)
- Exports `he` and `en` of type `Translations` covering: `nav`, `home`, `practice`, `vocab`, `simulation`, `dashboard`, `common`
- **Coverage is partial** — many components contain hardcoded Hebrew strings (see §9).

### Sidebar position (already implemented)
[src/app/globals.css](src/app/globals.css) (around the "RTL / layout" block):

```css
/* Default: sidebar on the RIGHT for Hebrew RTL */
.sidebar-nav { right: 0; left: auto; border-left: 1px solid var(--line); border-right: none; }
/* English LTR: flip sidebar to the LEFT */
[dir="ltr"] .sidebar-nav { left: 0; right: auto; border-left: none; border-right: 1px solid var(--line); }

.content-area { direction: ltr; } /* keeps the flex shell stable; <main dir=...> re-applies per-language direction */

@media (min-width: 1024px) {
  .content-area              { margin-right: 16rem; margin-left: 0; }
  [dir="ltr"] .content-area  { margin-left: 16rem; margin-right: 0; }
}
```

`AppShell` ([src/components/layout/AppShell.tsx](src/components/layout/AppShell.tsx)) reads `lang` from `useLang()` and passes `dir={lang === "he" ? "rtl" : "ltr"}` to `<main>` and the footer wrapper.

### Rules going forward
- **Never hardcode left/right positioning** in component styles for shell-level layout. Use `[dir="ltr"] ...` overrides in `globals.css`, or CSS logical properties (`margin-inline-start`, `border-inline-end`, `inset-inline-start`).
- Inline styles inside components that use `left`/`right`/`margin-left`/etc are usually fine when the same element flips visually under RTL — but think before adding them.

---

## 6. Important UI Components

| Concern | File |
|---|---|
| App shell (wraps every route) | [src/components/layout/AppShell.tsx](src/components/layout/AppShell.tsx) |
| Desktop sidebar (≥ lg) | [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx) |
| Mobile bottom tabs (< lg) | [src/components/layout/BottomTabBar.tsx](src/components/layout/BottomTabBar.tsx) |
| Footer | [src/components/layout/AppFooter.tsx](src/components/layout/AppFooter.tsx) |
| Brand mark / logo | [src/components/brand/BrandMark.tsx](src/components/brand/BrandMark.tsx) |
| Icon registry (Lucide) | [src/components/icons/NavIcons.tsx](src/components/icons/NavIcons.tsx) |
| Dashboard page | [src/app/app/page.tsx](src/app/app/page.tsx) |
| Daily plan card ("תוכנית האימון של היום") | [src/components/dashboard/TodaysTraining.tsx](src/components/dashboard/TodaysTraining.tsx) |
| Daily plan generator | [src/lib/analytics/daily-plan.ts](src/lib/analytics/daily-plan.ts) |
| Stats grid | [src/components/dashboard/DashboardStats.tsx](src/components/dashboard/DashboardStats.tsx) |
| Readiness / score prediction | [src/components/dashboard/ReadinessWidget.tsx](src/components/dashboard/ReadinessWidget.tsx) |
| XP / level bar | [src/components/dashboard/XPBar.tsx](src/components/dashboard/XPBar.tsx) |
| Weak categories | [src/components/dashboard/WeakAreas.tsx](src/components/dashboard/WeakAreas.tsx) |
| Recommended activity card | [src/components/dashboard/RecommendedActivity.tsx](src/components/dashboard/RecommendedActivity.tsx) |
| Vocab due mini widget | [src/components/dashboard/VocabDueWidget.tsx](src/components/dashboard/VocabDueWidget.tsx) |
| Simulation history mini widget | [src/components/dashboard/SimulationHistoryWidget.tsx](src/components/dashboard/SimulationHistoryWidget.tsx) |
| Vocab swipe trainer | [src/components/vocab/VocabSwipeTrainer.tsx](src/components/vocab/VocabSwipeTrainer.tsx) |
| Single vocab card | [src/components/vocab/SwipeCard.tsx](src/components/vocab/SwipeCard.tsx) |
| Practice session shell | [src/components/practice/PracticeSession.tsx](src/components/practice/PracticeSession.tsx) |
| Question card (incl. reading) | [src/components/practice/QuestionCard.tsx](src/components/practice/QuestionCard.tsx) |
| Language selector | Globe button in [Sidebar.tsx](src/components/layout/Sidebar.tsx) — calls `toggleLang` from `LanguageContext` |
| Theme selector | Cycle button in [Sidebar.tsx](src/components/layout/Sidebar.tsx) — calls `toggleTheme` from `ThemeContext` |

---

## 7. Data and State

All state is browser-local. The relevant `localStorage` keys:

| Key | Owner | Shape |
|---|---|---|
| `amirnet-progress-v1` | [local-progress-store.ts](src/lib/progress/local-progress-store.ts) | `UserProgress` (streak, dailyGoal, totals, categoryProgress, simulationHistory, xp, level, achievements, diagnostic state) |
| `amirnet-vocab-v1` | [vocab-store.ts](src/lib/vocab/vocab-store.ts) | `Record<itemId, VocabReviewState>` (mastery, timesSeen/Known/Missed, nextReviewAt, starred) |
| `amirnet-custom-vocab-v1` (approx) | [custom-vocab-store.ts](src/lib/vocab/custom-vocab-store.ts) | User-imported vocab items merged with seed |
| `amirnet-lang` | [LanguageContext.tsx](src/contexts/LanguageContext.tsx) | `"he" \| "en"` |
| `amirnet-theme-settings-v1` | [ThemeContext.tsx](src/contexts/ThemeContext.tsx) | `{ mode, primary, bgHue }` |
| `amirnet-theme` | legacy mirror used by the inline boot script in [layout.tsx](src/app/layout.tsx) | `"dark" \| "light"` (effective mode only) |
| Question history keys | [question-history.ts](src/lib/practice/question-history.ts) | recent ids, sentence hashes, practice/sim seen |

**Mock business logic** (no real auth/billing):
- Plan & entitlements: [src/lib/entitlements.ts](src/lib/entitlements.ts), [src/lib/billing/*](src/lib/billing/)
- Mock auth: [src/lib/auth/mock-auth.ts](src/lib/auth/mock-auth.ts)

**Seed/static data** (do not modify casually): everything under [src/data/seed/](src/data/seed/).

There is **no unknown-words store yet** and **no instant-translation feature yet** — both must be created (see §8).

---

## 8. Current Required Product Changes

### 8.1 Daily Vocabulary — only 10 words/day

**Current state**:
- [VocabSwipeTrainer.tsx:28](src/components/vocab/VocabSwipeTrainer.tsx#L28): `const SESSION_SIZE = 20;`
- [daily-plan.ts:48-54](src/lib/analytics/daily-plan.ts#L48-L54): vocab item `count: Math.min(20, Math.max(10, vocabDueCount))` — minimum 10 but currently goes up to 20.
- [VocabDueWidget.tsx](src/components/dashboard/VocabDueWidget.tsx) shows `dueCount` (could be thousands) and a CTA that says "חזור על {dueCount} מילים".

**Required behavior**:
- The daily vocabulary task must expose **exactly 10 words per day**, regardless of how many are due.
- The total pending count (e.g., 2661) may still appear as a stat / progress info, but the **action button** for today must say "10 מילים להיום" / "Learn today's 10 words" — never "review 2661 words".
- Centralize the constant (e.g., `DAILY_VOCAB_LIMIT = 10`) in one place — probably a new `src/lib/vocab/daily-vocab.ts` or inside `vocab-store.ts` — and read it from all callers.

### 8.2 Dashboard task cards must be fully clickable

**Current state**: [TodaysTraining.tsx](src/components/dashboard/TodaysTraining.tsx) renders each plan row as a `<div>` with a small `<Link>` arrow at the end. Only the arrow is clickable.

**Required behavior**:
- The whole row navigates to `item.href` on click and on Enter/Space.
- `cursor: pointer`, hover state (border or background lift), visible focus ring.
- Keep the arrow visible.
- Avoid nested-interactive issues: wrap the row in a single `<Link>` (no inner button), or use a `<div role="button" tabIndex={0}>` that fires `router.push`. Same applies to similar cards on the dashboard (`RecommendedActivity`, the vocab/sim mini cards).

### 8.3 Unknown-words bank

**Current state**: No such store. Vocab review state in `amirnet-vocab-v1` tracks mastery, but does not separately model "I marked this word as unknown while reading a passage".

**Required behavior**:
- New store, e.g. `src/lib/vocab/unknown-words-store.ts`, key `amirnet-unknown-words-v1`.
- Shape per entry:
  ```ts
  interface UnknownWord {
    id: string;                 // word key (lowercased + normalized)
    word: string;
    translation: string;
    source: "reading" | "vocab" | "practice" | "academicPhrase" | "manual";
    addedAt: string;            // ISO timestamp
    status: "unknown" | "known";
    reviewCount: number;
  }
  ```
- API: `addUnknownWord(partial)`, `markKnown(id)`, `removeUnknownWord(id)`, `listUnknownWords()`, dedupe by `id`.
- UI to review the list (a new vocab sub-page or an extension of `/vocab`).

### 8.4 Instant Hebrew translation on word/phrase selection

**Required behavior**:
- When the user **clicks** a single English word, or **selects** a phrase (mouseup/keyboardup with non-empty selection), show a small popup near the selection.
- Popup actions:
  1. **Translate to Hebrew** — show translation.
  2. **Add to "words I don't know"** — saves to the unknown-words store.
  3. **Mark as known** — saves with `status: "known"`.
- Translation source: first try the seed vocab dictionary (`vocab.normalized.json` has `word` + `hebrewTranslation`). For phrases or unknown words, fall back to a placeholder string like `"(תרגום לא זמין)"` for now — **do not call an external translation API** without approval.
- Popup must not break native selection (`pointer-events: none` until rendered; close on outside click).
- Especially useful inside reading-comprehension passages.

### 8.5 Reading comprehension — Amir/Amiram style

**Current state**:
- Questions have a `passage` field already populated with multi-paragraph text (`body: "...para1...\n\npara2..."`) — see [_gen_reading_1.json](src/data/seed/_gen_reading_1.json).
- BUT the practice selector treats each reading question independently. A 20-question session will mix questions from many different passages.

**Required behavior**:
- A reading-comprehension session is one (or more) **full passages**, each with **exactly 5 questions** about that passage.
- Questions should span: main idea, detail, inference, vocabulary in context, author purpose / paragraph relationship.
- Implementation sketch: group questions by `passage.id` in the seed, build a passage index (`Map<passageId, Question[]>`), and write a `selectReadingPassage()` function that returns the 5 questions belonging to one passage at a time. Render passage once, then iterate questions.
- Update the dashboard daily plan vocabulary labels accordingly:
  - HE: `הבנת הנקרא — 5 שאלות על קטע מלא` (subtitle: `קטע עם כמה פסקאות`)
  - EN: `Reading Comprehension — 5 questions on a full passage` (subtitle: `Multi-paragraph passage`)

### 8.6 English UI = proper LTR

The CSS rules for the sidebar/content-area flip are already in [globals.css](src/app/globals.css) (see §5). Remaining work:
- Audit components that hardcode Hebrew strings (see §9) and route them through `useLang()` / `translations.ts`.
- Audit components for hardcoded `marginRight` / `paddingRight` / `right:` inline styles that should flip — replace with logical properties (`marginInlineEnd`, `paddingInlineEnd`, `insetInlineEnd`) where possible.
- Verify icons that imply direction (`ArrowLeft` / `ArrowRight`) use the existing `isRtl` pattern from `TodaysTraining.tsx`.

### 8.7 Hebrew UI

Must remain visually identical to today. The guardrail: keep the **default** (no `[dir="ltr"]` selector) styles exactly as Hebrew currently renders, and add **LTR overrides** only.

---

## 9. Known Issues and Risks

1. **Translations are only partial.** [translations.ts](src/lib/i18n/translations.ts) covers `nav`, `home`, `practice`, `vocab`, `simulation`, `dashboard.greeting` etc. — but many components still hardcode Hebrew strings. Examples:
   - [TodaysTraining.tsx:42-43](src/components/dashboard/TodaysTraining.tsx#L42-L43): `"תוכנית האימון של היום"`, `"פעולות"`
   - [TodaysTraining.tsx:49,74](src/components/dashboard/TodaysTraining.tsx#L49): `"התקדמות"`, `"מילים" / "שאלות"`
   - [daily-plan.ts](src/lib/analytics/daily-plan.ts): all `label`, `reason`, `CATEGORY_LABELS`, `CATEGORY_TO_BOOSTER` strings
   - [WeakAreas.tsx](src/components/dashboard/WeakAreas.tsx): `CAT_LABELS` is Hebrew-only
   - Dashboard greeting in [src/app/app/page.tsx](src/app/app/page.tsx)
   → In English mode, these still render in Hebrew.

2. **Daily vocabulary count is 20, not 10** ([VocabSwipeTrainer.tsx:28](src/components/vocab/VocabSwipeTrainer.tsx#L28) and [daily-plan.ts:50](src/lib/analytics/daily-plan.ts#L50)).

3. **Reading practice does not group questions by passage** — 5-question-per-passage flow does not exist; selector shuffles questions individually. See [question-selector.ts](src/lib/practice/question-selector.ts).

4. **Task cards are not fully clickable** — only the arrow is a `<Link>` in [TodaysTraining.tsx](src/components/dashboard/TodaysTraining.tsx).

5. **No unknown-words store, no translation popup.**

6. **Daily goal default is 20** but the user-facing daily vocab task is currently up to 20 too — be careful that adjustments to vocab count don't accidentally change `dailyGoal.targetQuestions` (which is used for the progress bar in `DashboardStats`).

7. **Inline bootstrap script** in [layout.tsx](src/app/layout.tsx) hand-rewrites design tokens before React hydrates to avoid theme flash. It also reads `amirnet-theme-settings-v1` and `amirnet-theme`. Touch with care — a syntax error here breaks the whole app on first load.

8. **No tests** for the dashboard / daily plan logic. The `qa-agent/` Playwright harness exists but is heavy.

9. **Sidebar nav active state** uses `borderRight: "2px solid var(--teal)"` ([Sidebar.tsx:124](src/components/layout/Sidebar.tsx#L124)) — physical property. In LTR mode the indicator stays on the right side of the link which may look slightly off. Consider switching to `borderInlineEnd`.

10. **The seed JSON in `src/data/seed/` is the source of truth** for vocab and questions. Do not regenerate or rewrite from inside the app; treat as immutable.

---

## 10. Recommended Implementation Plan

Do the work in **small, independently shippable batches**. Run `npm run typecheck` after each batch.

### Batch A — Daily vocab limit (smallest, highest value)
1. Create `src/lib/vocab/daily-vocab.ts` exporting `export const DAILY_VOCAB_LIMIT = 10;` and a helper `getDailyVocabPool(allItems): VocabItem[]` that uses `getDueItems(allItems, DAILY_VOCAB_LIMIT)` and falls back to study-priority order if fewer than 10 are due.
2. Use `DAILY_VOCAB_LIMIT` in:
   - `VocabSwipeTrainer.tsx` (replace `SESSION_SIZE = 20` for the daily flow; keep larger sessions only behind the "browse all" filter if needed).
   - `daily-plan.ts` (vocab item `count`).
   - `VocabDueWidget.tsx` CTA text.
3. Show the *total pending* number as a small stat ("2,661 מילים ממתינות סה״כ"), but the action is "10 מילים להיום".

### Batch B — Make dashboard cards fully clickable
1. In `TodaysTraining.tsx`, wrap each plan row in a single `<Link>` (no inner button). Remove the inner `<Link>` arrow — keep just an `<ArrowIcon>` as decoration.
2. Add `cursor: pointer`, hover (border color → teal, slight lift), and `:focus-visible` outline.
3. Apply the same pattern to `RecommendedActivity`, `VocabDueWidget`, `SimulationHistoryWidget` rows.

### Batch C — Reading-comprehension passage grouping
1. Add `src/lib/reading/reading-passages.ts` that builds, at module load, a `Map<passageId, { passage, questions: Question[] }>` from all reading JSON files.
2. Add `selectReadingPassage(seenPassageIds): { passage, questions }` returning one passage and its 5 questions.
3. Create a new practice mode for reading that uses this selector (or branch inside `PracticeSession` when `mode === "reading"`).
4. Update labels in `daily-plan.ts` and dashboard widgets to say "5 questions on a full passage" / "5 שאלות על קטע מלא".

### Batch D — Unknown-words store
1. Create `src/lib/vocab/unknown-words-store.ts` with the API in §8.3, key `amirnet-unknown-words-v1`.
2. Create a small `<UnknownWordsList>` component and a `/vocab/unknown` page (or a tab in `/vocab`).
3. Wire to existing `markMissed`-style flow where it makes sense, but keep them separate stores.

### Batch E — Selection-translation popup
1. Create `src/components/reading/SelectionTranslator.tsx`.
2. Mount it inside the reading-comprehension passage component; bind to `mouseup` / `keyup` on the passage container.
3. Look up translation from the seed vocab dictionary by normalized word; for phrases, look up each word; for misses, show `"(תרגום לא זמין)"`.
4. Popup actions: Translate / Add to unknown / Mark known — last two write to the unknown-words store.

### Batch F — i18n cleanup
1. Extend `translations.ts` with the missing keys (`dashboard.todaysTraining`, `dashboard.progress`, action counts, etc.).
2. Replace hardcoded Hebrew strings in dashboard widgets and `daily-plan.ts` labels with `t.*` lookups (pass `t` into `daily-plan.ts` if needed, or move labels into the component).
3. Audit `right:` / `left:` / `marginRight:` / `marginLeft:` inline styles in dashboard components and switch to logical properties where direction-dependent.

### Batch G — Polish & QA
1. `npm run typecheck`, `npm run lint`.
2. Manually test the app in both Hebrew (RTL) and English (LTR), desktop and mobile widths.
3. Verify: card hover/focus, daily plan shows "10", reading shows 1 passage / 5 questions, popup works, unknown list works.
4. Only if explicitly asked: `npm run build`.

---

## 11. Most Relevant Files

Inspect these first in any future session:

| File | Why |
|---|---|
| [src/contexts/LanguageContext.tsx](src/contexts/LanguageContext.tsx) | Source of truth for `lang` + DOM `dir/lang` sync. |
| [src/contexts/ThemeContext.tsx](src/contexts/ThemeContext.tsx) | Theme + accent color + bg hue. Effective dark/light resolution. |
| [src/lib/i18n/translations.ts](src/lib/i18n/translations.ts) | All i18n keys — extend here, do not scatter strings. |
| [src/app/layout.tsx](src/app/layout.tsx) | Inline pre-hydration theme bootstrap. Touch carefully. |
| [src/app/globals.css](src/app/globals.css) | Design tokens + RTL/LTR sidebar/content-area rules. |
| [src/components/layout/AppShell.tsx](src/components/layout/AppShell.tsx) | Wires `dir` from `lang` onto `<main>`. |
| [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx) | Desktop nav; theme/lang controls; color sliders. |
| [src/components/layout/BottomTabBar.tsx](src/components/layout/BottomTabBar.tsx) | Mobile nav. |
| [src/components/dashboard/TodaysTraining.tsx](src/components/dashboard/TodaysTraining.tsx) | The daily plan card — needs full-card click + i18n. |
| [src/lib/analytics/daily-plan.ts](src/lib/analytics/daily-plan.ts) | Daily plan generator — vocab count lives here. |
| [src/components/vocab/VocabSwipeTrainer.tsx](src/components/vocab/VocabSwipeTrainer.tsx) | `SESSION_SIZE = 20` — must become daily-aware. |
| [src/lib/vocab/vocab-store.ts](src/lib/vocab/vocab-store.ts) | Spaced-repetition state. |
| [src/lib/vocab/spaced-repetition.ts](src/lib/vocab/spaced-repetition.ts) | SRS scheduler. |
| [src/lib/progress/local-progress-store.ts](src/lib/progress/local-progress-store.ts) | `UserProgress` shape + persistence. |
| [src/lib/practice/question-selector.ts](src/lib/practice/question-selector.ts) | Where reading-grouped-by-passage logic must live. |
| [src/components/practice/PracticeSession.tsx](src/components/practice/PracticeSession.tsx) | Practice flow — branch reading mode here. |
| [src/types/questions.ts](src/types/questions.ts) | `Question`, `ReadingPassage`. |
| [src/data/seed/_gen_reading_*.json](src/data/seed/) | Reading passages + questions (already multi-paragraph). |
| [src/components/dashboard/VocabDueWidget.tsx](src/components/dashboard/VocabDueWidget.tsx) | Vocab CTA — must say "10 today". |
| [src/components/dashboard/RecommendedActivity.tsx](src/components/dashboard/RecommendedActivity.tsx) | Another card that must be fully clickable. |

---

## 12. Rules for Future AI Sessions

1. **Always read this file first.** Do not start coding without it.
2. **Do not make random UI changes** without checking the existing design tokens in [globals.css](src/app/globals.css) (`--teal`, `--ink`, `--surface`, `--canvas`, `--raised`, `--line`, `--ink-soft`, `--ink-muted`, `--success`, `--warn`, `--danger`, etc.). Use these — do not introduce ad-hoc hex values.
3. **Keep Hebrew RTL and English LTR behavior cleanly separated.** The default CSS = Hebrew. LTR is added via `[dir="ltr"]` overrides or logical properties. Never break Hebrew while fixing English.
4. **Keep the app modern, clean, professional.** No emojis in UI surfaces — use `lucide-react` icons via [NavIcons.tsx](src/components/icons/NavIcons.tsx). Match existing card padding/border/shadow conventions.
5. **When changing logic, update all related labels, counts, and UI states.** If you change the daily vocab count to 10, update: the swipe trainer, the daily-plan generator, the dashboard widget CTA, the homepage feature copy if applicable, and translations.
6. **Do not break existing Hebrew behavior while fixing English.** Verify both locales after every batch.
7. **Prefer centralized direction, translation, and daily-task logic** over scattered hardcoded fixes. New constants like `DAILY_VOCAB_LIMIT`, `READING_QUESTIONS_PER_PASSAGE`, etc., go in their respective `lib/` modules and are imported.
8. **Do not add new npm dependencies** without explicit approval. `lucide-react`, `clsx`, `tailwind-merge` are already available.
9. **Do not modify the seed data** in `src/data/seed/**`.
10. **Do not touch** the legacy prototype at the project root (`index.html`, `script.js`, `style.css`) or the `qa-agent/` / `qa-report/` directories unless the user explicitly asks.
11. **Run `npm run typecheck`** before declaring work done. Only run `npm run build` / `npm run lint` if asked or if the change is large.
12. **Avoid backwards-compatibility shims** for code paths that don't exist yet (this is a frontend-only app with localStorage — there is no production data migration concern).
13. **Commit messages and PRs** are out of scope unless explicitly requested.
