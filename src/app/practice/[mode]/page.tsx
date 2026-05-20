import type { Metadata } from "next";
import { Suspense } from "react";
import PracticeSessionLoader from "@/components/practice/PracticeSessionLoader";
import PracticeModeHeader from "@/components/practice/PracticeModeHeader";

type Props = {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ difficulty?: string }>;
};

// Used only for the browser tab title (server-side metadata).
const MODE_TAB_TITLE_EN: Record<string, string> = {
  sentenceCompletion: "Sentence Completion",
  restatements: "Restatements",
  reading: "Reading Comprehension",
  grammar: "Grammar in Context",
  wordFormation: "Word Formation",
  textCompletion: "Audio Completion",
  lectureQuestions: "Lecture / Conversation",
  writingTask: "Writing Task",
  mixed: "Mixed Practice",
  smartReview: "Smart Review",
  vocabularyInContext: "Vocabulary in Context",
  synonymRecognition: "Synonym Recognition",
  antonymRecognition: "Antonym Recognition",
  connectorPractice: "Connectors Practice",
  restatementMini: "Restatement Mini",
  sentenceLogic: "Sentence Logic",
  distractorTrap: "Distractor Traps",
  academicPhrase: "Academic Phrases",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mode } = await params;
  const label = MODE_TAB_TITLE_EN[mode] ?? mode;
  return { title: `Practice — ${label}` };
}

export default async function PracticeModeePage({ params, searchParams }: Props) {
  const { mode } = await params;
  const sp = await searchParams;
  const difficulty = (sp.difficulty ?? "adaptive") as "adaptive" | "easy" | "medium" | "hard";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PracticeModeHeader mode={mode} />

      <Suspense
        fallback={
          <PracticeLoadingFallback />
        }
      >
        <PracticeSessionLoader mode={mode} difficulty={difficulty} />
      </Suspense>
    </div>
  );
}

function PracticeLoadingFallback() {
  return (
    <div style={{ textAlign: "center", color: "var(--ink-muted)", padding: "3rem" }}>
      Loading…
    </div>
  );
}
