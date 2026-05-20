import type { VocabItem, VocabDifficulty } from "@/types/vocab";
import { userKey, safeGetItem, safeSetItem } from "@/lib/storage/user-storage";

const LEGACY_CUSTOM_RAW_KEY = "amirnet-custom-vocab-raw";
const LEGACY_STRUCTURED_KEY = "amirnet-custom-vocab-cards-v1";
const customRawK = () => userKey(LEGACY_CUSTOM_RAW_KEY);
const structuredK = () => userKey(LEGACY_STRUCTURED_KEY);

export interface CustomWordEntry {
  word: string;
  translation: string;
}

export function parseCustomList(raw: string): { entries: CustomWordEntry[]; skipped: number } {
  const lines = raw.split("\n");
  let skipped = 0;
  const entries: CustomWordEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) { skipped++; continue; }
    const word = trimmed.slice(0, eqIdx).trim();
    const translation = trimmed.slice(eqIdx + 1).trim();
    if (!word || !translation) { skipped++; continue; }
    entries.push({ word, translation });
  }

  return { entries, skipped };
}

export function entryToVocabItem(entry: CustomWordEntry): VocabItem {
  const slug = entry.word.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "word";
  const id = `custom-${slug}`;
  const now = new Date().toISOString();
  return {
    id,
    word: entry.word,
    normalizedWord: entry.word.toLowerCase().trim(),
    hebrewTranslation: entry.translation,
    englishDefinition: null,
    partOfSpeech: null,
    difficulty: "medium",
    category: null,
    exampleSentence: null,
    exampleSentenceHebrew: null,
    synonyms: [],
    antonyms: [],
    confusingWords: [],
    commonTrap: null,
    tags: ["custom"],
    source: "custom",
    originalLine: `${entry.word} = ${entry.translation}`,
    needsReview: false,
    studyPriority: 5,
    createdAt: now,
    updatedAt: now,
  };
}

export function loadCustomRaw(): string {
  return safeGetItem(customRawK()) ?? "";
}

export function saveCustomRaw(raw: string): void {
  safeSetItem(customRawK(), raw);
}

export function getCustomVocabItems(): VocabItem[] {
  const raw = loadCustomRaw();
  if (!raw.trim()) return [];
  const { entries } = parseCustomList(raw);
  return entries.map(entryToVocabItem);
}

// ─── Structured cards ────────────────────────────────────────────

export interface StructuredCard {
  id: string;
  word: string;
  translation: string;
  cardType?: string;
  difficulty?: VocabDifficulty;
  category?: string;
  exampleSentence?: string;
  notes?: string;
  createdAt: string;
}

export function loadStructuredCards(): StructuredCard[] {
  const raw = safeGetItem(structuredK());
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StructuredCard[];
  } catch {
    return [];
  }
}

export function saveStructuredCards(cards: StructuredCard[]): void {
  safeSetItem(structuredK(), JSON.stringify(cards));
}

export function addStructuredCard(card: Omit<StructuredCard, "id" | "createdAt">): StructuredCard {
  const cards = loadStructuredCards();
  const newCard: StructuredCard = {
    ...card,
    id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  saveStructuredCards([...cards, newCard]);
  return newCard;
}

export function deleteStructuredCard(id: string): void {
  saveStructuredCards(loadStructuredCards().filter((c) => c.id !== id));
}

export function structuredCardToVocabItem(card: StructuredCard): VocabItem {
  const now = new Date().toISOString();
  return {
    id: card.id,
    word: card.word,
    normalizedWord: card.word.toLowerCase().trim(),
    hebrewTranslation: card.translation,
    englishDefinition: card.notes ?? null,
    partOfSpeech: card.cardType ?? null,
    difficulty: card.difficulty ?? "medium",
    category: null,
    exampleSentence: card.exampleSentence ?? null,
    exampleSentenceHebrew: null,
    synonyms: [],
    antonyms: [],
    confusingWords: [],
    commonTrap: null,
    tags: ["custom", "structured"],
    source: "custom",
    originalLine: `${card.word} = ${card.translation}`,
    needsReview: false,
    studyPriority: 5,
    createdAt: card.createdAt,
    updatedAt: now,
  };
}

export function withCustomItems(baseItems: VocabItem[]): VocabItem[] {
  if (typeof window === "undefined") return baseItems;
  const rawCustom = getCustomVocabItems();
  const structuredCustom = loadStructuredCards().map(structuredCardToVocabItem);
  const combined = [...rawCustom, ...structuredCustom];
  if (combined.length === 0) return baseItems;
  // Dedup by ID
  const seen = new Set<string>(baseItems.map((v) => v.id));
  const unique = combined.filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });
  return unique.length > 0 ? [...baseItems, ...unique] : baseItems;
}
