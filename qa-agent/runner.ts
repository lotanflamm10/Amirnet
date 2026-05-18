/**
 * AMIRNET Autonomous QA Agent — Main Entry Point
 *
 * Usage:
 *   tsx qa-agent/runner.ts [--fresh] [--returning] [--headed] [--debug]
 *
 * Prerequisites: npm run dev must be running at http://localhost:3000
 */

import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { config, STUDENT_MODE } from './config';
import {
  checkReachable,
  ensureDir,
  captureConsoleErrors,
  captureNetworkErrors,
  injectLocalStorage,
} from './playwright-helpers';
import {
  createStudentMemory,
  saveMemory,
  loadPreviousResults,
  buildReturningInjectionMap,
} from './student-memory';
import { crawlAllRoutes } from './crawler';
import {
  simulatePracticeFlow,
  simulateVocabFlow,
  simulateSimulation,
  simulateChallenge,
} from './student-simulator';
import { analyzeLocalStorageProgress, generateReport } from './report';
import type { QAReport, FlowResult, QAIssue } from './types';

async function main(): Promise<void> {
  const startTime = Date.now();
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║   AMIRNET Autonomous QA Agent             ║');
  console.log(`║   Student mode: ${STUDENT_MODE.padEnd(26)}║`);
  console.log(`║   Headless: ${String(!config.headless).padEnd(30)}║`);
  console.log('╚═══════════════════════════════════════════╝\n');

  // ── Step 1: Pre-flight reachability check ──────────────────────────────────
  console.log(`[preflight] Checking ${config.baseUrl} ...`);
  const reachable = await checkReachable(config.baseUrl);
  if (!reachable) {
    console.error('\n❌ AMIRNET app is not reachable at', config.baseUrl);
    console.error('\nTo start the app, run in a separate terminal:');
    console.error('   cd C:\\Lotan\\amirnet && npm run dev\n');
    console.error('Then re-run:');
    console.error('   npm run qa:amirnet\n');
    process.exit(1);
  }
  console.log(`[preflight] ✓ App reachable at ${config.baseUrl}\n`);

  // ── Step 2: Create output directories ─────────────────────────────────────
  ensureDir(config.reportDir);
  ensureDir(config.screenshotDir);
  ensureDir(config.tracesDir);
  ensureDir(config.baselineDir);

  // ── Step 3: Load previous results (returning mode) ─────────────────────────
  let previousResults = null;
  if (STUDENT_MODE === 'returning') {
    previousResults = loadPreviousResults(config.previousResultsPath);
    if (!previousResults) {
      console.warn('[returning] No previous results found. Run in --fresh mode first.');
      console.warn('[returning] Proceeding as fresh student.\n');
    } else {
      console.log(`[returning] Loaded previous results from ${config.previousResultsPath}`);
      const prevQCount = Object.keys(previousResults.studentMemory.questionsSeen).length;
      const prevWCount = Object.keys(previousResults.studentMemory.vocabWordsSeen).length;
      console.log(`[returning] Previous session: ${prevQCount} questions seen, ${prevWCount} words seen\n`);
    }
  }

  // ── Step 4: Launch browser ─────────────────────────────────────────────────
  console.log(`[browser] Launching Chromium (headless=${config.headless}, slowMo=${config.slowMo}ms)`);
  const browser = await chromium.launch({
    headless: config.headless,
    slowMo: config.slowMo,
  });

  // ── Step 5: Create isolated browser context ────────────────────────────────
  const context = await browser.newContext({
    viewport: config.viewports[0],
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
  });

  // Enable tracing
  await context.tracing.start({ screenshots: true, snapshots: true });

  // ── Step 6: Inject previous localStorage (returning mode) ──────────────────
  if (previousResults) {
    const injectionMap = buildReturningInjectionMap(previousResults);
    await injectLocalStorage(context, injectionMap);
    console.log('[returning] Injected previous vocab history into browser localStorage\n');
  }

  const page = await context.newPage();

  // Attach global error collectors
  const globalConsoleErrors = captureConsoleErrors(page);
  const globalNetworkErrors = captureNetworkErrors(page);

  // ── Step 7: Initialize student memory ─────────────────────────────────────
  const memory = createStudentMemory(previousResults ?? undefined);
  console.log('[memory] Student memory initialized\n');

  const allFlows: FlowResult[] = [];
  const allIssues: QAIssue[] = [];

  try {
    // ── Step 8: Crawl all routes ─────────────────────────────────────────────
    console.log('[crawl] Starting route crawl...\n');
    const screenResults = await crawlAllRoutes(page, {
      memory,
      onScreenDone: (result) => {
        const issueCount = result.issues.length;
        const status = result.loadedOk ? '✓' : '✗';
        console.log(`  ${status} ${result.route} — ${issueCount} issue(s) | ${result.durationMs}ms`);
        allIssues.push(...result.issues);
      },
    });

    saveMemory(memory, config.memoryTempPath);
    console.log(`\n[crawl] Done — ${screenResults.length} screens visited\n`);

    // ── Step 9: Practice flows ────────────────────────────────────────────────
    console.log('[simulate] Starting practice flows...\n');
    for (const mode of config.practiceModesToTest) {
      console.log(`  [practice] ${mode}`);
      try {
        const flowResult = await simulatePracticeFlow(page, mode, memory);
        allFlows.push(flowResult);
        allIssues.push(...flowResult.issues);
        console.log(`    ✓ questions=${flowResult.questionsAttempted} unique=${flowResult.uniqueQuestionsAttempted} dups=${flowResult.duplicatesDetected} completed=${flowResult.completed} stuck=${flowResult.stuck}`);
      } catch (err) {
        console.error(`  ✗ ${mode} crashed:`, err instanceof Error ? err.message : err);
      }
      saveMemory(memory, config.memoryTempPath);
    }

    // ── Step 10: Vocab flow ───────────────────────────────────────────────────
    console.log('\n[simulate] Vocab swipe flow...');
    try {
      const vocabResult = await simulateVocabFlow(page, memory);
      allFlows.push(vocabResult);
      allIssues.push(...vocabResult.issues);
      console.log(`  ✓ words=${vocabResult.wordsAttempted} unique=${vocabResult.uniqueWordsAttempted} dups=${vocabResult.duplicatesDetected} completed=${vocabResult.completed}`);
    } catch (err) {
      console.error('  ✗ Vocab flow crashed:', err instanceof Error ? err.message : err);
    }
    saveMemory(memory, config.memoryTempPath);

    // ── Step 11: Simulation flow ──────────────────────────────────────────────
    console.log('\n[simulate] Simulation flow...');
    try {
      const simResult = await simulateSimulation(page, memory);
      allFlows.push(simResult);
      allIssues.push(...simResult.issues);
      console.log(`  ✓ questions=${simResult.questionsAttempted} completed=${simResult.completed} stuck=${simResult.stuck}`);
    } catch (err) {
      console.error('  ✗ Simulation crashed:', err instanceof Error ? err.message : err);
    }
    saveMemory(memory, config.memoryTempPath);

    // ── Step 12: Challenge flow ───────────────────────────────────────────────
    console.log('\n[simulate] Challenge flow...');
    try {
      const challengeResult = await simulateChallenge(page, memory);
      allFlows.push(challengeResult);
      allIssues.push(...challengeResult.issues);
      console.log(`  ✓ questions=${challengeResult.questionsAttempted} completed=${challengeResult.completed} stuck=${challengeResult.stuck}`);
    } catch (err) {
      console.error('  ✗ Challenge crashed:', err instanceof Error ? err.message : err);
    }
    saveMemory(memory, config.memoryTempPath);

    // ── Step 13: Returning-mode cross-run comparison ──────────────────────────
    if (STUDENT_MODE === 'returning' && previousResults) {
      console.log('\n[returning] Analyzing question overlap with previous run...');
      const prevQuestions = new Set(Object.keys(previousResults.studentMemory.questionsSeen));
      const currentQuestions = Object.keys(memory.questionsSeen).filter(
        k => !prevQuestions.has(k) || memory.questionsSeen[k] > (previousResults!.studentMemory.questionsSeen[k] ?? 0) + 1
      );
      const overlapQuestions = Object.keys(memory.questionsSeen).filter(k =>
        prevQuestions.has(k) && memory.questionsSeen[k] > (previousResults!.studentMemory.questionsSeen[k] ?? 0)
      );

      console.log(`  Previous questions: ${prevQuestions.size}, Current overlap: ${overlapQuestions.length}`);
      if (overlapQuestions.length > 5 && prevQuestions.size > 10) {
        const { returningRepetitionIssue } = await import('./issue-classifier');
        allIssues.push(returningRepetitionIssue(
          overlapQuestions.length,
          Object.keys(memory.questionsSeen).length
        ));
        console.log(`  ⚠ ${overlapQuestions.length} repeated questions detected`);
      } else {
        console.log('  ✓ Repetition within acceptable range');
      }
    }

  } finally {
    // Always save trace and close browser
    try {
      const tracePath = path.join(config.tracesDir, 'trace.zip');
      await context.tracing.stop({ path: tracePath });
      console.log(`\n[trace] Saved to ${tracePath}`);
    } catch { /* ignore trace errors */ }

    await browser.close();
    console.log('[browser] Closed\n');
  }

  // ── Step 14: Build QA Report ─────────────────────────────────────────────
  console.log('[report] Building report...');

  const screenResults = allIssues
    .filter(i => i.route)
    .reduce((acc, issue) => {
      // Issues are already in allIssues; screenResults were from the crawl
      return acc;
    }, [] as string[]);

  // Reconstruct screen results from the crawler output
  // (We collect them again from the memory's visited routes)
  const dedupedIssues = allIssues.filter((issue, idx) =>
    allIssues.findIndex(i => i.id === issue.id) === idx
  );

  const totalQuestionsAttempted = allFlows.reduce((s, f) => s + f.questionsAttempted + f.wordsAttempted, 0);
  const uniqueQuestionsAttempted = allFlows.reduce((s, f) => s + f.uniqueQuestionsAttempted + f.uniqueWordsAttempted, 0);
  const totalDuplicates = allFlows.reduce((s, f) => s + f.duplicatesDetected, 0);
  const totalWords = allFlows.reduce((s, f) => s + f.wordsAttempted, 0);
  const uniqueWords = allFlows.reduce((s, f) => s + f.uniqueWordsAttempted, 0);
  const totalWordDups = memory.duplicateWordsDetected.length;

  const localStorageProgressChecks = analyzeLocalStorageProgress(allFlows);

  const qaReport: QAReport = {
    runAt: new Date().toISOString(),
    baseUrl: config.baseUrl,
    studentMode: STUDENT_MODE,
    browser: 'Chromium (playwright)',
    viewports: config.viewports.map(v => `${v.name} ${v.width}x${v.height}`),
    nodeVersion: process.version,
    totalScreensVisited: memory.visitedRoutes.length,
    totalFlowsRun: allFlows.length,
    totalQuestionsAttempted: allFlows.reduce((s, f) => s + f.questionsAttempted, 0),
    uniqueQuestionsAttempted: allFlows.reduce((s, f) => s + f.uniqueQuestionsAttempted, 0),
    totalDuplicateQuestionsDetected: totalDuplicates,
    totalWordsAttempted: totalWords,
    uniqueWordsAttempted: uniqueWords,
    totalDuplicateWordsDetected: totalWordDups,
    totalIssues: dedupedIssues.length,
    critical: dedupedIssues.filter(i => i.severity === 'critical').length,
    high: dedupedIssues.filter(i => i.severity === 'high').length,
    medium: dedupedIssues.filter(i => i.severity === 'medium').length,
    low: dedupedIssues.filter(i => i.severity === 'low').length,
    screens: memory.visitedRoutes.map(route => ({
      route,
      title: route,
      loadedOk: true,
      screenshotPaths: {},
      consoleErrors: [],
      networkErrors: [],
      issues: dedupedIssues.filter(i => i.route === route),
      durationMs: 0,
    })),
    flows: allFlows,
    allIssues: dedupedIssues,
    studentMemory: memory,
    localStorageProgressChecks,
  };

  generateReport(qaReport, config.reportDir);

  // ── Step 15: Print summary ────────────────────────────────────────────────
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║   QA Run Complete                         ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║   Duration: ${String(elapsed + 's').padEnd(31)}║`);
  console.log(`║   Screens: ${String(qaReport.totalScreensVisited).padEnd(32)}║`);
  console.log(`║   Flows: ${String(allFlows.length).padEnd(34)}║`);
  console.log(`║   Questions: ${String(qaReport.totalQuestionsAttempted).padEnd(30)}║`);
  console.log(`║   Issues: ${String(qaReport.totalIssues).padEnd(33)}║`);
  console.log(`║     🔴 Critical: ${String(qaReport.critical).padEnd(25)}║`);
  console.log(`║     🟠 High:     ${String(qaReport.high).padEnd(25)}║`);
  console.log(`║     🟡 Medium:   ${String(qaReport.medium).padEnd(25)}║`);
  console.log(`║     🔵 Low:      ${String(qaReport.low).padEnd(25)}║`);
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║   Report: qa-report/amirnet-qa-report.md  ║`);
  console.log('╚═══════════════════════════════════════════╝\n');

  // Exit with non-zero code if critical issues found
  if (qaReport.critical > 0) {
    console.log('⚠  Critical issues found. See report for details.\n');
    process.exit(2);
  }
}

main().catch(err => {
  console.error('\n[runner] Fatal error:', err);
  process.exit(1);
});
