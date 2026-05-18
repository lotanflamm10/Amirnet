import type { Page } from 'playwright';
import type { QAIssue, ViewportName } from './types';
import { takeScreenshot, compareToBaseline, routeToSlug } from './playwright-helpers';
import { config } from './config';
import { createIssue, screenshotDiffIssue } from './issue-classifier';

interface BrowserCheckResult {
  found: boolean;
  details: string[];
}

/** Run all in-browser visual checks. */
async function runBrowserChecks(page: Page): Promise<BrowserCheckResult[]> {
  return page.evaluate((): Array<{ found: boolean; details: string[] }> => {
    const results: Array<{ found: boolean; details: string[] }> = [];

    // 1. Horizontal overflow
    {
      const overflow = document.documentElement.scrollWidth > window.innerWidth + 5;
      results.push({
        found: overflow,
        details: overflow
          ? [`scrollWidth=${document.documentElement.scrollWidth}, innerWidth=${window.innerWidth}`]
          : [],
      });
    }

    // 2. Buttons without accessible names
    {
      const btns = Array.from(document.querySelectorAll('button'));
      const unnamed: string[] = [];
      for (const btn of btns) {
        const text = (btn.textContent ?? '').trim();
        const label = btn.getAttribute('aria-label') ?? '';
        const labelledBy = btn.getAttribute('aria-labelledby') ?? '';
        const title = btn.getAttribute('title') ?? '';
        if (!text && !label && !labelledBy && !title) {
          const html = btn.outerHTML.slice(0, 80);
          unnamed.push(html);
        }
      }
      results.push({ found: unnamed.length > 0, details: unnamed.slice(0, 5) });
    }

    // 3. Very small text (< 10px font size, visible)
    {
      const smallText: string[] = [];
      const all = Array.from(document.querySelectorAll('p, span, li, td, th, label, button, a'));
      for (const el of all.slice(0, 300)) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const style = window.getComputedStyle(el);
        const size = parseFloat(style.fontSize ?? '16');
        if (size < 10 && size > 0) {
          smallText.push(`${size}px: "${(el.textContent ?? '').trim().slice(0, 40)}"`);
        }
      }
      results.push({ found: smallText.length > 0, details: smallText.slice(0, 5) });
    }

    // 4. Clipped text (scrollWidth > clientWidth with overflow hidden)
    {
      const clipped: string[] = [];
      const textEls = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, span, button, a, label'));
      for (const el of textEls.slice(0, 200)) {
        const htmlEl = el as HTMLElement;
        const style = window.getComputedStyle(htmlEl);
        if (style.overflow === 'hidden' || style.textOverflow === 'ellipsis') {
          if (htmlEl.scrollWidth > htmlEl.clientWidth + 2) {
            clipped.push(`"${(el.textContent ?? '').trim().slice(0, 50)}"`);
          }
        }
      }
      results.push({ found: clipped.length > 0, details: clipped.slice(0, 5) });
    }

    // 5. Elements outside viewport (right-overflow)
    {
      const outside: string[] = [];
      const els = Array.from(document.querySelectorAll('img, button, input, select, [class*="card"]'));
      for (const el of els.slice(0, 100)) {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth + 10 && rect.left < window.innerWidth) {
          outside.push(`${el.tagName}: right=${Math.round(rect.right)}, vw=${window.innerWidth}`);
        }
      }
      results.push({ found: outside.length > 0, details: outside.slice(0, 5) });
    }

    // 6. Broken images
    {
      const broken: string[] = [];
      const imgs = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
      for (const img of imgs) {
        if (!img.complete || img.naturalWidth === 0) {
          broken.push(img.src.slice(0, 80));
        }
      }
      results.push({ found: broken.length > 0, details: broken.slice(0, 5) });
    }

    // 7. Empty links
    {
      const emptyLinks: string[] = [];
      const links = Array.from(document.querySelectorAll('a'));
      for (const link of links) {
        const text = (link.textContent ?? '').trim();
        const label = link.getAttribute('aria-label') ?? '';
        const title = link.getAttribute('title') ?? '';
        if (!text && !label && !title) {
          emptyLinks.push(link.outerHTML.slice(0, 80));
        }
      }
      results.push({ found: emptyLinks.length > 0, details: emptyLinks.slice(0, 5) });
    }

    return results;
  });
}

const CHECK_LABELS = [
  'Horizontal overflow',
  'Buttons without accessible names',
  'Very small text (< 10px)',
  'Clipped text',
  'Elements outside viewport',
  'Broken images',
  'Empty links',
];

/** Run all visual checks for a given viewport and route. */
export async function runVisualChecks(
  page: Page,
  route: string,
  viewportName: ViewportName
): Promise<QAIssue[]> {
  const issues: QAIssue[] = [];

  let browserResults: BrowserCheckResult[] = [];
  try {
    browserResults = await runBrowserChecks(page);
  } catch (err) {
    if (config.debug) console.log(`[visual] browser checks failed for ${route}:`, err);
    return [];
  }

  for (let i = 0; i < browserResults.length; i++) {
    const result = browserResults[i];
    if (!result.found) continue;

    const label = CHECK_LABELS[i] ?? `Check ${i}`;
    let severity: QAIssue['severity'] = 'medium';
    if (label === 'Horizontal overflow' || label === 'Elements outside viewport') {
      severity = viewportName === 'mobile' ? 'high' : 'medium';
    } else if (label === 'Buttons without accessible names') {
      severity = 'medium';
    } else if (label === 'Broken images') {
      severity = 'medium';
    } else if (label === 'Empty links' || label === 'Very small text (< 10px)' || label === 'Clipped text') {
      severity = 'low';
    }

    const ss = await takeScreenshot(page, `visual-${i}-${route}`, viewportName);
    issues.push(createIssue({
      severity,
      title: `[${viewportName.toUpperCase()}] ${label} on ${route}`,
      description: result.details.join('\n'),
      route,
      action: `visual check (${viewportName})`,
      expected: `No ${label.toLowerCase()}`,
      actual: result.details.join('; '),
      screenshotPath: ss,
      viewport: viewportName,
      suggestedCause: `CSS layout issue at ${viewportName} breakpoint`,
      suggestedFixArea: `src/components or src/app${route}`,
      reproSteps: [`Navigate to ${route}`, `Resize to ${viewportName}`, `Observe ${label.toLowerCase()}`],
      affectsUI: true,
      affectsStudentLearning: severity === 'high',
    }));
  }

  // Screenshot baseline comparison (advisory)
  const slug = routeToSlug(route);
  try {
    const diff = await compareToBaseline(page, slug, viewportName, config.dynamicMaskSelectors as unknown as string[]);
    if (diff && diff.diffPct > 10) {
      const ss = await takeScreenshot(page, `diff-${route}`, viewportName);
      issues.push(screenshotDiffIssue(route, diff.diffPct, viewportName, ss));
    }
  } catch { /* advisory — never fail run */ }

  return issues;
}

/** Run visual checks at both viewports and return all issues. */
export async function runAllViewportChecks(
  page: Page,
  route: string
): Promise<{ issues: QAIssue[]; screenshotPaths: Partial<Record<ViewportName, string>> }> {
  const allIssues: QAIssue[] = [];
  const screenshotPaths: Partial<Record<ViewportName, string>> = {};

  for (const viewport of config.viewports) {
    try {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      const ss = await takeScreenshot(page, route, viewport.name);
      screenshotPaths[viewport.name] = ss;

      const issues = await runVisualChecks(page, route, viewport.name);
      allIssues.push(...issues);
    } catch (err) {
      if (config.debug) console.log(`[visual] viewport ${viewport.name} failed:`, err);
    }
  }

  // Restore default viewport
  const defaultVp = config.viewports[0];
  try {
    await page.setViewportSize({ width: defaultVp.width, height: defaultVp.height });
  } catch { /* ignore */ }

  return { issues: allIssues, screenshotPaths };
}
