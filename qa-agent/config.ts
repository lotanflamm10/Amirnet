import path from 'path';

const args = process.argv.slice(2);

function hasFlag(flag: string): boolean {
  return args.includes(flag);
}

export const STUDENT_MODE: 'fresh' | 'returning' = hasFlag('--returning') ? 'returning' : 'fresh';
export const IS_HEADED = hasFlag('--headed') || hasFlag('--debug');
export const IS_DEBUG = hasFlag('--debug');
export const SLOW_MO = IS_DEBUG ? 400 : 0;

const QA_DIR = __dirname;
const ROOT_DIR = path.resolve(QA_DIR, '..');

export const config = {
  baseUrl: 'http://localhost:3000',
  studentMode: STUDENT_MODE,
  headless: !IS_HEADED,
  slowMo: SLOW_MO,
  debug: IS_DEBUG,

  maxScreens: 30,
  maxActionsPerScreen: 12,
  maxQuestionsPerFlow: 20,
  maxWordsPerFlow: 15,
  maxDuplicateQuestionsAllowed: 2,
  maxDuplicateWordsAllowed: 2,

  viewports: [
    { width: 1280, height: 800, name: 'desktop' as const },
    { width: 390,  height: 844, name: 'mobile'  as const },
  ],

  screenshotDir:       path.join(ROOT_DIR, 'qa-report', 'screenshots'),
  baselineDir:         path.join(ROOT_DIR, 'qa-report', 'baselines'),
  reportDir:           path.join(ROOT_DIR, 'qa-report'),
  tracesDir:           path.join(ROOT_DIR, 'qa-report', 'traces'),
  previousResultsPath: path.join(ROOT_DIR, 'qa-report', 'amirnet-qa-results.json'),
  memoryTempPath:      path.join(ROOT_DIR, 'qa-report', 'amirnet-qa-memory-temp.json'),

  allowedHosts: ['localhost', '127.0.0.1'],
  blockedKeywords: ['logout', 'delete', 'reset', 'payment', 'remove', 'clear', 'destroy', 'mailto:', 'tel:'],

  localStorageKeysToSnapshot: [
    'amirnet-qhistory-v1',
    'amirnet-session-current',
    'amirnet-vocab-v1',
    'amirnet-progress-v1',
    'amirnet-sim-current',
  ],

  practiceModesToTest: [
    'sentenceCompletion',
    'restatements',
    'grammar',
    'wordFormation',
    'mixed',
    'smartReview',
  ],

  priorityRoutes: [
    '/',
    '/app',
    '/practice',
    '/practice/sentenceCompletion',
    '/practice/restatements',
    '/practice/grammar',
    '/practice/wordFormation',
    '/practice/mixed',
    '/practice/smartReview',
    '/practice/reading',
    '/practice/textCompletion',
    '/practice/lectureQuestions',
    '/practice/writingTask',
    '/vocab',
    '/vocab/swipe',
    '/vocab/list',
    '/vocab/starred',
    '/vocab/missed',
    '/vocab/weak',
    '/simulation',
    '/challenge',
    '/diagnostic',
    '/learning-engine',
    '/review',
    '/account',
    '/pricing',
  ],

  dynamicMaskSelectors: [
    '[class*="timer"]',
    '[class*="clock"]',
    '[class*="score"]',
    '[class*="counter"]',
    '[class*="streak"]',
    '[class*="spinner"]',
    '[class*="loader"]',
    '[class*="skeleton"]',
    'time',
  ],
} as const;

export type ViewportName = 'desktop' | 'mobile';
