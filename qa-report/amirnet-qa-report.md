# AMIRNET Autonomous QA Report

## Executive Summary

| Metric | Value |
|--------|-------|
| Overall Health | 🔴 Critical issues found |
| Student Mode | fresh |
| Screens Visited | 30 |
| Flows Tested | 9 |
| Questions Attempted | 29 |
| Unique Questions | 7 |
| Duplicate Questions | 22 |
| Words Practiced | 0 |
| Unique Words | 0 |
| Duplicate Words | 0 |
| Total Issues | 38 |
| 🔴 Critical | 5 |
| 🟠 High | 30 |
| 🟡 Medium | 3 |
| 🔵 Low | 0 |
| Student Experience Score | 1/10 |

## Environment

| | |
|--|--|
| Run Date | 2026-05-13T19:29:02.354Z |
| Base URL | http://localhost:3000 |
| Browser | Chromium (playwright) |
| Viewports | desktop 1280x800, mobile 390x844 |
| Node.js | v24.15.0 |
| Student Mode | fresh |

## Coverage

| Area | Count |
|------|-------|
| Routes Visited | /, /app, /practice, /practice/sentenceCompletion, /practice/restatements, /practice/grammar, /practice/wordFormation, /practice/mixed, /practice/smartReview, /practice/reading, /practice/textCompletion, /practice/lectureQuestions, /practice/writingTask, /vocab, /vocab/swipe, /vocab/list, /vocab/starred, /vocab/missed, /vocab/weak, /simulation, /challenge, /diagnostic, /learning-engine, /review, /account, /pricing, /admin, /legal/privacy, /legal/terms, /practice/vocabularyInContext |
| Screens Successfully Loaded | 30 |
| Screens Failed to Load | 0 |
| Practice Flows | 6 |
| Vocab Flows | 1 |
| Simulation Flows | 1 |
| Flows Completed | 3 |
| Flows Stuck | 5 |

## Student Simulation Findings

**Student Experience Score: 1/10**

The QA agent simulated a fresh AMIRNET student across 9 learning flows.

- **Flows completed successfully**: 3 (practice:mixed, practice:smartReview, vocab:swipe)
- **Flows stuck/failed**: 5 — practice:sentenceCompletion: Same question repeated 3 times: "כלי הכנה עצמאי לאמירנט · לא קשור לנית · ציונים אינם רשמיים"; practice:restatements: Same question repeated 3 times: "כלי הכנה עצמאי לאמירנט · לא קשור לנית · ציונים אינם רשמיים"; practice:grammar: Same question repeated 3 times: "כלי הכנה עצמאי לאמירנט · לא קשור לנית · ציונים אינם רשמיים"; practice:wordFormation: Same question repeated 3 times: "כלי הכנה עצמאי לאמירנט · לא קשור לנית · ציונים אינם רשמיים"; simulation:standard: Stuck: כלי הכנה עצמאי לאמירנט · לא קשור לנית · ציונים אינם רשמיים
- **Total questions attempted**: 29
- **Duplicate questions detected**: 22
- **Total words practiced**: 0
- **Duplicate words detected**: 0
- **localStorage progress failures**: 1

**Student experience assessment:**
> The student experience is significantly impaired. Critical issues must be fixed first.

**Recommended product improvements:**
- Reduce question repetition (22 duplicates found in sessions)
- Fix localStorage progress not updating (1 checks failed)
- Fix stuck flows: practice:sentenceCompletion, practice:restatements, practice:grammar, practice:wordFormation, simulation:standard

## Visual UI QA Findings

### Desktop (1280×800) — 0 issue(s)

No desktop visual issues detected.

### Mobile (390×844) — 0 issue(s)

No mobile visual issues detected.

## Issues by Severity

### 🔴 **CRITICAL** — 5 issue(s)

#### QA-0028: Blank page — no content rendered
- **Route**: /admin
- **Action**: navigate to page
- **Expected**: Page renders meaningful content
- **Actual**: Page body text is empty or < 50 characters
- **Reproduction steps**:
  1. Navigate to /admin
  1. Observe blank page
- **Screenshot**: [view](screenshots\1778700414869-blank-admin.png)
- **Suggested cause**: Component crash, failed hydration, or missing data
- **Suggested fix area**: `src/app/admin/page.tsx or its main component`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0034: Practice flow stuck — same question shown repeatedly
- **Route**: /practice/sentenceCompletion
- **Action**: submit answer + click next
- **Expected**: Flow advances to a new question after submitting
- **Actual**: Same question text appears after answering and clicking Next
- **Reproduction steps**:
  1. Navigate to /practice/sentenceCompletion
  1. Start a session
  1. Answer a question
  1. Click Next
  1. Observe same question repeated
- **Screenshot**: [view](screenshots\1778700447781-stuck-sentenceCompletion-2.png)
- **Suggested cause**: Next button does nothing, or question selector returns same question on repeat
- **Suggested fix area**: `src/components/practice/PracticeSession.tsx, src/lib/practice/practice-engine.ts`
- **Affects student learning**: Yes
- **Affects repetition/progress**: Yes

#### QA-0035: Practice flow stuck — same question shown repeatedly
- **Route**: /practice/restatements
- **Action**: submit answer + click next
- **Expected**: Flow advances to a new question after submitting
- **Actual**: Same question text appears after answering and clicking Next
- **Reproduction steps**:
  1. Navigate to /practice/restatements
  1. Start a session
  1. Answer a question
  1. Click Next
  1. Observe same question repeated
- **Screenshot**: [view](screenshots\1778700456553-stuck-restatements-2.png)
- **Suggested cause**: Next button does nothing, or question selector returns same question on repeat
- **Suggested fix area**: `src/components/practice/PracticeSession.tsx, src/lib/practice/practice-engine.ts`
- **Affects student learning**: Yes
- **Affects repetition/progress**: Yes

#### QA-0036: Practice flow stuck — same question shown repeatedly
- **Route**: /practice/grammar
- **Action**: submit answer + click next
- **Expected**: Flow advances to a new question after submitting
- **Actual**: Same question text appears after answering and clicking Next
- **Reproduction steps**:
  1. Navigate to /practice/grammar
  1. Start a session
  1. Answer a question
  1. Click Next
  1. Observe same question repeated
- **Screenshot**: [view](screenshots\1778700465404-stuck-grammar-2.png)
- **Suggested cause**: Next button does nothing, or question selector returns same question on repeat
- **Suggested fix area**: `src/components/practice/PracticeSession.tsx, src/lib/practice/practice-engine.ts`
- **Affects student learning**: Yes
- **Affects repetition/progress**: Yes

#### QA-0037: Practice flow stuck — same question shown repeatedly
- **Route**: /practice/wordFormation
- **Action**: submit answer + click next
- **Expected**: Flow advances to a new question after submitting
- **Actual**: Same question text appears after answering and clicking Next
- **Reproduction steps**:
  1. Navigate to /practice/wordFormation
  1. Start a session
  1. Answer a question
  1. Click Next
  1. Observe same question repeated
- **Screenshot**: [view](screenshots\1778700474114-stuck-wordFormation-2.png)
- **Suggested cause**: Next button does nothing, or question selector returns same question on repeat
- **Suggested fix area**: `src/components/practice/PracticeSession.tsx, src/lib/practice/practice-engine.ts`
- **Affects student learning**: Yes
- **Affects repetition/progress**: Yes

### 🟠 **HIGH** — 30 issue(s)

#### QA-0001: Network failure on /
- **Route**: /
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0002: Network failure on /app
- **Route**: /app
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /app
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0003: Network failure on /practice
- **Route**: /practice
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /practice
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0004: Network failure on /practice/sentenceCompletion
- **Route**: /practice/sentenceCompletion
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /practice/sentenceCompletion
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0005: Network failure on /practice/restatements
- **Route**: /practice/restatements
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /practice/restatements
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0006: Network failure on /practice/grammar
- **Route**: /practice/grammar
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /practice/grammar
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0007: Network failure on /practice/wordFormation
- **Route**: /practice/wordFormation
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /practice/wordFormation
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0008: Network failure on /practice/mixed
- **Route**: /practice/mixed
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /practice/mixed
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0009: Network failure on /practice/smartReview
- **Route**: /practice/smartReview
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /practice/smartReview
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0010: Network failure on /practice/reading
- **Route**: /practice/reading
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /practice/reading
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0011: Network failure on /practice/textCompletion
- **Route**: /practice/textCompletion
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /practice/textCompletion
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0012: Network failure on /practice/lectureQuestions
- **Route**: /practice/lectureQuestions
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /practice/lectureQuestions
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0013: Network failure on /practice/writingTask
- **Route**: /practice/writingTask
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /practice/writingTask
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0014: Network failure on /vocab
- **Route**: /vocab
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /vocab
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0015: Network failure on /vocab/swipe
- **Route**: /vocab/swipe
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /vocab/swipe
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0016: Network failure on /vocab/list
- **Route**: /vocab/list
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 1 failed request(s)
- **Reproduction steps**:
  1. Navigate to /vocab/list
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0017: Network failure on /vocab/starred
- **Route**: /vocab/starred
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 1 failed request(s)
- **Reproduction steps**:
  1. Navigate to /vocab/starred
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0018: Network failure on /vocab/missed
- **Route**: /vocab/missed
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 1 failed request(s)
- **Reproduction steps**:
  1. Navigate to /vocab/missed
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0019: Network failure on /vocab/weak
- **Route**: /vocab/weak
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 1 failed request(s)
- **Reproduction steps**:
  1. Navigate to /vocab/weak
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0020: Network failure on /simulation
- **Route**: /simulation
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /simulation
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0021: Network failure on /challenge
- **Route**: /challenge
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /challenge
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0022: Network failure on /diagnostic
- **Route**: /diagnostic
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /diagnostic
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0024: Network failure on /learning-engine
- **Route**: /learning-engine
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /learning-engine
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0025: Network failure on /review
- **Route**: /review
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /review
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0026: Network failure on /account
- **Route**: /account
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 1 failed request(s)
- **Reproduction steps**:
  1. Navigate to /account
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0027: Network failure on /pricing
- **Route**: /pricing
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /pricing
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0031: Network failure on /legal/privacy
- **Route**: /legal/privacy
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /legal/privacy
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0032: Network failure on /legal/terms
- **Route**: /legal/terms
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /legal/terms
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0033: Network failure on /practice/vocabularyInContext
- **Route**: /practice/vocabularyInContext
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 2 failed request(s)
- **Reproduction steps**:
  1. Navigate to /practice/vocabularyInContext
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: Yes
- **Affects repetition/progress**: No

#### QA-0038: Repeated questions in practice — 5 duplicates out of 7 seen
- **Route**: /practice/smartReview
- **Action**: complete practice session
- **Expected**: Each question appears at most once in a 20-question session
- **Actual**: 5 duplicate question(s) detected
- **Reproduction steps**:
  1. Navigate to /practice/smartReview
  1. Complete a full 20-question session
  1. Track question texts — some repeat
- **Screenshot**: [view](screenshots\1778700499132-repetition-smartReview.png)
- **Suggested cause**: Anti-repetition logic in question-selector.ts may not exclude already-shown questions within the same session
- **Suggested fix area**: `src/lib/practice/question-selector.ts, src/lib/practice/question-history.ts`
- **Affects student learning**: Yes
- **Affects repetition/progress**: Yes

### 🟡 **MEDIUM** — 3 issue(s)

#### QA-0023: No main content region found
- **Route**: /learning-engine
- **Action**: check page structure
- **Expected**: Page has a main content element
- **Actual**: No main/[role=main] found
- **Reproduction steps**:
  1. Navigate to /learning-engine
  1. Inspect DOM for <main>
- **Suggested cause**: Missing semantic HTML in page component
- **Suggested fix area**: `src/app/learning-engine/page.tsx`
- **Affects student learning**: No
- **Affects repetition/progress**: No

#### QA-0029: No main content region found
- **Route**: /admin
- **Action**: check page structure
- **Expected**: Page has a main content element
- **Actual**: No main/[role=main] found
- **Reproduction steps**:
  1. Navigate to /admin
  1. Inspect DOM for <main>
- **Suggested cause**: Missing semantic HTML in page component
- **Suggested fix area**: `src/app/admin/page.tsx`
- **Affects student learning**: No
- **Affects repetition/progress**: No

#### QA-0030: Network failure on /admin
- **Route**: /admin
- **Action**: page network requests
- **Expected**: All internal requests return 2xx
- **Actual**: 1 failed request(s)
- **Reproduction steps**:
  1. Navigate to /admin
  1. Open DevTools Network tab
  1. Observe failed requests
- **Suggested cause**: API endpoint down, missing file, or misconfigured route
- **Suggested fix area**: `Check Next.js API routes or static asset paths`
- **Affects student learning**: No
- **Affects repetition/progress**: No

## Console Errors (by Route)

No console errors detected.

## Network Failures (by Route)

No network failures detected.

## RTL & Hebrew UI Findings

No RTL direction issues detected. Document `dir="rtl"` is set correctly on all tested routes.

## Accessibility Findings

No critical accessibility issues detected.

## Practice Flow Findings

| Flow | Questions | Unique | Duplicates | Completed | Stuck |
|------|-----------|--------|------------|-----------|-------|
| practice:sentenceCompletion | 2 | 1 | 1 | ✗ | ⚠ Same question repeated 3 times: "כלי הכנה עצמאי לאמירנט · לא קשור לנית · ציונים אינם רשמיים" |
| practice:restatements | 2 | 0 | 2 | ✗ | ⚠ Same question repeated 3 times: "כלי הכנה עצמאי לאמירנט · לא קשור לנית · ציונים אינם רשמיים" |
| practice:grammar | 2 | 0 | 2 | ✗ | ⚠ Same question repeated 3 times: "כלי הכנה עצמאי לאמירנט · לא קשור לנית · ציונים אינם רשמיים" |
| practice:wordFormation | 2 | 0 | 2 | ✗ | ⚠ Same question repeated 3 times: "כלי הכנה עצמאי לאמירנט · לא קשור לנית · ציונים אינם רשמיים" |
| practice:mixed | 1 | 0 | 1 | ✓ | — |
| practice:smartReview | 7 | 2 | 5 | ✓ | — |

## Vocabulary Flow Findings

| Flow | Words | Unique | Duplicates | Completed | Stuck |
|------|-------|--------|------------|-----------|-------|
| vocab:swipe | 0 | 0 | 0 | ✓ | — |

## localStorage Progress Analysis

| Flow | Key | Before | After | Expected | Actual | Status |
|------|-----|--------|-------|----------|--------|--------|
| practice:sentenceCompletion | amirnet-qhistory-v1.practiceSeen | length=0 | length=2 | Length should increase | +2 items | ✅ OK |
| practice:sentenceCompletion | amirnet-session-current | object | object | Cleared (null) after session completes | Still present | ⚠️ WARN |
| practice:sentenceCompletion | amirnet-progress-v1 | null | object | XP/progress updated | Updated | ✅ OK |
| practice:restatements | amirnet-qhistory-v1.practiceSeen | length=2 | length=4 | Length should increase | +2 items | ✅ OK |
| practice:restatements | amirnet-session-current | object | object | Cleared (null) after session completes | Still present | ⚠️ WARN |
| practice:restatements | amirnet-progress-v1 | object | object | XP/progress updated | Updated | ✅ OK |
| practice:grammar | amirnet-qhistory-v1.practiceSeen | length=4 | length=6 | Length should increase | +2 items | ✅ OK |
| practice:grammar | amirnet-session-current | object | object | Cleared (null) after session completes | Still present | ⚠️ WARN |
| practice:grammar | amirnet-progress-v1 | object | object | XP/progress updated | Updated | ✅ OK |
| practice:wordFormation | amirnet-qhistory-v1.practiceSeen | length=6 | length=8 | Length should increase | +2 items | ✅ OK |
| practice:wordFormation | amirnet-session-current | object | object | Cleared (null) after session completes | Still present | ⚠️ WARN |
| practice:wordFormation | amirnet-progress-v1 | object | object | XP/progress updated | Updated | ✅ OK |
| practice:mixed | amirnet-qhistory-v1.practiceSeen | length=8 | length=9 | Length should increase | +1 items | ✅ OK |
| practice:mixed | amirnet-session-current | object | object | Cleared (null) after session completes | Still present | ⚠️ WARN |
| practice:mixed | amirnet-progress-v1 | object | object | XP/progress updated | Updated | ✅ OK |
| practice:smartReview | amirnet-qhistory-v1.practiceSeen | length=9 | length=16 | Length should increase | +7 items | ✅ OK |
| practice:smartReview | amirnet-session-current | object | object | Cleared (null) after session completes | Still present | ⚠️ WARN |
| practice:smartReview | amirnet-progress-v1 | object | object | XP/progress updated | Updated | ✅ OK |
| vocab:swipe | amirnet-vocab-v1 | null | null | Word states updated | Unchanged | ✅ OK |
| simulation:standard | amirnet-qhistory-v1.practiceSeen | length=16 | length=16 | Length should increase | No change | ❌ FAIL |
| simulation:standard | amirnet-progress-v1 | object | object | XP/progress updated | Unchanged | ⚠️ WARN |
| simulation:standard | amirnet-sim-current | null | object | Cleared after simulation ends | Still present | ⚠️ WARN |
| challenge | amirnet-progress-v1 | object | object | XP/progress updated | Unchanged | ⚠️ WARN |

## Screenshots Index

Total screenshots: 38
Screenshots saved to: `qa-report/screenshots/`
Baselines saved to: `qa-report/baselines/`

## Recommended Fix Plan

### 🔴 **CRITICAL** Priority (5 issues)
- **QA-0028** [/admin] Blank page — no content rendered
  → Fix in: `src/app/admin/page.tsx or its main component`
- **QA-0034** [/practice/sentenceCompletion] Practice flow stuck — same question shown repeatedly
  → Fix in: `src/components/practice/PracticeSession.tsx, src/lib/practice/practice-engine.ts`
- **QA-0035** [/practice/restatements] Practice flow stuck — same question shown repeatedly
  → Fix in: `src/components/practice/PracticeSession.tsx, src/lib/practice/practice-engine.ts`
- **QA-0036** [/practice/grammar] Practice flow stuck — same question shown repeatedly
  → Fix in: `src/components/practice/PracticeSession.tsx, src/lib/practice/practice-engine.ts`
- **QA-0037** [/practice/wordFormation] Practice flow stuck — same question shown repeatedly
  → Fix in: `src/components/practice/PracticeSession.tsx, src/lib/practice/practice-engine.ts`

### 🟠 **HIGH** Priority (30 issues)
- **QA-0001** [/] Network failure on /
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0002** [/app] Network failure on /app
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0003** [/practice] Network failure on /practice
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0004** [/practice/sentenceCompletion] Network failure on /practice/sentenceCompletion
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0005** [/practice/restatements] Network failure on /practice/restatements
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0006** [/practice/grammar] Network failure on /practice/grammar
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0007** [/practice/wordFormation] Network failure on /practice/wordFormation
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0008** [/practice/mixed] Network failure on /practice/mixed
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0009** [/practice/smartReview] Network failure on /practice/smartReview
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0010** [/practice/reading] Network failure on /practice/reading
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0011** [/practice/textCompletion] Network failure on /practice/textCompletion
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0012** [/practice/lectureQuestions] Network failure on /practice/lectureQuestions
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0013** [/practice/writingTask] Network failure on /practice/writingTask
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0014** [/vocab] Network failure on /vocab
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0015** [/vocab/swipe] Network failure on /vocab/swipe
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0016** [/vocab/list] Network failure on /vocab/list
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0017** [/vocab/starred] Network failure on /vocab/starred
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0018** [/vocab/missed] Network failure on /vocab/missed
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0019** [/vocab/weak] Network failure on /vocab/weak
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0020** [/simulation] Network failure on /simulation
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0021** [/challenge] Network failure on /challenge
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0022** [/diagnostic] Network failure on /diagnostic
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0024** [/learning-engine] Network failure on /learning-engine
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0025** [/review] Network failure on /review
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0026** [/account] Network failure on /account
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0027** [/pricing] Network failure on /pricing
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0031** [/legal/privacy] Network failure on /legal/privacy
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0032** [/legal/terms] Network failure on /legal/terms
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0033** [/practice/vocabularyInContext] Network failure on /practice/vocabularyInContext
  → Fix in: `Check Next.js API routes or static asset paths`
- **QA-0038** [/practice/smartReview] Repeated questions in practice — 5 duplicates out of 7 seen
  → Fix in: `src/lib/practice/question-selector.ts, src/lib/practice/question-history.ts`

### 🟡 **MEDIUM** Priority (3 issues)
- **QA-0023** [/learning-engine] No main content region found
  → Fix in: `src/app/learning-engine/page.tsx`
- **QA-0029** [/admin] No main content region found
  → Fix in: `src/app/admin/page.tsx`
- **QA-0030** [/admin] Network failure on /admin
  → Fix in: `Check Next.js API routes or static asset paths`

## Ready-to-Paste Claude Code Fixing Prompt

Copy and paste this entire prompt into a Claude Code conversation:

```
You are working only inside C:\Lotan\amirnet.
Read qa-report/amirnet-qa-report.md and qa-report/amirnet-qa-results.json.
Fix all Critical and High severity issues first, then Medium issues.
Do not modify qa-agent/ files.
Do not modify unrelated functionality.
Preserve Hebrew RTL behavior and amirnet-* localStorage key conventions.
Preserve anti-repetition logic in src/lib/practice/question-history.ts.
Preserve spaced-repetition logic in src/lib/vocab/spaced-repetition.ts.
Preserve the current UI style unless a fix requires a small UI correction.
Pay special attention to:
  - localStorage progress not updating after practice sessions
  - Practice flows that are stuck or crash
  - Repeated questions in non-review practice modes
  - RTL layout issues on mobile viewport
After fixing, run: npm run qa:amirnet
Update the QA report with fixed status for each resolved issue.
List every file changed and why.
```
