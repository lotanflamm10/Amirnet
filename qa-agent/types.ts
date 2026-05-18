import type { ViewportName } from './config';

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type { ViewportName };

export interface QAIssue {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  route: string;
  action: string;
  expected: string;
  actual: string;
  consoleErrors: string[];
  networkErrors: string[];
  screenshotPath?: string;
  viewport?: ViewportName;
  suggestedCause: string;
  suggestedFixArea: string;
  reproSteps: string[];
  affectsStudentLearning: boolean;
  affectsUI: boolean;
  affectsRepetition: boolean;
}

export interface LocalStorageSnapshot {
  capturedAt: string;
  route: string;
  flowName: string;
  timing: 'before' | 'after';
  keys: Record<string, unknown>;
}

export interface StudentMemory {
  visitedRoutes: string[];
  clickedActions: string[];
  questionsSeen: Record<string, number>;
  questionsSeenByRoute: Record<string, string[]>;
  answersSubmitted: string[];
  vocabWordsSeen: Record<string, number>;
  practiceFlowsCompleted: string[];
  practiceFlowsStuck: string[];
  localStorageSnapshots: LocalStorageSnapshot[];
  duplicateQuestionsDetected: Array<{ text: string; count: number; route: string }>;
  duplicateWordsDetected: Array<{ word: string; count: number; route: string }>;
}

export interface ScreenResult {
  route: string;
  title: string;
  loadedOk: boolean;
  screenshotPaths: Partial<Record<ViewportName, string>>;
  consoleErrors: string[];
  networkErrors: string[];
  issues: QAIssue[];
  durationMs: number;
  httpStatus?: number;
}

export interface FlowResult {
  flowName: string;
  route: string;
  questionsAttempted: number;
  uniqueQuestionsAttempted: number;
  duplicatesDetected: number;
  wordsAttempted: number;
  uniqueWordsAttempted: number;
  completed: boolean;
  stuck: boolean;
  stuckReason?: string;
  issues: QAIssue[];
  screenshotPaths: string[];
  localStorageBefore?: Record<string, unknown>;
  localStorageAfter?: Record<string, unknown>;
  localStorageChanges?: string[];
}

export interface LocalStorageProgressCheck {
  flowName: string;
  key: string;
  before: string;
  after: string;
  expectedChange: string;
  actualChange: string;
  status: 'OK' | 'WARN' | 'FAIL';
}

export interface PreviousRunResults {
  studentMemory: StudentMemory;
  runAt: string;
}

export interface QAReport {
  runAt: string;
  baseUrl: string;
  studentMode: 'fresh' | 'returning';
  browser: string;
  viewports: string[];
  nodeVersion: string;
  totalScreensVisited: number;
  totalFlowsRun: number;
  totalQuestionsAttempted: number;
  uniqueQuestionsAttempted: number;
  totalDuplicateQuestionsDetected: number;
  totalWordsAttempted: number;
  uniqueWordsAttempted: number;
  totalDuplicateWordsDetected: number;
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  screens: ScreenResult[];
  flows: FlowResult[];
  allIssues: QAIssue[];
  studentMemory: StudentMemory;
  localStorageProgressChecks: LocalStorageProgressCheck[];
}
