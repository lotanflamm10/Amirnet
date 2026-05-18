import type { VocabItem, VocabDifficulty } from "@/types/vocab";

type RawVocabItem = {
  id: string;
  word: string;
  definition: string;
  example?: string;
  difficulty: string;
  choices?: string[];
  answer?: number;
};

export function normalizeVocabJson(items: RawVocabItem[], source: VocabItem["source"]): VocabItem[] {
  const now = new Date().toISOString();
  return items.map((item) => {
    const difficulty: VocabDifficulty =
      item.difficulty === "easy" || item.difficulty === "medium" || item.difficulty === "hard"
        ? item.difficulty
        : "medium";

    return {
      id: `vocab_${item.word.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`,
      word: item.word,
      normalizedWord: item.word.toLowerCase().trim(),
      hebrewTranslation: "",
      englishDefinition: item.definition ?? null,
      partOfSpeech: null,
      difficulty,
      category: null,
      exampleSentence: item.example ?? null,
      exampleSentenceHebrew: null,
      synonyms: [],
      antonyms: [],
      confusingWords: [],
      commonTrap: null,
      tags: [],
      source,
      originalLine: item.word,
      needsReview: true,
      studyPriority: difficulty === "hard" ? 3 : difficulty === "medium" ? 2 : 1,
      createdAt: now,
      updatedAt: now,
    };
  });
}
