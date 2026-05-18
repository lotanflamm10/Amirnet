import type { VocabItem } from "@/types/vocab";

export type CardType =
  | "all"
  | "nouns"
  | "verbs"
  | "adjectives"
  | "expressions"
  | "connectors"
  | "phrasalVerbs"
  | "unclassified";

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  all:          "הכל / All",
  nouns:        "שמות עצם / Nouns",
  verbs:        "פעלים / Verbs",
  adjectives:   "תארים / Adj",
  expressions:  "ביטויים / Expr",
  connectors:   "מחברים / Conn",
  phrasalVerbs: "פעלי ביטוי / Phrasal",
  unclassified: "אחר / Other",
};

export function getVocabCardType(item: VocabItem): Exclude<CardType, "all"> {
  const pos = (item.partOfSpeech ?? "").toLowerCase().trim();
  const cat = (item.category ?? "").toLowerCase().trim();
  const tags = item.tags ?? [];

  if (cat === "phrasal verbs" || pos === "phrasal verb" || pos.includes("phrasal")) return "phrasalVerbs";
  if (cat === "connectors" || pos === "connector" || pos === "conjunction" || tags.includes("connector")) return "connectors";
  if (cat === "common phrases" || pos === "expression" || pos === "phrase" || pos === "idiom") return "expressions";
  if (pos.startsWith("noun") || pos === "n" || pos === "n.") return "nouns";
  if (pos.startsWith("verb") || pos === "v" || pos === "v.") return "verbs";
  if (pos.startsWith("adj") || pos.startsWith("adv") || pos === "adjective" || pos === "adverb") return "adjectives";
  if (!pos && !cat) return "unclassified";
  return "unclassified";
}

export function filterByCardType(items: VocabItem[], cardType: CardType): VocabItem[] {
  if (cardType === "all") return items;
  return items.filter((item) => getVocabCardType(item) === cardType);
}
