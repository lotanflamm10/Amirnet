import type { Page } from 'playwright';
import { config } from './config';

/** Check if a text/href matches blocked keywords. */
export function isBlocked(text: string): boolean {
  const lower = text.toLowerCase();
  return config.blockedKeywords.some(k => lower.includes(k));
}

/** Check if a URL is an internal AMIRNET link. */
export function isInternalLink(href: string | null, baseUrl: string): boolean {
  if (!href) return false;
  if (href.startsWith('#')) return false;
  if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return false;
  try {
    const url = new URL(href, baseUrl);
    return (config.allowedHosts as readonly string[]).includes(url.hostname);
  } catch {
    return false;
  }
}

/** Extract all internal links from the current page. */
export async function extractInternalLinks(page: Page, baseUrl: string): Promise<string[]> {
  try {
    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]'))
        .map(a => (a as HTMLAnchorElement).href)
    );
    const seen = new Set<string>();
    const links: string[] = [];
    for (const href of hrefs) {
      try {
        const url = new URL(href);
        const path = url.pathname;
        if (
          isInternalLink(href, baseUrl) &&
          !seen.has(path) &&
          !isBlocked(href)
        ) {
          seen.add(path);
          links.push(path);
        }
      } catch { /* invalid url */ }
    }
    return links;
  } catch {
    return [];
  }
}

/** Click a nav link by its href path. Returns true if found and clicked. */
export async function clickNavItem(page: Page, href: string): Promise<boolean> {
  try {
    const link = page.locator(`a[href="${href}"]`).first();
    if (await link.isVisible({ timeout: 2000 })) {
      await link.click({ timeout: 3000 });
      return true;
    }
  } catch { /* not found */ }
  return false;
}

/** Click a button by visible text (supports Hebrew and English). Returns true if clicked. */
export async function clickButton(page: Page, textPattern: string | RegExp): Promise<boolean> {
  try {
    const btn = page.getByRole('button', { name: textPattern }).first();
    if (await btn.isVisible({ timeout: 2000 })) {
      await btn.click({ timeout: 3000 });
      return true;
    }
  } catch { /* not found */ }
  try {
    const btn = page.locator(`button:has-text("${textPattern}")`).first();
    if (await btn.isVisible({ timeout: 2000 })) {
      await btn.click({ timeout: 3000 });
      return true;
    }
  } catch { /* not found */ }
  return false;
}

/** Click the submit button for a practice question. */
export async function clickSubmit(page: Page): Promise<boolean> {
  const patterns = [
    /שלח תשובה/,
    /Submit/i,
    /שלח/,
    /submit/i,
  ];
  for (const p of patterns) {
    if (await clickButton(page, p)) return true;
  }
  // Fallback: button[type=submit]
  try {
    const btn = page.locator('button[type="submit"]').first();
    if (await btn.isVisible({ timeout: 1000 })) {
      await btn.click({ timeout: 2000 });
      return true;
    }
  } catch { /* ignore */ }
  return false;
}

/** Click the next question button. */
export async function clickNext(page: Page): Promise<boolean> {
  const patterns = [
    /הבאה/,
    /הבא/,
    /Next/i,
    /Continue/i,
    /המשך/,
  ];
  for (const p of patterns) {
    if (await clickButton(page, p)) return true;
  }
  return false;
}

/** Click the "Start session" button. */
export async function clickStartSession(page: Page): Promise<boolean> {
  const patterns = [
    /התחל סשן/,
    /Start session/i,
    /התחל/,
    /Start/i,
    /התחלה/,
  ];
  for (const p of patterns) {
    if (await clickButton(page, p)) return true;
  }
  return false;
}

export type AnswerStrategy = 'first' | 'last' | 'random' | 'second';

/**
 * Select an answer choice in a practice question.
 * Returns the index of the selected option, or -1 if none found.
 */
export async function selectAnswerChoice(
  page: Page,
  strategy: AnswerStrategy
): Promise<number> {
  // Find answer choices — try multiple selectors
  const choiceSelectors = [
    'button[data-choice]',
    '[role="radio"]',
    'input[type="radio"]',
    'button.choice',
    'button.option',
    '[class*="choice"]',
    '[class*="option"]',
    'label input[type="radio"]',
  ];

  let choices: { locator: ReturnType<Page['locator']>; count: number }[] = [];

  for (const sel of choiceSelectors) {
    try {
      const loc = page.locator(sel);
      const count = await loc.count();
      if (count >= 2) {
        choices = [{ locator: loc, count }];
        break;
      }
    } catch { /* next */ }
  }

  // If still no choices, look for any visible button group
  if (choices.length === 0) {
    try {
      // Look for groups of buttons that look like answer options
      const btns = page.locator('button').filter({
        hasNot: page.locator('[aria-label]'),
      });
      const count = await btns.count();
      if (count >= 2 && count <= 6) {
        choices = [{ locator: btns, count }];
      }
    } catch { /* ignore */ }
  }

  if (choices.length === 0 || choices[0].count === 0) return -1;

  const { locator, count } = choices[0];

  let idx = 0;
  switch (strategy) {
    case 'first':  idx = 0; break;
    case 'last':   idx = count - 1; break;
    case 'second': idx = Math.min(1, count - 1); break;
    case 'random': idx = Math.floor(Math.random() * count); break;
  }

  try {
    const el = locator.nth(idx);
    if (await el.isVisible({ timeout: 2000 })) {
      await el.click({ timeout: 3000 });
      return idx;
    }
  } catch { /* ignore */ }

  // Try first available
  for (let i = 0; i < count; i++) {
    try {
      const el = locator.nth(i);
      if (await el.isVisible({ timeout: 1000 })) {
        await el.click({ timeout: 2000 });
        return i;
      }
    } catch { /* next */ }
  }
  return -1;
}

/** Read current question text from the page. */
export async function readQuestionText(page: Page): Promise<string> {
  const selectors = [
    'h2',
    '[class*="question-text"]',
    '[class*="question"]',
    'p.question',
    '[data-question]',
    'article h2',
    'article h3',
    '.card h2',
    '.card p',
  ];

  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1000 })) {
        const text = await el.textContent({ timeout: 1000 });
        if (text && text.trim().length > 10) return text.trim();
      }
    } catch { /* next */ }
  }

  // Fallback: get longest visible text block
  try {
    const texts = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('p, h1, h2, h3, h4'));
      return els
        .map(el => (el.textContent ?? '').trim())
        .filter(t => t.length > 15)
        .sort((a, b) => b.length - a.length);
    });
    if (texts.length > 0) return texts[0].slice(0, 300);
  } catch { /* ignore */ }

  return '';
}

/** Read the current vocab word from the swipe card. */
export async function readVocabWord(page: Page): Promise<string> {
  const selectors = [
    'h1',
    'h2',
    '[class*="word"]',
    '[class*="card"] h2',
    '[class*="card"] h1',
    '[class*="flashcard"] h2',
    '[class*="vocab"] h2',
    'article h1',
    'article h2',
  ];

  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1000 })) {
        const text = await el.textContent({ timeout: 1000 });
        if (text && text.trim().length > 0) return text.trim();
      }
    } catch { /* next */ }
  }
  return '';
}

/** Click "I knew it" button in vocab swipe. */
export async function clickVocabKnown(page: Page): Promise<boolean> {
  const patterns = [/ידעתי/, /I knew/i, /knew/i, /✓/];
  for (const p of patterns) {
    if (await clickButton(page, p)) return true;
  }
  return false;
}

/** Click "I didn't know it" / "Review again" button in vocab swipe. */
export async function clickVocabMissed(page: Page): Promise<boolean> {
  const patterns = [/לא ידעתי/, /Review again/i, /review/i, /didn't know/i];
  for (const p of patterns) {
    if (await clickButton(page, p)) return true;
  }
  return false;
}

/** Check if a result/done screen is showing. */
export async function isResultScreen(page: Page): Promise<boolean> {
  const patterns = [
    /הסשן הסתיים/,
    /Session complete/i,
    /סיום/,
    /ציון/,
    /accuracy/i,
    /דיוק/,
    /Practice again/i,
    /תרגל שוב/,
  ];
  for (const p of patterns) {
    try {
      const el = page.getByText(p).first();
      if (await el.isVisible({ timeout: 500 })) return true;
    } catch { /* next */ }
  }
  return false;
}

/** Check if the feedback area is visible after answering. */
export async function isFeedbackVisible(page: Page): Promise<boolean> {
  const patterns = [/נכון/i, /לא נכון/i, /Correct/i, /Incorrect/i, /✓/, /✗/];
  for (const p of patterns) {
    try {
      const el = page.getByText(p).first();
      if (await el.isVisible({ timeout: 500 })) return true;
    } catch { /* next */ }
  }
  return false;
}

/** Click a mode card on the practice hub page. */
export async function clickPracticeMode(page: Page, mode: string): Promise<boolean> {
  // Mode names in Hebrew (approximate)
  const modeMap: Record<string, string[]> = {
    sentenceCompletion: ['השלמת משפטים', 'Sentence Completion', 'sentenceCompletion'],
    restatements:       ['ניסוח מחדש', 'Restatements', 'restatements', 'paraphrasing'],
    grammar:            ['דקדוק', 'Grammar', 'grammar'],
    wordFormation:      ['יצירת מילה', 'Word Formation', 'wordFormation'],
    mixed:              ['מעורב', 'Mixed', 'mixed'],
    smartReview:        ['סקירה חכמה', 'Smart Review', 'smartReview'],
    reading:            ['קריאה', 'Reading', 'reading'],
    textCompletion:     ['השלמת טקסט', 'Text Completion', 'textCompletion'],
    lectureQuestions:   ['שאלות הרצאה', 'Lecture Questions', 'lectureQuestions'],
    writingTask:        ['מטלת כתיבה', 'Writing Task', 'writingTask'],
  };

  const labels = modeMap[mode] ?? [mode];

  // Try clicking a link directly
  try {
    const link = page.locator(`a[href="/practice/${mode}"]`).first();
    if (await link.isVisible({ timeout: 2000 })) {
      await link.click({ timeout: 3000 });
      return true;
    }
  } catch { /* ignore */ }

  // Try text-based button/card
  for (const label of labels) {
    try {
      const el = page.getByText(label, { exact: false }).first();
      if (await el.isVisible({ timeout: 1000 })) {
        await el.click({ timeout: 2000 });
        return true;
      }
    } catch { /* next */ }
  }
  return false;
}
