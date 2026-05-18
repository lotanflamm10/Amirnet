export type QuestionCategory =
  | "sentenceCompletion"
  | "restatements"
  | "grammar"
  | "wordFormation"
  | "reading"
  | "lectureQuestions"
  | "textCompletion"
  | "writingTask"
  | "vocabulary"
  | "mixed"
  | "vocabularyInContext"
  | "synonymRecognition"
  | "antonymRecognition"
  | "connectorPractice"
  | "restatementMini"
  | "sentenceLogic"
  | "distractorTrap"
  | "academicPhrase";

export type SourceType =
  | "official_style"
  | "skill_booster"
  | "vocab_reinforcement"
  | "reading_support"
  | "pilot";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export type PracticeMode =
  | "sentenceCompletion"
  | "restatements"
  | "grammar"
  | "wordFormation"
  | "reading"
  | "lectureQuestions"
  | "textCompletion"
  | "writingTask"
  | "vocab"
  | "smartReview"
  | "simulation"
  | "mixed"
  | "vocabularyInContext"
  | "synonymRecognition"
  | "antonymRecognition"
  | "connectorPractice"
  | "restatementMini"
  | "sentenceLogic"
  | "distractorTrap"
  | "academicPhrase";

export interface QuestionChoice {
  text: string;
  index: number;
}

export interface Explanation {
  correct: string;
  wrongReasons: string[];
}

export interface ReadingPassage {
  id: string;
  title?: string;
  body: string;
  source?: string;
}

export interface Question {
  id: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  text: string;
  choices: string[];
  answer: number;
  explanation: string;
  wrongReasons: string[];
  passage?: ReadingPassage;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  // Skill booster metadata
  subType?: string;
  sourceType?: SourceType;
  isSkillBooster?: boolean;
  skillTags?: string[];
  vocabularyWords?: string[];
  hebrewExplanation?: string;
  estimatedTimeSeconds?: number;
  // Writing task fields (category === "writingTask")
  writingPrompt?: string;
  wordLimitMin?: number;
  wordLimitMax?: number;
  rubric?: string[];
}

export interface Mistake {
  questionId: string;
  chosenIndex: number;
  correctIndex: number;
  timeSpentSeconds: number;
  occurredAt: string;
}

export interface PracticeResult {
  questionId: string;
  correct: boolean;
  chosenIndex: number;
  timeSpentSeconds: number;
  answeredAt: string;
}

export interface PracticeSession {
  id: string;
  mode: PracticeMode;
  difficulty: QuestionDifficulty | "adaptive";
  startedAt: string;
  completedAt?: string;
  results: PracticeResult[];
  totalQuestions: number;
  isSimulation: boolean;
}
