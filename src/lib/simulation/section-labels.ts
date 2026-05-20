import type { SectionConfig } from "./simulation-config";
import type { Translations } from "@/lib/i18n/translations";

/**
 * Localized base name for a section type. The seed JSON labels are Hebrew
 * only — we ignore them and synthesize a label from the section `type`.
 */
export function sectionTypeLabel(type: string, t: Translations): string {
  switch (type) {
    case "sentenceCompletion": return t.simulation.sectionTypeSentenceCompletion;
    case "restatements":       return t.simulation.sectionTypeRestatements;
    case "reading":            return t.simulation.sectionTypeReading;
    case "lectureQuestions":   return t.simulation.sectionTypeLectureQuestions;
    case "textCompletion":     return t.simulation.sectionTypeTextCompletion;
    case "wordFormation":      return t.simulation.sectionTypeWordFormation;
    case "grammar":            return t.simulation.sectionTypeGrammar;
    case "writingTask":        return t.simulation.sectionTypeWritingTask;
    default:                   return type;
  }
}

const HE_ORDINALS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ז׳", "ח׳"];

/**
 * Returns a localized label for a section that already appears in a list,
 * appending an ordinal suffix when there are multiple sections of the same
 * type (e.g. "Sentence Completion 1", "Sentence Completion 2").
 *
 * In Hebrew the ordinal uses traditional Hebrew letters (א׳/ב׳/ג׳…) to match
 * the existing seed labels; in English we use plain Arabic numerals.
 */
export function sectionDisplayLabel(
  section: SectionConfig,
  allSections: SectionConfig[],
  t: Translations,
  lang: "he" | "en",
): string {
  const base = sectionTypeLabel(section.type, t);
  const sameType = allSections.filter((s) => s.type === section.type);
  if (sameType.length <= 1) return base;
  const index = sameType.indexOf(section);
  if (index < 0) return base;
  const suffix = lang === "he"
    ? ` ${HE_ORDINALS[index] ?? String(index + 1)}`
    : ` ${index + 1}`;
  return base + suffix;
}
