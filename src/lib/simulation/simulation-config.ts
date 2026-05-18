import configRaw from "@/data/seed/simulation-config.json";

export interface SectionConfig {
  id: string;
  type: string;
  questionCount: number;
  timeLimitSeconds: number;
  isPilot: boolean;
  label: string;
}

export type SimMode = "standard" | "withPilot" | "withWriting" | "quick" | "pilotOnly";

export function getStandardSections(): SectionConfig[] {
  return configRaw.standard.sections as SectionConfig[];
}

export function getRandomPilotSections(count = 2): SectionConfig[] {
  const pilots = (configRaw.pilotTypes as SectionConfig[]).filter(
    (p) => p.type !== "writingTask"
  );
  const result: SectionConfig[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pilots.length);
    result.push({ ...pilots[idx], id: `${pilots[idx].id}-${i}` });
  }
  return result;
}

export function getWritingSection(): SectionConfig {
  const writing = (configRaw.pilotTypes as SectionConfig[]).find(
    (p) => p.type === "writingTask"
  );
  if (!writing) throw new Error("writingTask pilot section not found in config");
  return { ...writing, id: "pilotE-writing" };
}

export function getSectionsByMode(mode: SimMode): SectionConfig[] {
  switch (mode) {
    case "standard":     return getStandardSections();
    case "withPilot":    return [...getStandardSections(), ...getRandomPilotSections(2)];
    case "withWriting":  return [...getStandardSections(), getWritingSection()];
    case "quick":        return getStandardSections().filter((s) => ["s1", "s3", "s6"].includes(s.id));
    case "pilotOnly":    return getRandomPilotSections(2);
  }
}
