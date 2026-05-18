"use client";

import type { SessionMode, DifficultyFilter } from "@/lib/practice/question-selector";
import PracticeSession from "./PracticeSession";

const VALID_MODES: SessionMode[] = [
  "sentenceCompletion",
  "restatements",
  "grammar",
  "wordFormation",
  "reading",
  "lectureQuestions",
  "textCompletion",
  "writingTask",
  "mixed",
  "smartReview",
  // Skill boosters
  "vocabularyInContext",
  "synonymRecognition",
  "antonymRecognition",
  "connectorPractice",
  "restatementMini",
  "sentenceLogic",
  "distractorTrap",
  "academicPhrase",
];

const VALID_DIFFICULTIES: DifficultyFilter[] = ["adaptive", "easy", "medium", "hard"];

interface Props {
  mode: string;
  difficulty: string;
}

export default function PracticeSessionLoader({ mode, difficulty }: Props) {
  const resolvedMode: SessionMode = VALID_MODES.includes(mode as SessionMode)
    ? (mode as SessionMode)
    : "mixed";

  const resolvedDifficulty: DifficultyFilter = VALID_DIFFICULTIES.includes(difficulty as DifficultyFilter)
    ? (difficulty as DifficultyFilter)
    : "adaptive";

  return <PracticeSession mode={resolvedMode} difficulty={resolvedDifficulty} />;
}
