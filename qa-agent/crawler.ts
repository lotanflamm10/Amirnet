import type { Page } from 'playwright';
import { config } from './config';
import type { StudentMemory, ScreenResult } from './types';
import { captureConsoleErrors, captureNetworkErrors, getPageTitle, takeScreenshot } from './playwright-helpers';
import { runScreenAssertions } from './assertions';
import { runAllViewportChecks } from './visual-ui-checks';
import { extractInternalLinks, isInternalLink, isBlocked } from './interactions';

interface CrawlOptions {
  memory: StudentMemory;
  onScreenDone?: (result: ScreenResult) => void;
}

/**
 * Crawl all AMIRNET routes. Starts with priority routes, then discovers more.
 * Returns ScreenResult[] for all visited routes.
 */
export async function crawlAllRoutes(
  page: Page,
  options: CrawlOptions
): Promise<ScreenResult[]> {
  const { memory, onScreenDone } = options;
  const results: ScreenResult[] = [];
  const visited = new Set<string>();
  const queue: string[] = [...config.priorityRoutes];

  // Ensure default viewport
  await page.setViewportSize({ width: config.viewports[0].width, height: config.viewports[0].height });

  let screensVisited = 0;

  while (queue.length > 0 && screensVisited < config.maxScreens) {
    const route = queue.shift()!;
    if (visited.has(route)) continue;
    visited.add(route);
    screensVisited++;

    if (memory.visitedRoutes.indexOf(route) === -1) {
      memory.visitedRoutes.push(route);
    }

    const url = `${config.baseUrl}${route}`;
    const startMs = Date.now();

    // Attach fresh error collectors for this page
    const consoleErrors = captureConsoleErrors(page);
    const networkErrors = captureNetworkErrors(page);

    let loadedOk = false;
    let httpStatus: number | undefined;
    let title = '';

    console.log(`[crawl] ${route}`);

    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      httpStatus = response?.status();
      loadedOk = httpStatus !== undefined && httpStatus < 400;
      await page.waitForTimeout(1500);
      title = await getPageTitle(page);
    } catch (err) {
      console.error(`[crawl] Failed to load ${route}:`, err instanceof Error ? err.message : err);
      const ss = await takeScreenshot(page, `nav-fail-${route}`);
      const { navFailureIssue } = await import('./issue-classifier');
      const issue = navFailureIssue(route, err instanceof Error ? err.message : String(err), ss);
      results.push({
        route,
        title: route,
        loadedOk: false,
        screenshotPaths: {},
        consoleErrors: [],
        networkErrors: [],
        issues: [issue],
        durationMs: Date.now() - startMs,
        httpStatus: 0,
      });
      onScreenDone?.(results[results.length - 1]);
      continue;
    }

    // Run health assertions
    const ss = await takeScreenshot(page, route);
    const assertionIssues = await runScreenAssertions(page, route, consoleErrors, networkErrors, ss);

    // Run visual checks at both viewports
    const { issues: visualIssues, screenshotPaths } = await runAllViewportChecks(page, route);

    // Discover new internal links
    if (loadedOk) {
      const links = await extractInternalLinks(page, config.baseUrl);
      for (const link of links) {
        if (
          !visited.has(link) &&
          !queue.includes(link) &&
          isInternalLink(link, config.baseUrl) &&
          !isBlocked(link) &&
          screensVisited + queue.length < config.maxScreens
        ) {
          queue.push(link);
        }
      }
    }

    const result: ScreenResult = {
      route,
      title,
      loadedOk,
      screenshotPaths,
      consoleErrors: [...consoleErrors],
      networkErrors: [...networkErrors],
      issues: [...assertionIssues, ...visualIssues],
      durationMs: Date.now() - startMs,
      httpStatus,
    };

    results.push(result);
    onScreenDone?.(result);

    // Short pause between routes
    await page.waitForTimeout(300);
  }

  return results;
}
