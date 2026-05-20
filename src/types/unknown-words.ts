export type UnknownWordSource =
  | "reading"
  | "vocab"
  | "practice"
  | "academicPhrase"
  | "manual";

export type UnknownWordStatus = "unknown" | "known";

export interface UnknownWord {
  /** Normalized key: lowercased, single-spaced, trimmed. */
  id: string;
  /** Original word or phrase as the user saw it. */
  word: string;
  /** Hebrew translation, or a clean fallback like "(תרגום לא זמין)". */
  translation: string;
  source: UnknownWordSource;
  /** ISO timestamp of first add. */
  addedAt: string;
  status: UnknownWordStatus;
  /** Number of times the user re-encountered / studied this word. */
  reviewCount: number;
  /** ISO timestamp of the last status flip (e.g. marked known). */
  lastReviewedAt?: string;
}
