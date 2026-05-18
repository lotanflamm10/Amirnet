export type VocabDifficulty = "easy" | "medium" | "hard";

export type VocabCategory =
  | "basic vocabulary"
  | "academic verbs"
  | "connectors"
  | "abstract nouns"
  | "science and research"
  | "social science"
  | "reading comprehension"
  | "paraphrasing"
  | "trap words"
  | "common phrases"
  | "exam useful words"
  | "phrasal verbs";

export type VocabSource =
  | "user_psychometric_vocab_file"
  | "existing_vocab_json"
  | "hard_vocab_addon"
  | "generated_original_enrichment"
  | "amirnet_batch1"
  | "amirnet_batch2"
  | "amirnet_batch3"
  | "amirnet_batch4"
  | "custom";

export type FlashcardReviewState =
  | "new"
  | "learning"
  | "review"
  | "mastered"
  | "starred"
  | "weak";

export interface VocabItem {
  id: string;
  word: string;
  normalizedWord: string;
  hebrewTranslation: string;
  englishDefinition: string | null;
  partOfSpeech: string | null;
  difficulty: VocabDifficulty;
  category: VocabCategory | null;
  exampleSentence: string | null;
  exampleSentenceHebrew: string | null;
  synonyms: string[];
  antonyms: string[];
  confusingWords: string[];
  commonTrap: string | null;
  tags: string[];
  source: VocabSource;
  originalLine: string;
  needsReview: boolean;
  studyPriority: number;
  createdAt: string;
  updatedAt: string;
}

export interface VocabImportIssue {
  line: number;
  originalLine: string;
  issueType:
    | "missing_hebrew"
    | "duplicate"
    | "unclear_phrase"
    | "strange_formatting"
    | "empty_line";
  detail: string;
}

export interface VocabImportResult {
  totalRawLines: number;
  totalParsed: number;
  totalValid: number;
  duplicateCount: number;
  needsReviewCount: number;
  sourceBreakdown: Record<VocabSource, number>;
  sampleIssues: VocabImportIssue[];
  missingDefinitions: number;
  missingTranslations: number;
  items: VocabItem[];
}

export interface FlashcardSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  itemIds: string[];
  results: FlashcardSessionResult[];
}

export interface FlashcardSessionResult {
  itemId: string;
  knewIt: boolean;
  reviewedAt: string;
}
