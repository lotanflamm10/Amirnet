import type { QAIssue, Severity, ViewportName } from './types';

let issueCounter = 0;

function nextId(): string {
  return `QA-${String(++issueCounter).padStart(4, '0')}`;
}

export interface IssueInput {
  severity: Severity;
  title: string;
  description: string;
  route: string;
  action?: string;
  expected?: string;
  actual?: string;
  consoleErrors?: string[];
  networkErrors?: string[];
  screenshotPath?: string;
  viewport?: ViewportName;
  suggestedCause?: string;
  suggestedFixArea?: string;
  reproSteps?: string[];
  affectsStudentLearning?: boolean;
  affectsUI?: boolean;
  affectsRepetition?: boolean;
}

export function createIssue(input: IssueInput): QAIssue {
  return {
    id: nextId(),
    severity: input.severity,
    title: input.title,
    description: input.description,
    route: input.route,
    action: input.action ?? 'navigate',
    expected: input.expected ?? '',
    actual: input.actual ?? '',
    consoleErrors: input.consoleErrors ?? [],
    networkErrors: input.networkErrors ?? [],
    screenshotPath: input.screenshotPath,
    viewport: input.viewport,
    suggestedCause: input.suggestedCause ?? '',
    suggestedFixArea: input.suggestedFixArea ?? '',
    reproSteps: input.reproSteps ?? [`Navigate to ${input.route}`],
    affectsStudentLearning: input.affectsStudentLearning ?? false,
    affectsUI: input.affectsUI ?? false,
    affectsRepetition: input.affectsRepetition ?? false,
  };
}

/** Classify a blank page issue. */
export function blankPageIssue(route: string, screenshotPath?: string): QAIssue {
  return createIssue({
    severity: 'critical',
    title: 'Blank page — no content rendered',
    description: `The page at ${route} rendered no visible content. Body text is empty or too short.`,
    route,
    action: 'navigate to page',
    expected: 'Page renders meaningful content',
    actual: 'Page body text is empty or < 50 characters',
    screenshotPath,
    suggestedCause: 'Component crash, failed hydration, or missing data',
    suggestedFixArea: `src/app${route}/page.tsx or its main component`,
    reproSteps: [`Navigate to ${route}`, 'Observe blank page'],
    affectsStudentLearning: true,
    affectsUI: true,
  });
}

/** Classify a navigation / load failure. */
export function navFailureIssue(route: string, error: string, screenshotPath?: string): QAIssue {
  return createIssue({
    severity: 'critical',
    title: `Navigation failure: ${route}`,
    description: `Page failed to load: ${error}`,
    route,
    action: 'navigate',
    expected: 'Page loads with HTTP 200',
    actual: error,
    screenshotPath,
    suggestedCause: 'Route not implemented, SSR error, or missing component',
    suggestedFixArea: `src/app${route}/page.tsx`,
    reproSteps: [`Navigate to ${route}`],
    affectsStudentLearning: true,
    affectsUI: true,
  });
}

/** Classify a hydration/React error. */
export function hydrationIssue(route: string, errors: string[], screenshotPath?: string): QAIssue {
  return createIssue({
    severity: 'high',
    title: 'React hydration or runtime error',
    description: errors.slice(0, 3).join(' | '),
    route,
    action: 'page load / hydration',
    expected: 'No React errors in console',
    actual: `${errors.length} error(s): ${errors[0]}`,
    consoleErrors: errors,
    screenshotPath,
    suggestedCause: 'Server/client HTML mismatch, missing Suspense boundary, or undefined variable',
    suggestedFixArea: 'Check src/app layout.tsx and the main page component',
    reproSteps: [`Navigate to ${route}`, 'Open DevTools console', 'Observe React errors'],
    affectsStudentLearning: false,
    affectsUI: true,
  });
}

/** Classify a stuck loading spinner. */
export function loadingStuckIssue(route: string, screenshotPath?: string): QAIssue {
  return createIssue({
    severity: 'high',
    title: 'Loading spinner stuck — content never appeared',
    description: `A loading spinner was still visible after 5 seconds on ${route}`,
    route,
    action: 'wait for content',
    expected: 'Content loads within 3 seconds',
    actual: 'Loading indicator still visible after 5+ seconds',
    screenshotPath,
    suggestedCause: 'Async data fetch never resolves, or component in infinite loading state',
    suggestedFixArea: 'Check data fetching and loading state management in the page component',
    reproSteps: [`Navigate to ${route}`, 'Wait 5 seconds', 'Observe persistent spinner'],
    affectsStudentLearning: true,
    affectsUI: true,
  });
}

/** Classify a network failure. */
export function networkFailureIssue(route: string, errors: string[]): QAIssue {
  const has5xx = errors.some(e => /\[5\d\d\]/.test(e));
  return createIssue({
    severity: has5xx ? 'high' : 'medium',
    title: `Network failure on ${route}`,
    description: errors.slice(0, 5).join('\n'),
    route,
    action: 'page network requests',
    expected: 'All internal requests return 2xx',
    actual: `${errors.length} failed request(s)`,
    networkErrors: errors,
    suggestedCause: 'API endpoint down, missing file, or misconfigured route',
    suggestedFixArea: 'Check Next.js API routes or static asset paths',
    reproSteps: [`Navigate to ${route}`, 'Open DevTools Network tab', 'Observe failed requests'],
    affectsStudentLearning: has5xx,
    affectsUI: false,
  });
}

/** Classify a visual/UI issue. */
export function visualIssue(
  route: string,
  title: string,
  detail: string,
  viewport: ViewportName,
  screenshotPath?: string
): QAIssue {
  return createIssue({
    severity: 'medium',
    title,
    description: detail,
    route,
    action: `visual check on ${viewport}`,
    expected: 'Clean layout with no overflow or clipping',
    actual: detail,
    screenshotPath,
    viewport,
    suggestedCause: 'Missing responsive breakpoints, missing RTL-aware styles, or absolute positioning issues',
    suggestedFixArea: 'CSS / Tailwind classes for this route',
    reproSteps: [`Navigate to ${route}`, `View at ${viewport} resolution`],
    affectsUI: true,
  });
}

/** Classify a practice-flow stuck issue. */
export function practiceStuckIssue(
  route: string,
  questionText: string,
  screenshotPath?: string
): QAIssue {
  return createIssue({
    severity: 'critical',
    title: 'Practice flow stuck — same question shown repeatedly',
    description: `The same question appeared 3+ times without the flow advancing: "${questionText.slice(0, 80)}"`,
    route,
    action: 'submit answer + click next',
    expected: 'Flow advances to a new question after submitting',
    actual: 'Same question text appears after answering and clicking Next',
    screenshotPath,
    suggestedCause: 'Next button does nothing, or question selector returns same question on repeat',
    suggestedFixArea: 'src/components/practice/PracticeSession.tsx, src/lib/practice/practice-engine.ts',
    reproSteps: [`Navigate to ${route}`, 'Start a session', 'Answer a question', 'Click Next', 'Observe same question repeated'],
    affectsStudentLearning: true,
    affectsRepetition: true,
  });
}

/** Classify a question repetition issue (non-stuck, just repeated). */
export function questionRepetitionIssue(
  route: string,
  count: number,
  totalSeen: number,
  screenshotPath?: string
): QAIssue {
  const severity: Severity = count >= 5 ? 'high' : 'medium';
  return createIssue({
    severity,
    title: `Repeated questions in practice — ${count} duplicates out of ${totalSeen} seen`,
    description: `${count} question(s) appeared more than once during a single practice session. With 400+ questions in the pool, this should rarely happen.`,
    route,
    action: 'complete practice session',
    expected: 'Each question appears at most once in a 20-question session',
    actual: `${count} duplicate question(s) detected`,
    screenshotPath,
    suggestedCause: 'Anti-repetition logic in question-selector.ts may not exclude already-shown questions within the same session',
    suggestedFixArea: 'src/lib/practice/question-selector.ts, src/lib/practice/question-history.ts',
    reproSteps: [`Navigate to ${route}`, 'Complete a full 20-question session', 'Track question texts — some repeat'],
    affectsStudentLearning: true,
    affectsRepetition: true,
  });
}

/** Classify a localStorage not-updated issue. */
export function localStorageNotUpdatedIssue(
  route: string,
  flowName: string,
  key: string,
  screenshotPath?: string
): QAIssue {
  return createIssue({
    severity: 'high',
    title: `localStorage not updated after ${flowName}: ${key}`,
    description: `After completing ${flowName}, the key "${key}" was not updated. Student progress may not be saved.`,
    route,
    action: `complete ${flowName}`,
    expected: `${key} is updated with new session data`,
    actual: `${key} is unchanged or null after completing the flow`,
    screenshotPath,
    suggestedCause: 'saveCurrentSession() or recordSeen() not called on completion, or caught error suppressing the write',
    suggestedFixArea: 'src/lib/practice/practice-engine.ts, src/lib/practice/question-history.ts',
    reproSteps: ['Complete a practice session', `Check localStorage key "${key}" in DevTools`],
    affectsStudentLearning: true,
  });
}

/** Classify a returning-student repetition issue. */
export function returningRepetitionIssue(
  overlapCount: number,
  totalSeen: number,
  screenshotPath?: string
): QAIssue {
  return createIssue({
    severity: 'high',
    title: `Returning student sees repeated questions — ${overlapCount} of ${totalSeen} already seen`,
    description: `In returning-student mode, ${overlapCount} questions appeared that were also seen in the previous QA run. With 400+ questions available, this suggests insufficient anti-repetition across sessions.`,
    route: '/practice',
    action: 'practice session (returning student)',
    expected: 'A returning student should see mostly new questions',
    actual: `${overlapCount} previously-seen questions appeared again`,
    suggestedCause: 'amirnet-qhistory-v1 practiceSeen list is not long enough, or question-selector fallback pool ignores history',
    suggestedFixArea: 'src/lib/practice/question-selector.ts — check anti-repetition window size',
    reproSteps: ['Run qa:amirnet (fresh)', 'Run qa:amirnet:returning', 'Compare question texts across runs'],
    affectsStudentLearning: true,
    affectsRepetition: true,
  });
}

/** Classify a visual screenshot diff advisory. */
export function screenshotDiffIssue(
  route: string,
  diffPct: number,
  viewport: ViewportName,
  screenshotPath?: string
): QAIssue {
  return createIssue({
    severity: 'low',
    title: `Visual diff detected: ${route} (${viewport}) — ~${diffPct}% size change`,
    description: `Screenshot size differs from baseline by ~${diffPct}%. This is advisory only and may be caused by dynamic content (timers, scores).`,
    route,
    action: `screenshot comparison (${viewport})`,
    expected: 'Screenshot matches baseline',
    actual: `File-size diff ~${diffPct}%`,
    screenshotPath,
    viewport,
    suggestedCause: 'Layout change, content shift, or dynamic content not masked',
    suggestedFixArea: 'Visual regression — compare screenshots manually',
    reproSteps: [`Navigate to ${route}`, 'Compare with qa-report/baselines/'],
    affectsUI: true,
  });
}
