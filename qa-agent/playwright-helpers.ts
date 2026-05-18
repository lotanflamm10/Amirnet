import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import type { Page, BrowserContext } from 'playwright';
import { config } from './config';

/** Check if the app is reachable at the given URL. Returns true if reachable. */
export async function checkReachable(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const req = mod.get(url, { timeout: 5000 }, (res) => {
      resolve(res.statusCode !== undefined && res.statusCode < 600);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    setTimeout(() => { req.destroy(); resolve(false); }, 5500);
  });
}

/** Ensure directory exists. */
export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Take a screenshot and return its relative path. */
export async function takeScreenshot(
  page: Page,
  name: string,
  viewport?: string
): Promise<string> {
  ensureDir(config.screenshotDir);
  const safeName = name.replace(/[^a-z0-9\-_]/gi, '-').replace(/-+/g, '-').slice(0, 80);
  const vp = viewport ? `-${viewport}` : '';
  const filename = `${Date.now()}-${safeName}${vp}.png`;
  const fullPath = path.join(config.screenshotDir, filename);
  try {
    await page.screenshot({ path: fullPath, fullPage: false });
  } catch {
    // page may be closed
  }
  return path.join('screenshots', filename);
}

/** Save a baseline screenshot and return its path. */
export async function saveBaseline(
  page: Page,
  routeSlug: string,
  viewport: string,
  maskSelectors: string[]
): Promise<string> {
  ensureDir(config.baselineDir);
  const filename = `${routeSlug}-${viewport}.png`;
  const fullPath = path.join(config.baselineDir, filename);

  const masks = maskSelectors
    .map(sel => page.locator(sel))
    .filter(loc => loc !== null);

  try {
    await page.screenshot({
      path: fullPath,
      fullPage: false,
      mask: masks,
    });
  } catch {
    // ignore
  }
  return fullPath;
}

/** Compare current screenshot to baseline. Returns diff percentage or null if no baseline. */
export async function compareToBaseline(
  page: Page,
  routeSlug: string,
  viewport: string,
  maskSelectors: string[]
): Promise<{ diffPct: number; baselinePath: string } | null> {
  const baselinePath = path.join(config.baselineDir, `${routeSlug}-${viewport}.png`);
  if (!fs.existsSync(baselinePath)) {
    // First run — save baseline
    await saveBaseline(page, routeSlug, viewport, maskSelectors);
    return null;
  }

  // Take current screenshot for comparison
  ensureDir(config.screenshotDir);
  const currentPath = path.join(config.screenshotDir, `${Date.now()}-baseline-compare-${routeSlug}-${viewport}.png`);
  const masks = maskSelectors.map(sel => page.locator(sel));
  try {
    await page.screenshot({ path: currentPath, fullPage: false, mask: masks });
  } catch {
    return null;
  }

  // Simple file-size comparison as advisory diff (true pixel diff requires extra lib)
  try {
    const baselineSize = fs.statSync(baselinePath).size;
    const currentSize = fs.statSync(currentPath).size;
    const diff = Math.abs(baselineSize - currentSize);
    const diffPct = baselineSize > 0 ? Math.round((diff / baselineSize) * 100) : 0;
    return { diffPct, baselinePath };
  } catch {
    return null;
  }
}

/** Attach console error listener to page. Returns live array. */
export function captureConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[console.error] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`[pageerror] ${err.message}`);
  });
  return errors;
}

/** Attach network error listener. Returns live array. */
export function captureNetworkErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('response', response => {
    const status = response.status();
    if (status >= 400) {
      const url = response.url();
      // Skip external and browser-internal requests
      if (!url.startsWith('chrome') && !url.startsWith('data:')) {
        errors.push(`[${status}] ${url}`);
      }
    }
  });
  return errors;
}

/** Read a localStorage key from the page. Returns parsed value or null. */
export async function readLocalStorage(page: Page, key: string): Promise<unknown> {
  try {
    const raw = await page.evaluate((k: string): string | null => {
      try { return window.localStorage.getItem(k); } catch { return null; }
    }, key);
    if (raw === null) return null;
    try { return JSON.parse(raw); } catch { return raw; }
  } catch {
    return null;
  }
}

/**
 * Inject localStorage key-value pairs before any page loads.
 * Must be called BEFORE page.goto().
 */
export async function injectLocalStorage(
  context: BrowserContext,
  kvMap: Record<string, string>
): Promise<void> {
  await context.addInitScript((map: Record<string, string>) => {
    for (const [key, value] of Object.entries(map)) {
      try { window.localStorage.setItem(key, value); } catch { /* quota */ }
    }
  }, kvMap);
}

/** Wait for spinners/skeletons to disappear. Non-throwing. */
export async function waitForNoSpinner(page: Page, timeoutMs = 5000): Promise<void> {
  const spinnerSelectors = [
    '[class*="spinner"]',
    '[class*="skeleton"]',
    '[class*="loading"]',
    '[aria-busy="true"]',
  ];
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    let anyVisible = false;
    for (const sel of spinnerSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 200 })) { anyVisible = true; break; }
      } catch { /* not found */ }
    }
    if (!anyVisible) break;
    await page.waitForTimeout(300);
  }
}

/** Safe text content — never throws. */
export async function safeTextContent(page: Page, selector: string): Promise<string> {
  try {
    const el = page.locator(selector).first();
    const text = await el.textContent({ timeout: 2000 });
    return text?.trim() ?? '';
  } catch {
    return '';
  }
}

/** Safe click — logs if not found, never throws. Returns true if clicked. */
export async function safeClick(page: Page, selector: string, description = ''): Promise<boolean> {
  try {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 2000 })) {
      await el.click({ timeout: 3000 });
      return true;
    }
    return false;
  } catch {
    if (config.debug) console.log(`[click-miss] ${description || selector}`);
    return false;
  }
}

/** Get page title safely. */
export async function getPageTitle(page: Page): Promise<string> {
  try { return await page.title(); } catch { return ''; }
}

/** Convert a route to a filesystem-safe slug. */
export function routeToSlug(route: string): string {
  return route.replace(/^\//, '').replace(/\//g, '-').replace(/[^a-z0-9\-]/gi, '') || 'home';
}
