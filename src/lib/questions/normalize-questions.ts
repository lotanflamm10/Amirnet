import type { Question, QuestionCategory, QuestionDifficulty } from "@/types/questions";

const CATEGORY_MAP: Record<string, QuestionCategory> = {
  sentenceCompletion: "sentenceCompletion",
  paraphrasing: "restatements",
  grammar: "grammar",
  wordFormation: "wordFormation",
  reading: "reading",
  lectureQuestions: "lectureQuestions",
  textCompletion: "textCompletion",
  vocab: "vocabulary",
  smartReview: "mixed",
};

type RawQuestion = {
  id: string;
  difficulty: string;
  text: string;
  choices: string[];
  answer: number;
  explanation: string;
  wrongReasons?: string[];
  passage?: { id: string; title?: string; body: string };
  tags?: string[];
};

type RawQuestionsFile = Record<string, RawQuestion[]>;

export function normalizeQuestions(raw: RawQuestionsFile): Question[] {
  const now = new Date().toISOString();
  const questions: Question[] = [];

  for (const [key, items] of Object.entries(raw)) {
    const category: QuestionCategory = CATEGORY_MAP[key] ?? "mixed";
    for (const item of items) {
      const difficulty: QuestionDifficulty =
        item.difficulty === "easy" || item.difficulty === "medium" || item.difficulty === "hard"
          ? item.difficulty
          : "medium";
      questions.push({
        id: item.id,
        category,
        difficulty,
        text: item.text,
        choices: item.choices,
        answer: item.answer,
        explanation: item.explanation ?? "",
        wrongReasons: item.wrongReasons ?? [],
        passage: item.passage,
        tags: item.tags ?? [],
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return questions;
}

export function mergeQuestionFiles(base: RawQuestionsFile, addon: RawQuestionsFile): RawQuestionsFile {
  const merged: RawQuestionsFile = { ...base };
  for (const [key, items] of Object.entries(addon)) {
    const existingIds = new Set((merged[key] ?? []).map((q) => q.id));
    merged[key] = [...(merged[key] ?? []), ...items.filter((q) => !existingIds.has(q.id))];
  }
  return merged;
}
