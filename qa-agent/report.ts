import fs from 'fs';
import path from 'path';
import type { QAReport, QAIssue, FlowResult, LocalStorageProgressCheck } from './types';
import { ensureDir } from './playwright-helpers';

/** Analyze localStorage before/after snapshots to produce progress checks. */
export function analyzeLocalStorageProgress(flows: FlowResult[]): LocalStorageProgressCheck[] {
  const checks: LocalStorageProgressCheck[] = [];

  for (const flow of flows) {
    const before = flow.localStorageBefore ?? {};
    const after = flow.localStorageAfter ?? {};

    if (!flow.flowName.startsWith('practice:') && !flow.flowName.startsWith('vocab:') &&
        !flow.flowName.startsWith('simulation:') && flow.flowName !== 'challenge') {
      continue;
    }

    const isPractice = flow.flowName.startsWith('practice:');
    const isVocab = flow.flowName.startsWith('vocab:');
    const isSim = flow.flowName.startsWith('simulation:');

    // Check 1: amirnet-qhistory-v1 practiceSeen should grow after practice
    if (isPractice || isSim) {
      const bHistory = before['amirnet-qhistory-v1'] as Record<string, unknown> | null;
      const aHistory = after['amirnet-qhistory-v1'] as Record<string, unknown> | null;
      const bLen = Array.isArray(bHistory?.['practiceSeen']) ? (bHistory!['practiceSeen'] as unknown[]).length : 0;
      const aLen = Array.isArray(aHistory?.['practiceSeen']) ? (aHistory!['practiceSeen'] as unknown[]).length : 0;
      const status: 'OK' | 'WARN' | 'FAIL' = aLen > bLen ? 'OK' : (flow.questionsAttempted > 0 ? 'FAIL' : 'WARN');
      checks.push({
        flowName: flow.flowName,
        key: 'amirnet-qhistory-v1.practiceSeen',
        before: `length=${bLen}`,
        after: `length=${aLen}`,
        expectedChange: 'Length should increase',
        actualChange: aLen > bLen ? `+${aLen - bLen} items` : 'No change',
        status,
      });
    }

    // Check 2: amirnet-session-current should be cleared after completion
    if (isPractice) {
      const bSession = before['amirnet-session-current'];
      const aSession = after['amirnet-session-current'];
      const sessionCleared = bSession !== null && aSession === null;
      const sessionNeverSet = bSession === null && aSession === null;
      checks.push({
        flowName: flow.flowName,
        key: 'amirnet-session-current',
        before: bSession === null ? 'null' : 'object',
        after: aSession === null ? 'null' : 'object',
        expectedChange: 'Cleared (null) after session completes',
        actualChange: sessionCleared ? 'Cleared OK' : sessionNeverSet ? 'Was never set' : 'Still present',
        status: sessionCleared || sessionNeverSet ? 'OK' : 'WARN',
      });
    }

    // Check 3: amirnet-vocab-v1 should update after vocab flow
    if (isVocab) {
      const bVocab = before['amirnet-vocab-v1'];
      const aVocab = after['amirnet-vocab-v1'];
      const bStr = JSON.stringify(bVocab ?? {});
      const aStr = JSON.stringify(aVocab ?? {});
      const changed = bStr !== aStr;
      checks.push({
        flowName: flow.flowName,
        key: 'amirnet-vocab-v1',
        before: bVocab === null ? 'null' : `${Object.keys(bVocab as object ?? {}).length} entries`,
        after: aVocab === null ? 'null' : `${Object.keys(aVocab as object ?? {}).length} entries`,
        expectedChange: 'Word states updated',
        actualChange: changed ? 'Updated' : 'Unchanged',
        status: changed || flow.wordsAttempted === 0 ? 'OK' : 'FAIL',
      });
    }

    // Check 4: amirnet-progress-v1 should update after any flow
    if (flow.questionsAttempted > 0 || flow.wordsAttempted > 0) {
      const bProgress = before['amirnet-progress-v1'];
      const aProgress = after['amirnet-progress-v1'];
      const changed = JSON.stringify(bProgress) !== JSON.stringify(aProgress);
      checks.push({
        flowName: flow.flowName,
        key: 'amirnet-progress-v1',
        before: bProgress === null ? 'null' : 'object',
        after: aProgress === null ? 'null' : 'object',
        expectedChange: 'XP/progress updated',
        actualChange: changed ? 'Updated' : 'Unchanged',
        status: changed ? 'OK' : 'WARN',
      });
    }

    // Check 5: amirnet-sim-current cleared after simulation
    if (isSim) {
      const bSim = before['amirnet-sim-current'];
      const aSim = after['amirnet-sim-current'];
      checks.push({
        flowName: flow.flowName,
        key: 'amirnet-sim-current',
        before: bSim === null ? 'null' : 'object',
        after: aSim === null ? 'null' : 'object',
        expectedChange: 'Cleared after simulation ends',
        actualChange: aSim === null ? 'Cleared OK' : 'Still present',
        status: aSim === null ? 'OK' : 'WARN',
      });
    }
  }

  return checks;
}

/** Calculate a student experience score 1–10. */
function studentExperienceScore(report: QAReport): number {
  let score = 10;
  score -= report.critical * 3;
  score -= report.high * 1;
  score -= Math.floor(report.totalDuplicateQuestionsDetected / 3);
  score -= Math.floor(report.totalDuplicateWordsDetected / 5);

  const stuckFlows = report.flows.filter(f => f.stuck).length;
  score -= stuckFlows * 2;

  const failedProgress = report.localStorageProgressChecks.filter(c => c.status === 'FAIL').length;
  score -= failedProgress;

  return Math.max(1, Math.min(10, score));
}

/** Format a severity badge. */
function badge(s: string): string {
  const map: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵' };
  return `${map[s] ?? '⚪'} **${s.toUpperCase()}**`;
}

/** Generate the full markdown QA report. */
export function generateMarkdownReport(report: QAReport): string {
  const lines: string[] = [];

  const expScore = studentExperienceScore(report);

  // ── Title ──────────────────────────────────────────────────────────────────
  lines.push('# AMIRNET Autonomous QA Report\n');

  // ── Executive Summary ──────────────────────────────────────────────────────
  lines.push('## Executive Summary\n');
  const healthEmoji = report.critical > 0 ? '🔴' : report.high > 3 ? '🟠' : report.high > 0 ? '🟡' : '🟢';
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Overall Health | ${healthEmoji} ${report.critical > 0 ? 'Critical issues found' : report.high > 0 ? 'High issues found' : 'Passing'} |`);
  lines.push(`| Student Mode | ${report.studentMode} |`);
  lines.push(`| Screens Visited | ${report.totalScreensVisited} |`);
  lines.push(`| Flows Tested | ${report.totalFlowsRun} |`);
  lines.push(`| Questions Attempted | ${report.totalQuestionsAttempted} |`);
  lines.push(`| Unique Questions | ${report.uniqueQuestionsAttempted} |`);
  lines.push(`| Duplicate Questions | ${report.totalDuplicateQuestionsDetected} |`);
  lines.push(`| Words Practiced | ${report.totalWordsAttempted} |`);
  lines.push(`| Unique Words | ${report.uniqueWordsAttempted} |`);
  lines.push(`| Duplicate Words | ${report.totalDuplicateWordsDetected} |`);
  lines.push(`| Total Issues | ${report.totalIssues} |`);
  lines.push(`| 🔴 Critical | ${report.critical} |`);
  lines.push(`| 🟠 High | ${report.high} |`);
  lines.push(`| 🟡 Medium | ${report.medium} |`);
  lines.push(`| 🔵 Low | ${report.low} |`);
  lines.push(`| Student Experience Score | ${expScore}/10 |`);
  lines.push('');

  // ── Environment ────────────────────────────────────────────────────────────
  lines.push('## Environment\n');
  lines.push(`| | |`);
  lines.push(`|--|--|`);
  lines.push(`| Run Date | ${report.runAt} |`);
  lines.push(`| Base URL | ${report.baseUrl} |`);
  lines.push(`| Browser | ${report.browser} |`);
  lines.push(`| Viewports | ${report.viewports.join(', ')} |`);
  lines.push(`| Node.js | ${report.nodeVersion} |`);
  lines.push(`| Student Mode | ${report.studentMode} |`);
  lines.push('');

  // ── Coverage ───────────────────────────────────────────────────────────────
  lines.push('## Coverage\n');
  lines.push(`| Area | Count |`);
  lines.push(`|------|-------|`);
  lines.push(`| Routes Visited | ${report.screens.map(s => s.route).join(', ')} |`);
  lines.push(`| Screens Successfully Loaded | ${report.screens.filter(s => s.loadedOk).length} |`);
  lines.push(`| Screens Failed to Load | ${report.screens.filter(s => !s.loadedOk).length} |`);
  lines.push(`| Practice Flows | ${report.flows.filter(f => f.flowName.startsWith('practice:')).length} |`);
  lines.push(`| Vocab Flows | ${report.flows.filter(f => f.flowName.startsWith('vocab:')).length} |`);
  lines.push(`| Simulation Flows | ${report.flows.filter(f => f.flowName.startsWith('simulation:')).length} |`);
  lines.push(`| Flows Completed | ${report.flows.filter(f => f.completed).length} |`);
  lines.push(`| Flows Stuck | ${report.flows.filter(f => f.stuck).length} |`);
  lines.push('');

  // ── Student Simulation Findings ────────────────────────────────────────────
  lines.push('## Student Simulation Findings\n');
  lines.push(`**Student Experience Score: ${expScore}/10**\n`);

  const completedFlows = report.flows.filter(f => f.completed);
  const stuckFlows = report.flows.filter(f => f.stuck);

  lines.push(`The QA agent simulated a ${report.studentMode} AMIRNET student across ${report.totalFlowsRun} learning flows.\n`);
  lines.push(`- **Flows completed successfully**: ${completedFlows.length} (${completedFlows.map(f => f.flowName).join(', ')})`);
  lines.push(`- **Flows stuck/failed**: ${stuckFlows.length}${stuckFlows.length > 0 ? ' — ' + stuckFlows.map(f => `${f.flowName}: ${f.stuckReason ?? 'unknown'}`).join('; ') : ''}`);
  lines.push(`- **Total questions attempted**: ${report.totalQuestionsAttempted}`);
  lines.push(`- **Duplicate questions detected**: ${report.totalDuplicateQuestionsDetected}`);
  lines.push(`- **Total words practiced**: ${report.totalWordsAttempted}`);
  lines.push(`- **Duplicate words detected**: ${report.totalDuplicateWordsDetected}`);

  const progressFails = report.localStorageProgressChecks.filter(c => c.status === 'FAIL').length;
  lines.push(`- **localStorage progress failures**: ${progressFails}`);
  lines.push('');

  lines.push('**Student experience assessment:**');
  if (expScore >= 8) lines.push('> The student can practice smoothly with minor issues.');
  else if (expScore >= 5) lines.push('> The student experience is usable but has notable friction. Fix High issues for improvement.');
  else lines.push('> The student experience is significantly impaired. Critical issues must be fixed first.');
  lines.push('');

  lines.push('**Recommended product improvements:**');
  if (report.totalDuplicateQuestionsDetected > 0) lines.push(`- Reduce question repetition (${report.totalDuplicateQuestionsDetected} duplicates found in sessions)`);
  if (progressFails > 0) lines.push(`- Fix localStorage progress not updating (${progressFails} checks failed)`);
  if (stuckFlows.length > 0) lines.push(`- Fix stuck flows: ${stuckFlows.map(f => f.flowName).join(', ')}`);
  lines.push('');

  // ── Visual UI QA Findings ──────────────────────────────────────────────────
  lines.push('## Visual UI QA Findings\n');
  const visualIssues = report.allIssues.filter(i => i.affectsUI && !i.affectsStudentLearning);
  const desktopIssues = report.allIssues.filter(i => i.viewport === 'desktop');
  const mobileIssues = report.allIssues.filter(i => i.viewport === 'mobile');

  lines.push(`### Desktop (1280×800) — ${desktopIssues.length} issue(s)\n`);
  if (desktopIssues.length > 0) {
    lines.push('| Route | Issue | Severity | Screenshot |');
    lines.push('|-------|-------|----------|-----------|');
    for (const issue of desktopIssues) {
      lines.push(`| ${issue.route} | ${issue.title} | ${badge(issue.severity)} | ${issue.screenshotPath ? `[view](${issue.screenshotPath})` : '—'} |`);
    }
  } else {
    lines.push('No desktop visual issues detected.');
  }
  lines.push('');

  lines.push(`### Mobile (390×844) — ${mobileIssues.length} issue(s)\n`);
  if (mobileIssues.length > 0) {
    lines.push('| Route | Issue | Severity | Screenshot |');
    lines.push('|-------|-------|----------|-----------|');
    for (const issue of mobileIssues) {
      lines.push(`| ${issue.route} | ${issue.title} | ${badge(issue.severity)} | ${issue.screenshotPath ? `[view](${issue.screenshotPath})` : '—'} |`);
    }
  } else {
    lines.push('No mobile visual issues detected.');
  }
  lines.push('');

  // ── Issues by Severity ─────────────────────────────────────────────────────
  lines.push('## Issues by Severity\n');
  for (const sev of ['critical', 'high', 'medium', 'low'] as const) {
    const sevIssues = report.allIssues.filter(i => i.severity === sev);
    if (sevIssues.length === 0) continue;
    lines.push(`### ${badge(sev)} — ${sevIssues.length} issue(s)\n`);
    for (const issue of sevIssues) {
      lines.push(`#### ${issue.id}: ${issue.title}`);
      lines.push(`- **Route**: ${issue.route}`);
      lines.push(`- **Action**: ${issue.action}`);
      lines.push(`- **Expected**: ${issue.expected}`);
      lines.push(`- **Actual**: ${issue.actual}`);
      if (issue.reproSteps.length > 0) {
        lines.push('- **Reproduction steps**:');
        issue.reproSteps.forEach(s => lines.push(`  1. ${s}`));
      }
      if (issue.screenshotPath) lines.push(`- **Screenshot**: [view](${issue.screenshotPath})`);
      if (issue.suggestedCause) lines.push(`- **Suggested cause**: ${issue.suggestedCause}`);
      if (issue.suggestedFixArea) lines.push(`- **Suggested fix area**: \`${issue.suggestedFixArea}\``);
      lines.push(`- **Affects student learning**: ${issue.affectsStudentLearning ? 'Yes' : 'No'}`);
      lines.push(`- **Affects repetition/progress**: ${issue.affectsRepetition ? 'Yes' : 'No'}`);
      lines.push('');
    }
  }

  // ── Console Errors ─────────────────────────────────────────────────────────
  lines.push('## Console Errors (by Route)\n');
  const screensWithErrors = report.screens.filter(s => s.consoleErrors.length > 0);
  if (screensWithErrors.length === 0) {
    lines.push('No console errors detected.\n');
  } else {
    for (const screen of screensWithErrors) {
      lines.push(`### ${screen.route}`);
      screen.consoleErrors.slice(0, 10).forEach(e => lines.push(`- \`${e.slice(0, 200)}\``));
      lines.push('');
    }
  }

  // ── Network Failures ───────────────────────────────────────────────────────
  lines.push('## Network Failures (by Route)\n');
  const screensWithNetworkErrors = report.screens.filter(s => s.networkErrors.length > 0);
  if (screensWithNetworkErrors.length === 0) {
    lines.push('No network failures detected.\n');
  } else {
    for (const screen of screensWithNetworkErrors) {
      lines.push(`### ${screen.route}`);
      screen.networkErrors.slice(0, 10).forEach(e => lines.push(`- ${e}`));
      lines.push('');
    }
  }

  // ── RTL & Hebrew UI ────────────────────────────────────────────────────────
  lines.push('## RTL & Hebrew UI Findings\n');
  const rtlIssues = report.allIssues.filter(i => i.title.toLowerCase().includes('rtl'));
  if (rtlIssues.length === 0) {
    lines.push('No RTL direction issues detected. Document `dir="rtl"` is set correctly on all tested routes.\n');
  } else {
    for (const issue of rtlIssues) {
      lines.push(`- **${issue.id}** ${issue.route}: ${issue.description}`);
    }
    lines.push('');
  }

  // ── Accessibility ──────────────────────────────────────────────────────────
  lines.push('## Accessibility Findings\n');
  const a11yIssues = report.allIssues.filter(i =>
    i.title.toLowerCase().includes('accessible') ||
    i.title.toLowerCase().includes('empty link') ||
    i.title.toLowerCase().includes('aria') ||
    i.title.toLowerCase().includes('label')
  );
  if (a11yIssues.length === 0) {
    lines.push('No critical accessibility issues detected.\n');
  } else {
    for (const issue of a11yIssues) {
      lines.push(`- ${badge(issue.severity)} **${issue.id}** ${issue.route}: ${issue.title}`);
    }
    lines.push('');
  }

  // ── Practice Flow Findings ─────────────────────────────────────────────────
  lines.push('## Practice Flow Findings\n');
  const practiceFlows = report.flows.filter(f => f.flowName.startsWith('practice:'));
  lines.push(`| Flow | Questions | Unique | Duplicates | Completed | Stuck |`);
  lines.push(`|------|-----------|--------|------------|-----------|-------|`);
  for (const f of practiceFlows) {
    lines.push(`| ${f.flowName} | ${f.questionsAttempted} | ${f.uniqueQuestionsAttempted} | ${f.duplicatesDetected} | ${f.completed ? '✓' : '✗'} | ${f.stuck ? `⚠ ${f.stuckReason ?? ''}` : '—'} |`);
  }
  lines.push('');

  // ── Vocab Flow Findings ────────────────────────────────────────────────────
  lines.push('## Vocabulary Flow Findings\n');
  const vocabFlows = report.flows.filter(f => f.flowName.startsWith('vocab:'));
  if (vocabFlows.length > 0) {
    lines.push(`| Flow | Words | Unique | Duplicates | Completed | Stuck |`);
    lines.push(`|------|-------|--------|------------|-----------|-------|`);
    for (const f of vocabFlows) {
      lines.push(`| ${f.flowName} | ${f.wordsAttempted} | ${f.uniqueWordsAttempted} | ${f.duplicatesDetected} | ${f.completed ? '✓' : '✗'} | ${f.stuck ? '⚠' : '—'} |`);
    }
  } else {
    lines.push('No vocabulary flows were run.\n');
  }
  lines.push('');

  // ── localStorage Progress Analysis ────────────────────────────────────────
  lines.push('## localStorage Progress Analysis\n');
  if (report.localStorageProgressChecks.length === 0) {
    lines.push('No localStorage progress checks recorded.\n');
  } else {
    lines.push('| Flow | Key | Before | After | Expected | Actual | Status |');
    lines.push('|------|-----|--------|-------|----------|--------|--------|');
    for (const c of report.localStorageProgressChecks) {
      const statusEmoji = c.status === 'OK' ? '✅' : c.status === 'WARN' ? '⚠️' : '❌';
      lines.push(`| ${c.flowName} | ${c.key} | ${c.before} | ${c.after} | ${c.expectedChange} | ${c.actualChange} | ${statusEmoji} ${c.status} |`);
    }
  }
  lines.push('');

  // ── Screenshots Index ──────────────────────────────────────────────────────
  lines.push('## Screenshots Index\n');
  const allScreenshots = [
    ...report.screens.flatMap(s => Object.values(s.screenshotPaths)),
    ...report.flows.flatMap(f => f.screenshotPaths),
    ...report.allIssues.map(i => i.screenshotPath).filter(Boolean),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  lines.push(`Total screenshots: ${allScreenshots.length}`);
  lines.push(`Screenshots saved to: \`qa-report/screenshots/\``);
  lines.push(`Baselines saved to: \`qa-report/baselines/\``);
  lines.push('');

  // ── Recommended Fix Plan ───────────────────────────────────────────────────
  lines.push('## Recommended Fix Plan\n');
  for (const sev of ['critical', 'high', 'medium', 'low'] as const) {
    const sevIssues = report.allIssues.filter(i => i.severity === sev);
    if (sevIssues.length === 0) continue;
    lines.push(`### ${badge(sev)} Priority (${sevIssues.length} issues)`);
    for (const issue of sevIssues) {
      lines.push(`- **${issue.id}** [${issue.route}] ${issue.title}`);
      if (issue.suggestedFixArea) lines.push(`  → Fix in: \`${issue.suggestedFixArea}\``);
    }
    lines.push('');
  }

  // ── Claude Code Fixing Prompt ──────────────────────────────────────────────
  lines.push('## Ready-to-Paste Claude Code Fixing Prompt\n');
  lines.push('Copy and paste this entire prompt into a Claude Code conversation:\n');
  lines.push('```');
  lines.push('You are working only inside C:\\Lotan\\amirnet.');
  lines.push('Read qa-report/amirnet-qa-report.md and qa-report/amirnet-qa-results.json.');
  lines.push('Fix all Critical and High severity issues first, then Medium issues.');
  lines.push('Do not modify qa-agent/ files.');
  lines.push('Do not modify unrelated functionality.');
  lines.push('Preserve Hebrew RTL behavior and amirnet-* localStorage key conventions.');
  lines.push('Preserve anti-repetition logic in src/lib/practice/question-history.ts.');
  lines.push('Preserve spaced-repetition logic in src/lib/vocab/spaced-repetition.ts.');
  lines.push('Preserve the current UI style unless a fix requires a small UI correction.');
  lines.push('Pay special attention to:');
  lines.push('  - localStorage progress not updating after practice sessions');
  lines.push('  - Practice flows that are stuck or crash');
  lines.push('  - Repeated questions in non-review practice modes');
  lines.push('  - RTL layout issues on mobile viewport');
  lines.push('After fixing, run: npm run qa:amirnet');
  lines.push('Update the QA report with fixed status for each resolved issue.');
  lines.push('List every file changed and why.');
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

/** Write both report files to disk. */
export function generateReport(qaReport: QAReport, outputDir: string): void {
  ensureDir(outputDir);

  const jsonPath = path.join(outputDir, 'amirnet-qa-results.json');
  const mdPath = path.join(outputDir, 'amirnet-qa-report.md');

  fs.writeFileSync(jsonPath, JSON.stringify(qaReport, null, 2), 'utf-8');
  console.log(`[report] JSON: ${jsonPath}`);

  const md = generateMarkdownReport(qaReport);
  fs.writeFileSync(mdPath, md, 'utf-8');
  console.log(`[report] Markdown: ${mdPath}`);
}
