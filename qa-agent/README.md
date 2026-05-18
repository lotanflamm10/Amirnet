# AMIRNET Autonomous QA Agent

A serious, autonomous Playwright-based QA agent for the AMIRNET Hebrew RTL exam-prep app. Behaves like a real student: explores all screens, practices questions, trains vocabulary, tracks repetition, and generates a professional QA report.

---

## Why `playwright` (bare) over `@playwright/test`

This agent uses the bare `playwright` library instead of `@playwright/test` because:

1. **Stateful autonomous crawler** — The agent carries `StudentMemory` across all 22+ routes. `@playwright/test` isolates each test in its own context, which fights our stateful architecture.
2. **Returning-student mode** — We programmatically inject previous session data into `localStorage` via `context.addInitScript()`. This is cleanest with direct browser context control.
3. **Custom report** — We generate a custom markdown + JSON report. The `@playwright/test` HTML reporter is redundant overhead.
4. **Sequential by design** — The agent explores routes in a deterministic priority order. `@playwright/test` parallelizes by default.
5. **Full tracing available** — `context.tracing.start/stop()` works without the test runner.

---

## Prerequisites

1. **Node.js 18+** installed
2. **AMIRNET app running** at `http://localhost:3000`:
   ```
   cd C:\Lotan\amirnet
   npm run dev
   ```
3. **Dependencies installed**:
   ```
   npm install
   npx playwright install chromium
   ```

---

## Quick Start

```
# Terminal 1 — start the app
cd C:\Lotan\amirnet
npm run dev

# Terminal 2 — run QA agent (fresh student, headless)
npm run qa:amirnet
```

---

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run qa:amirnet` | Full QA run, fresh student, headless |
| `npm run qa:amirnet:headed` | Fresh student, headed browser (you can watch) |
| `npm run qa:amirnet:debug` | Headed + slowMo 400ms, verbose output |
| `npm run qa:amirnet:returning` | Returning student mode (uses previous results) |
| `npm run qa:amirnet:report` | Print path to the latest QA report |

### Combining Flags

All flags are additive when running the script directly:
```
tsx qa-agent/runner.ts --returning --headed
tsx qa-agent/runner.ts --debug
```

---

## Student Modes

### Fresh Mode (`--fresh`, default)
- Starts with a clean isolated browser context
- Empty localStorage — simulates a brand new student
- Establishes baselines for screenshot comparison

### Returning Mode (`--returning`)
- Loads `qa-report/amirnet-qa-results.json` from a previous fresh run
- Injects previous vocabulary session data into the browser's localStorage
- After the session, compares question texts from this run vs the previous run
- Reports as **High severity** if more than 5 questions repeat and the pool has 400+ questions
- **Run fresh mode first** before returning mode

---

## Two-Viewport Visual Checks

For every route, visual checks run at both:
- **Desktop** — 1280×800
- **Mobile** — 390×844 (iPhone 14 Pro)

Issues are tagged with the viewport name. The Visual UI QA section in the report is split into Desktop and Mobile subsections.

---

## Screenshot Comparison (Advisory Only)

On the **first run**, baseline screenshots are saved to `qa-report/baselines/`.
On **subsequent runs**, the current screenshot is compared to the baseline.

Key details:
- Dynamic areas are masked before comparison: timers, scores, counters, spinners, dates
- Any difference is classified as `low` severity — advisory only
- This **never fails or aborts** the QA run
- The comparison uses file-size difference as a proxy (true pixel diff requires an additional library)

---

## Output Files

| File | Description |
|------|-------------|
| `qa-report/amirnet-qa-report.md` | Full human-readable QA report |
| `qa-report/amirnet-qa-results.json` | Machine-readable results (used by returning mode) |
| `qa-report/screenshots/` | Timestamped screenshots |
| `qa-report/baselines/` | Baseline screenshots for visual comparison |
| `qa-report/traces/trace.zip` | Playwright browser trace (open with `npx playwright show-trace`) |
| `qa-report/amirnet-qa-memory-temp.json` | Crash-safe student memory snapshot |

View trace:
```
npx playwright show-trace qa-report/traces/trace.zip
```

---

## How Student Memory Works

`StudentMemory` tracks everything in RAM during the QA run and is written to disk after every major flow (crash-safe):

- `visitedRoutes` — all routes visited
- `questionsSeen` — normalized question text → count
- `vocabWordsSeen` — normalized word → count
- `localStorageSnapshots` — before/after captures of 5 key localStorage entries per flow
- `duplicateQuestionsDetected` — questions seen more than once
- `duplicateWordsDetected` — words seen more than once
- `practiceFlowsCompleted` / `practiceFlowsStuck` — flow status

---

## How Duplicate Detection Works

Questions and vocab words are **normalized** before comparison:
```
text.toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 200)
```

A question is counted as a duplicate if the same normalized text appears more than once within the same session. With 400+ questions in the pool, duplicates in a 20-question session are unexpected.

Repetition thresholds (configurable in `config.ts`):
- `maxDuplicateQuestionsAllowed: 2` — report as issue if exceeded
- `maxDuplicateWordsAllowed: 2` — same for vocab words

---

## localStorage Progress Analysis

For each practice/vocab/simulation flow, the agent captures before and after snapshots of:
- `amirnet-qhistory-v1` — question history
- `amirnet-session-current` — current session state
- `amirnet-vocab-v1` — vocab mastery states
- `amirnet-progress-v1` — XP and streak data
- `amirnet-sim-current` — simulation state

The report includes a table showing what changed (or didn't) for each key, with pass/warn/fail status.

---

## Using the Fixing Prompt

At the bottom of `qa-report/amirnet-qa-report.md`, there is a ready-to-paste Claude Code prompt. Copy it and paste it into a new Claude Code conversation to fix all discovered issues automatically.

---

## Configuration

All settings are in `qa-agent/config.ts`:

| Setting | Default | Description |
|---------|---------|-------------|
| `baseUrl` | `http://localhost:3000` | App URL |
| `maxScreens` | 30 | Max routes to visit |
| `maxQuestionsPerFlow` | 20 | Max questions per practice session |
| `maxWordsPerFlow` | 15 | Max vocab words per flow |
| `maxDuplicateQuestionsAllowed` | 2 | Threshold before reporting |
| `maxDuplicateWordsAllowed` | 2 | Same for vocab |
| `practiceModesToTest` | 6 modes | Which practice modes to simulate |

---

## Extending the Agent

| File | Role |
|------|------|
| `config.ts` | Add new settings, routes, or thresholds |
| `crawler.ts` | Add new priority routes or discovery logic |
| `student-simulator.ts` | Add new flow types (e.g., diagnostic, writing task) |
| `visual-ui-checks.ts` | Add new browser-side checks |
| `assertions.ts` | Add new per-screen health checks |
| `issue-classifier.ts` | Add new issue types with appropriate severity |
| `report.ts` | Add new report sections |

**Rule**: never import from `src/` inside `qa-agent/`. All imports must be relative within `qa-agent/` or from node_modules.

---

## Troubleshooting

**"App is not reachable"**  
→ Start the dev server: `npm run dev` in a separate terminal.

**"No start button found for [mode]"**  
→ The practice mode selector UI may have changed. Update `clickPracticeMode()` in `interactions.ts` with the correct labels.

**"No question text found"**  
→ The question card structure may have changed. Update `readQuestionText()` in `interactions.ts` with correct selectors.

**Trace file too large**  
→ Reduce `maxScreens` or `maxQuestionsPerFlow` in `config.ts`.
