import type { Page } from 'playwright';
import { config } from './config';
import type { StudentMemory, FlowResult, QAIssue } from './types';
import { takeScreenshot } from './playwright-helpers';
import { snapshotLocalStorage, recordSnapshot, recordQuestion, recordVocabWord } from './student-memory';
import {
  clickStartSession,
  clickSubmit,
  clickNext,
  clickPracticeMode,
  selectAnswerChoice,
  readQuestionText,
  readVocabWord,
  clickVocabKnown,
  clickVocabMissed,
  isResultScreen,
  isFeedbackVisible,
  clickButton,
} from './interactions';
import {
  createIssue,
  practiceStuckIssue,
  questionRepetitionIssue,
} from './issue-classifier';

type Strategy = 'first' | 'last' | 'random' | 'second';
const STRATEGIES: Strategy[] = ['first', 'last', 'random', 'second'];

/** Simulate a full practice session for a given mode. */
export async function simulatePracticeFlow(
  page: Page,
  mode: string,
  memory: StudentMemory
): Promise<FlowResult> {
  const route = `/practice/${mode}`;
  const flowName = `practice:${mode}`;
  const issues: QAIssue[] = [];
  const screenshotPaths: string[] = [];

  let questionsAttempted = 0;
  let uniqueQuestionsAttempted = 0;
  let duplicatesDetected = 0;
  let completed = false;
  let stuck = false;
  let stuckReason = '';

  // Capture before snapshot
  const localStorageBefore = await snapshotLocalStorage(page, route, flowName, 'before');
  recordSnapshot(memory, { route, flowName, timing: 'before', keys: localStorageBefore });

  try {
    // Navigate to practice hub
    await page.goto(`${config.baseUrl}/practice`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);

    // Click the mode
    const modeClicked = await clickPracticeMode(page, mode);
    if (!modeClicked) {
      // Try direct navigation
      await page.goto(`${config.baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    }
    await page.waitForTimeout(1500);

    // Click Start Session
    const started = await clickStartSession(page);
    if (!started) {
      // Maybe the session starts immediately
      console.log(`[sim] No start button found for ${mode}, proceeding`);
    }
    await page.waitForTimeout(1500);

    const ss0 = await takeScreenshot(page, `practice-start-${mode}`);
    screenshotPaths.push(ss0);

    let lastQuestionText = '';
    let sameTextCount = 0;
    let strategyIdx = 0;

    for (let i = 0; i < config.maxQuestionsPerFlow; i++) {
      // Check if already on result screen
      if (await isResultScreen(page)) {
        completed = true;
        const ssResult = await takeScreenshot(page, `practice-result-${mode}`);
        screenshotPaths.push(ssResult);
        break;
      }

      // Read question text
      const questionText = await readQuestionText(page);

      if (!questionText) {
        console.log(`[sim] No question text found at step ${i} for ${mode}`);
        // Wait a bit and retry
        await page.waitForTimeout(2000);
        const retryText = await readQuestionText(page);
        if (!retryText) break;
      }

      const textToRecord = questionText || '';

      // Detect stuck: same question repeated
      if (textToRecord && textToRecord === lastQuestionText) {
        sameTextCount++;
        if (sameTextCount >= 2) {
          stuck = true;
          stuckReason = `Same question repeated ${sameTextCount + 1} times: "${textToRecord.slice(0, 60)}"`;
          const ss = await takeScreenshot(page, `stuck-${mode}-${i}`);
          screenshotPaths.push(ss);
          issues.push(practiceStuckIssue(route, textToRecord, ss));
          break;
        }
      } else {
        sameTextCount = 0;
        lastQuestionText = textToRecord;
      }

      // Record question
      if (textToRecord) {
        const isDup = recordQuestion(memory, textToRecord, route);
        questionsAttempted++;
        if (isDup) {
          duplicatesDetected++;
          const ss = await takeScreenshot(page, `dup-question-${mode}-${i}`);
          screenshotPaths.push(ss);
        } else {
          uniqueQuestionsAttempted++;
        }
      }

      // Select answer (rotate strategy)
      const strategy = STRATEGIES[strategyIdx % STRATEGIES.length];
      strategyIdx++;
      const choiceIdx = await selectAnswerChoice(page, strategy);

      if (choiceIdx >= 0) {
        memory.answersSubmitted.push(`${mode}:${i}:choice${choiceIdx}`);
      }

      // Submit answer
      const submitted = await clickSubmit(page);
      if (!submitted) {
        // Try pressing Enter
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
      }

      await page.waitForTimeout(800);

      // Check feedback
      const hasFeedback = await isFeedbackVisible(page);

      // Screenshot at milestone questions
      if (i === 0 || i === 9 || i === 19 || hasFeedback) {
        const ssMid = await takeScreenshot(page, `practice-q${i}-${mode}`);
        if (i === 0 || i === 9 || i === 19) screenshotPaths.push(ssMid);
      }

      // Click Next
      const nextClicked = await clickNext(page);
      if (!nextClicked) {
        await page.waitForTimeout(1000);
        const nextClicked2 = await clickNext(page);
        if (!nextClicked2) {
          console.log(`[sim] No Next button at step ${i} for ${mode}`);
          if (!hasFeedback) {
            // If no feedback AND no next, might be stuck
            break;
          }
        }
      }

      await page.waitForTimeout(600);
    }

    // Check final result screen
    if (!completed && await isResultScreen(page)) {
      completed = true;
      const ssResult = await takeScreenshot(page, `practice-final-${mode}`);
      screenshotPaths.push(ssResult);
    }

    // Report repetition issues if threshold exceeded
    if (duplicatesDetected > config.maxDuplicateQuestionsAllowed) {
      const ss = await takeScreenshot(page, `repetition-${mode}`);
      issues.push(questionRepetitionIssue(route, duplicatesDetected, questionsAttempted, ss));
    }

    memory.practiceFlowsCompleted.push(flowName);

  } catch (err) {
    console.error(`[sim] Practice flow ${mode} error:`, err instanceof Error ? err.message : err);
    issues.push(createIssue({
      severity: 'critical',
      title: `Practice flow crashed: ${mode}`,
      description: err instanceof Error ? err.message : String(err),
      route,
      action: 'practice session',
      expected: 'Practice session completes normally',
      actual: `Exception: ${err instanceof Error ? err.message : err}`,
      suggestedCause: 'Unhandled error in practice component or selector failure',
      suggestedFixArea: 'src/components/practice/',
      reproSteps: [`Navigate to ${route}`, 'Start a session'],
      affectsStudentLearning: true,
    }));
    stuck = true;
    stuckReason = err instanceof Error ? err.message : String(err);
    memory.practiceFlowsStuck.push(flowName);
  }

  // Capture after snapshot
  const localStorageAfter = await snapshotLocalStorage(page, route, flowName, 'after');
  recordSnapshot(memory, { route, flowName, timing: 'after', keys: localStorageAfter });

  // Check for localStorage changes
  const localStorageChanges = diffLocalStorage(localStorageBefore, localStorageAfter);

  return {
    flowName,
    route,
    questionsAttempted,
    uniqueQuestionsAttempted,
    duplicatesDetected,
    wordsAttempted: 0,
    uniqueWordsAttempted: 0,
    completed,
    stuck,
    stuckReason,
    issues,
    screenshotPaths,
    localStorageBefore,
    localStorageAfter,
    localStorageChanges,
  };
}

/** Simulate the vocab swipe trainer. */
export async function simulateVocabFlow(
  page: Page,
  memory: StudentMemory
): Promise<FlowResult> {
  const route = '/vocab/swipe';
  const flowName = 'vocab:swipe';
  const issues: QAIssue[] = [];
  const screenshotPaths: string[] = [];

  let wordsAttempted = 0;
  let uniqueWordsAttempted = 0;
  let duplicatesDetected = 0;
  let completed = false;
  let stuck = false;
  let stuckReason = '';

  const localStorageBefore = await snapshotLocalStorage(page, route, flowName, 'before');
  recordSnapshot(memory, { route, flowName, timing: 'before', keys: localStorageBefore });

  try {
    await page.goto(`${config.baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);

    const ss0 = await takeScreenshot(page, 'vocab-swipe-start');
    screenshotPaths.push(ss0);

    let lastWord = '';
    let sameWordCount = 0;
    let useKnown = true;

    for (let i = 0; i < config.maxWordsPerFlow; i++) {
      const word = await readVocabWord(page);

      if (!word) {
        await page.waitForTimeout(1500);
        const word2 = await readVocabWord(page);
        if (!word2) {
          console.log(`[sim] No vocab word at step ${i}`);
          break;
        }
      }

      const wordText = word || '';

      // Detect stuck
      if (wordText && wordText === lastWord) {
        sameWordCount++;
        if (sameWordCount >= 2) {
          stuck = true;
          stuckReason = `Same vocab word repeated: "${wordText}"`;
          const ss = await takeScreenshot(page, `vocab-stuck-${i}`);
          screenshotPaths.push(ss);
          issues.push(createIssue({
            severity: 'critical',
            title: 'Vocab swipe stuck — same word shown repeatedly',
            description: `Word "${wordText}" appeared ${sameWordCount + 1} times without advancing`,
            route,
            action: 'click known/missed',
            expected: 'Next word appears after clicking known/missed',
            actual: 'Same word shown again',
            screenshotPath: ss,
            suggestedCause: 'Swipe state not advancing after button click',
            suggestedFixArea: 'src/components/vocab/VocabSwipeTrainer.tsx',
            reproSteps: [`Navigate to ${route}`, 'Click known/missed', 'Observe same word repeats'],
            affectsStudentLearning: true,
            affectsRepetition: true,
          }));
          break;
        }
      } else {
        sameWordCount = 0;
        lastWord = wordText;
      }

      if (wordText) {
        const isDup = recordVocabWord(memory, wordText, route);
        wordsAttempted++;
        if (isDup) {
          duplicatesDetected++;
          const ss = await takeScreenshot(page, `dup-word-${i}`);
          screenshotPaths.push(ss);
        } else {
          uniqueWordsAttempted++;
        }
      }

      // Alternate known/missed
      let clicked = false;
      if (useKnown) {
        clicked = await clickVocabKnown(page);
        if (!clicked) clicked = await clickVocabMissed(page);
      } else {
        clicked = await clickVocabMissed(page);
        if (!clicked) clicked = await clickVocabKnown(page);
      }
      useKnown = !useKnown;

      if (!clicked) {
        console.log(`[sim] Could not click known/missed at step ${i}`);
        break;
      }

      await page.waitForTimeout(700);
    }

    completed = true;
    memory.practiceFlowsCompleted.push(flowName);

    if (duplicatesDetected > config.maxDuplicateWordsAllowed) {
      issues.push(createIssue({
        severity: 'medium',
        title: `Vocab: ${duplicatesDetected} duplicate words in ${wordsAttempted} shown`,
        description: `${duplicatesDetected} words appeared more than once in the vocab swipe session`,
        route,
        action: 'vocab swipe session',
        expected: 'Each word appears once per session unless in explicit review mode',
        actual: `${duplicatesDetected} duplicates detected`,
        suggestedCause: 'Spaced repetition queue not deduplicating within a single session',
        suggestedFixArea: 'src/lib/vocab/spaced-repetition.ts, src/lib/vocab/vocab-store.ts',
        reproSteps: [`Navigate to ${route}`, 'Swipe through words', 'Note repeated words'],
        affectsStudentLearning: true,
        affectsRepetition: true,
      }));
    }

  } catch (err) {
    console.error('[sim] Vocab flow error:', err instanceof Error ? err.message : err);
    stuck = true;
    stuckReason = err instanceof Error ? err.message : String(err);
    memory.practiceFlowsStuck.push(flowName);
  }

  const localStorageAfter = await snapshotLocalStorage(page, route, flowName, 'after');
  recordSnapshot(memory, { route, flowName, timing: 'after', keys: localStorageAfter });
  const localStorageChanges = diffLocalStorage(localStorageBefore, localStorageAfter);

  return {
    flowName,
    route,
    questionsAttempted: 0,
    uniqueQuestionsAttempted: 0,
    duplicatesDetected: 0,
    wordsAttempted,
    uniqueWordsAttempted,
    completed,
    stuck,
    stuckReason,
    issues,
    screenshotPaths,
    localStorageBefore,
    localStorageAfter,
    localStorageChanges,
  };
}

/** Simulate the full AMIRNET simulation. */
export async function simulateSimulation(
  page: Page,
  memory: StudentMemory
): Promise<FlowResult> {
  const route = '/simulation';
  const flowName = 'simulation:standard';
  const issues: QAIssue[] = [];
  const screenshotPaths: string[] = [];
  let questionsAttempted = 0;
  let uniqueQuestionsAttempted = 0;
  let duplicatesDetected = 0;
  let completed = false;
  let stuck = false;
  let stuckReason = '';

  const localStorageBefore = await snapshotLocalStorage(page, route, flowName, 'before');
  recordSnapshot(memory, { route, flowName, timing: 'before', keys: localStorageBefore });

  try {
    await page.goto(`${config.baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);

    const ss0 = await takeScreenshot(page, 'sim-start');
    screenshotPaths.push(ss0);

    // Try to start standard simulation
    const startPatterns = [/הדמיה סטנדרטית/, /Standard/i, /Start/i, /התחל/];
    let started = false;
    for (const p of startPatterns) {
      if (await clickButton(page, p)) { started = true; break; }
    }

    if (!started) {
      console.log('[sim] Could not start simulation');
      memory.practiceFlowsStuck.push(flowName);
      stuck = true;
      stuckReason = 'Could not find simulation start button';
    } else {
      await page.waitForTimeout(1500);

      let lastQuestion = '';
      let sameCount = 0;

      for (let i = 0; i < config.maxQuestionsPerFlow; i++) {
        if (await isResultScreen(page)) { completed = true; break; }

        const questionText = await readQuestionText(page);
        if (!questionText) { await page.waitForTimeout(1500); break; }

        if (questionText === lastQuestion) {
          sameCount++;
          if (sameCount >= 3) { stuck = true; stuckReason = `Stuck: ${questionText.slice(0, 60)}`; break; }
        } else {
          sameCount = 0;
          lastQuestion = questionText;
        }

        const isDup = recordQuestion(memory, questionText, route);
        questionsAttempted++;
        if (isDup) duplicatesDetected++;
        else uniqueQuestionsAttempted++;

        const strategy = STRATEGIES[i % STRATEGIES.length];
        await selectAnswerChoice(page, strategy);
        await clickSubmit(page);
        await page.waitForTimeout(600);
        await clickNext(page);
        await page.waitForTimeout(500);
      }

      const ssFinal = await takeScreenshot(page, 'sim-final');
      screenshotPaths.push(ssFinal);
      memory.practiceFlowsCompleted.push(flowName);
    }
  } catch (err) {
    stuck = true;
    stuckReason = err instanceof Error ? err.message : String(err);
    memory.practiceFlowsStuck.push(flowName);
  }

  const localStorageAfter = await snapshotLocalStorage(page, route, flowName, 'after');
  recordSnapshot(memory, { route, flowName, timing: 'after', keys: localStorageAfter });

  return {
    flowName, route, questionsAttempted, uniqueQuestionsAttempted,
    duplicatesDetected, wordsAttempted: 0, uniqueWordsAttempted: 0,
    completed, stuck, stuckReason, issues, screenshotPaths,
    localStorageBefore, localStorageAfter,
    localStorageChanges: diffLocalStorage(localStorageBefore, localStorageAfter),
  };
}

/** Simulate the challenge mode. */
export async function simulateChallenge(
  page: Page,
  memory: StudentMemory
): Promise<FlowResult> {
  const route = '/challenge';
  const flowName = 'challenge';
  const issues: QAIssue[] = [];
  const screenshotPaths: string[] = [];
  let questionsAttempted = 0;
  let uniqueQuestionsAttempted = 0;
  let duplicatesDetected = 0;
  let completed = false;
  let stuck = false;
  let stuckReason = '';

  const localStorageBefore = await snapshotLocalStorage(page, route, flowName, 'before');
  recordSnapshot(memory, { route, flowName, timing: 'before', keys: localStorageBefore });

  try {
    await page.goto(`${config.baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);

    const ss0 = await takeScreenshot(page, 'challenge-start');
    screenshotPaths.push(ss0);

    const startPatterns = [/התחל/, /Start/i, /Begin/i, /אתגר/];
    let started = false;
    for (const p of startPatterns) {
      if (await clickButton(page, p)) { started = true; break; }
    }

    if (started) {
      await page.waitForTimeout(1000);

      for (let i = 0; i < Math.min(10, config.maxQuestionsPerFlow); i++) {
        if (await isResultScreen(page)) { completed = true; break; }

        const questionText = await readQuestionText(page);
        if (!questionText) break;

        const isDup = recordQuestion(memory, questionText, route);
        questionsAttempted++;
        if (isDup) duplicatesDetected++;
        else uniqueQuestionsAttempted++;

        await selectAnswerChoice(page, STRATEGIES[i % STRATEGIES.length]);
        await clickSubmit(page);
        await page.waitForTimeout(500);
        await clickNext(page);
        await page.waitForTimeout(400);
      }

      const ssFinal = await takeScreenshot(page, 'challenge-final');
      screenshotPaths.push(ssFinal);
      memory.practiceFlowsCompleted.push(flowName);
    } else {
      stuck = true;
      stuckReason = 'Could not find challenge start button';
      memory.practiceFlowsStuck.push(flowName);
    }
  } catch (err) {
    stuck = true;
    stuckReason = err instanceof Error ? err.message : String(err);
    memory.practiceFlowsStuck.push(flowName);
  }

  const localStorageAfter = await snapshotLocalStorage(page, route, flowName, 'after');
  recordSnapshot(memory, { route, flowName, timing: 'after', keys: localStorageAfter });

  return {
    flowName, route, questionsAttempted, uniqueQuestionsAttempted,
    duplicatesDetected, wordsAttempted: 0, uniqueWordsAttempted: 0,
    completed, stuck, stuckReason, issues, screenshotPaths,
    localStorageBefore, localStorageAfter,
    localStorageChanges: diffLocalStorage(localStorageBefore, localStorageAfter),
  };
}

/** Diff two localStorage snapshots and return human-readable change descriptions. */
function diffLocalStorage(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): string[] {
  const changes: string[] = [];
  for (const key of Object.keys({ ...before, ...after })) {
    const b = before[key];
    const a = after[key];

    if (JSON.stringify(b) === JSON.stringify(a)) continue;

    if (b === null && a !== null) {
      changes.push(`${key}: added`);
    } else if (b !== null && a === null) {
      changes.push(`${key}: removed`);
    } else {
      // Try to provide a meaningful diff
      if (Array.isArray(b) && Array.isArray(a)) {
        changes.push(`${key}: length ${(b as unknown[]).length} → ${(a as unknown[]).length}`);
      } else if (typeof b === 'object' && typeof a === 'object' && b && a) {
        const bObj = b as Record<string, unknown>;
        const aObj = a as Record<string, unknown>;
        const changedKeys = Object.keys({ ...bObj, ...aObj }).filter(
          k => JSON.stringify(bObj[k]) !== JSON.stringify(aObj[k])
        ).slice(0, 5);
        changes.push(`${key}: changed fields: ${changedKeys.join(', ')}`);
      } else {
        changes.push(`${key}: changed`);
      }
    }
  }
  return changes;
}
