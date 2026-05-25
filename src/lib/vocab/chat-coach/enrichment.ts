/**
 * Hand-curated chat-coach extras for selected vocabulary words.
 *
 * The seed JSON in src/data/seed/vocab.normalized.json holds the canonical
 * Hebrew translation, but the chat coach also wants:
 *   • a tiny set of "wrong but plausible" Hebrew answers (confusions) so a
 *     learner who writes "להחזיק מעמד" for `obtain` gets a targeted nudge
 *     rather than a generic "wrong"
 *   • extra aliases beyond what naive comma-split of hebrewTranslation can
 *     produce
 *   • a one-line memoryAnchor + an optional commonPhrase for the post-batch
 *     "still need work" expander
 *
 * This file is intentionally tiny and hand-extendable. Words not present
 * here simply have no curated extras; the grader and UI fall back to the
 * seed fields. Keys are the VocabItem.id, NOT the English word — IDs are
 * stable, words can change capitalization.
 */

export interface ChatEnrichmentEntry {
  /** Hebrew strings that should trip a "confusion" hit, not a plain wrong. */
  confusions?: string[];
  /** Hebrew strings that should count as correct in addition to the seed
   * translation (e.g. inflections, prepositional variants). */
  extraAliases?: string[];
  /** One-line Hebrew memory hook shown on the "still need work" row. */
  memoryAnchor?: string;
  /** A common English collocation worth seeing under the word. */
  commonPhrase?: string;
}

export const CHAT_ENRICHMENT: Record<string, ChatEnrichmentEntry> = {
  vocab_sufficient: {
    confusions: ["יעיל", "מספק שירות"],
    extraAliases: ["מספיק", "די", "מספיק כדי"],
    memoryAnchor: "sufficient = די / מספיק (יותר מאשר 'יעיל')",
    commonPhrase: "sufficient evidence",
  },
  vocab_sustain: {
    confusions: ["לקיים מנהג", "לתחזק מכונה"],
    extraAliases: ["לקיים", "להחזיק", "להמשיך"],
    memoryAnchor: "sustain = לשמר משהו פעיל לאורך זמן",
    commonPhrase: "sustain growth / sustain a relationship",
  },
  vocab_substantiate: {
    confusions: ["להחליף", "להמיר"],
    extraAliases: ["לבסס", "להוכיח", "לאשש"],
    memoryAnchor: "substantiate = לבסס טענה בראיות (substance = חומר)",
    commonPhrase: "substantiate a claim",
  },
  vocab_undermine: {
    confusions: ["להבליט", "להדגיש", "להגביר"],
    extraAliases: ["לערער", "להחליש", "לחתור תחת"],
    memoryAnchor: "undermine = mine (לכרות) מתחת — להחליש מבפנים",
    commonPhrase: "undermine trust / undermine authority",
  },
  vocab_thorough: {
    confusions: ["מהיר", "שטחי", "כללי"],
    extraAliases: ["יסודי", "מקיף", "מעמיק"],
    memoryAnchor: "thorough = הולך עד הסוף, בודק הכל",
    commonPhrase: "a thorough investigation",
  },
  vocab_obtain: {
    confusions: ["להחזיק", "לשמור", "להזמין"],
    extraAliases: ["להשיג", "לקבל", "לרכוש"],
    memoryAnchor: "obtain = להשיג אקטיבית (לא רק לקבל)",
    commonPhrase: "obtain permission / obtain a degree",
  },
  vocab_adapt: {
    confusions: ["לאמץ ילד", "להתאמן"],
    extraAliases: ["להסתגל", "להתאים", "לשנות התאמה"],
    memoryAnchor: "adapt = להסתגל לתנאים (adopt = לאמץ — לא לבלבל!)",
    commonPhrase: "adapt to change",
  },
  vocab_considerable: {
    confusions: ["מתחשב", "מנומס"],
    extraAliases: ["ניכר", "משמעותי", "ראוי לתשומת לב"],
    memoryAnchor: "considerable = גדול דיו כדי לשים לב (לא 'מתחשב'!)",
    commonPhrase: "considerable amount / considerable effort",
  },
  vocab_distinct: {
    confusions: ["יוקרתי", "מפורסם"],
    extraAliases: ["נבדל", "שונה במובהק", "ברור"],
    memoryAnchor: "distinct = שונה באופן שניתן להבחין בו (≠ distinguished)",
    commonPhrase: "distinct from / distinct advantage",
  },
  vocab_reconcile: {
    confusions: ["להזכיר", "לזכור", "להמליץ"],
    extraAliases: ["ליישב", "להשלים", "לפייס"],
    memoryAnchor: "reconcile = ליישב סתירה או מחלוקת",
    commonPhrase: "reconcile differences / reconcile with",
  },
};

export function getChatEnrichment(wordId: string): ChatEnrichmentEntry | null {
  return CHAT_ENRICHMENT[wordId] ?? null;
}
