import type { Page } from 'playwright';
import type { QAIssue } from './types';
import { takeScreenshot } from './playwright-helpers';
import {
  blankPageIssue,
  hydrationIssue,
  loadingStuckIssue,
  networkFailureIssue,
} from './issue-classifier';

/** Assert page has meaningful content. */
export async function assertNotBlank(
  page: Page,
  route: string
): Promise<QAIssue | null> {
  try {
    const bodyText = await page.evaluate(() => document.body.innerText ?? '');
    if (bodyText.trim().length < 50) {
      const ss = await takeScreenshot(page, `blank-${route}`);
      return blankPageIssue(route, ss);
    }
  } catch {
    const ss = await takeScreenshot(page, `blank-error-${route}`);
    return blankPageIssue(route, ss);
  }
  return null;
}

const REACT_ERROR_PATTERNS = [
  'hydration',
  'Hydration',
  'Warning:',
  'react-dom',
  'Cannot read',
  'is not a function',
  'Unexpected token',
  'SyntaxError',
  'ReferenceError',
  'TypeError',
  'ChunkLoadError',
];

/** Assert no React/hydration errors in console. */
export function assertNoHydrationErrors(
  consoleErrors: string[],
  route: string,
  screenshotPath?: string
): QAIssue | null {
  const relevant = consoleErrors.filter(e =>
    REACT_ERROR_PATTERNS.some(p => e.includes(p))
  );
  if (relevant.length === 0) return null;
  return hydrationIssue(route, relevant, screenshotPath);
}

/** Assert no loading spinner is stuck after waiting. */
export async function assertNoLoadingStuck(
  page: Page,
  route: string
): Promise<QAIssue | null> {
  const spinnerSelectors = [
    '[class*="spinner"]',
    '[class*="skeleton"]',
    '[aria-busy="true"]',
    '[class*="loading"]',
  ];

  await page.waitForTimeout(3000);

  for (const sel of spinnerSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 500 })) {
        const ss = await takeScreenshot(page, `spinner-stuck-${route}`);
        return loadingStuckIssue(route, ss);
      }
    } catch { /* not present */ }
  }
  return null;
}

/** Assert document has dir=rtl. */
export async function assertRTLDirection(
  page: Page,
  route: string
): Promise<QAIssue | null> {
  try {
    const dir = await page.evaluate(() =>
      document.documentElement.getAttribute('dir') ??
      document.documentElement.style.direction ?? ''
    );
    if (dir && dir !== 'rtl') {
      const ss = await takeScreenshot(page, `rtl-missing-${route}`);
      const { createIssue } = await import('./issue-classifier');
      return createIssue({
        severity: 'high',
        title: 'Missing RTL direction on document',
        description: `document.documentElement.dir="${dir}" — expected "rtl" for Hebrew UI`,
        route,
        action: 'page load',
        expected: 'dir="rtl" on <html>',
        actual: `dir="${dir}"`,
        screenshotPath: ss,
        suggestedCause: 'AppShell or RootLayout not setting dir attribute',
        suggestedFixArea: 'src/app/layout.tsx',
        reproSteps: [`Navigate to ${route}`, 'Inspect <html> element'],
        affectsUI: true,
      });
    }
  } catch { /* ignore */ }
  return null;
}

/** Assert main content region is visible. */
export async function assertMainContentVisible(
  page: Page,
  route: string
): Promise<QAIssue | null> {
  const contentSelectors = ['main', '[role="main"]', 'article', 'section', '#__next', '.page-container'];
  for (const sel of contentSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 })) return null;
    } catch { /* not present */ }
  }
  // If none found, check body has at least some content
  try {
    const bodyText = await page.evaluate(() => document.body.innerText ?? '');
    if (bodyText.trim().length > 100) return null;
  } catch { /* ignore */ }

  const { createIssue } = await import('./issue-classifier');
  return createIssue({
    severity: 'medium',
    title: 'No main content region found',
    description: `No <main> or [role="main"] element found on ${route}`,
    route,
    action: 'check page structure',
    expected: 'Page has a main content element',
    actual: 'No main/[role=main] found',
    suggestedCause: 'Missing semantic HTML in page component',
    suggestedFixArea: `src/app${route}/page.tsx`,
    reproSteps: [`Navigate to ${route}`, 'Inspect DOM for <main>'],
    affectsUI: true,
  });
}

/** Assert no critical network failures (5xx). */
export function assertNoNetworkFailures(
  networkErrors: string[],
  route: string
): QAIssue | null {
  if (networkErrors.length === 0) return null;
  const criticalErrors = networkErrors.filter(e => /\[5\d\d\]/.test(e));
  if (criticalErrors.length > 0) {
    return networkFailureIssue(route, criticalErrors);
  }
  // 4xx errors are lower severity — report as medium
  if (networkErrors.length > 0) {
    return networkFailureIssue(route, networkErrors.slice(0, 5));
  }
  return null;
}

/** Run all assertions for a screen. Returns array of issues found. */
export async function runScreenAssertions(
  page: Page,
  route: string,
  consoleErrors: string[],
  networkErrors: string[],
  screenshotPath?: string
): Promise<QAIssue[]> {
  const issues: QAIssue[] = [];

  const blank = await assertNotBlank(page, route);
  if (blank) issues.push(blank);

  const hydration = assertNoHydrationErrors(consoleErrors, route, screenshotPath);
  if (hydration) issues.push(hydration);

  const stuck = await assertNoLoadingStuck(page, route);
  if (stuck) issues.push(stuck);

  const rtl = await assertRTLDirection(page, route);
  if (rtl) issues.push(rtl);

  const main = await assertMainContentVisible(page, route);
  if (main) issues.push(main);

  const network = assertNoNetworkFailures(networkErrors, route);
  if (network) issues.push(network);

  return issues;
}
