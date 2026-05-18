import type { Metadata } from "next";
import { Suspense } from "react";
import PracticeSessionLoader from "@/components/practice/PracticeSessionLoader";

type Props = {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ difficulty?: string }>;
};

const MODE_LABELS: Record<string, string> = {
  sentenceCompletion: "השלמת משפטים",
  restatements: "ניסוח מחדש",
  reading: "קטע קריאה",
  grammar: "דקדוק בהקשר",
  wordFormation: "יצירת מילה",
  textCompletion: "השלמת קטע",
  lectureQuestions: "שאלות על הרצאה",
  writingTask: "מטלת כתיבה",
  mixed: "תרגול מעורב",
  smartReview: "חזרה חכמה",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mode } = await params;
  const label = MODE_LABELS[mode] ?? mode;
  return { title: `Practice — ${label}` };
}

export default async function PracticeModeePage({ params, searchParams }: Props) {
  const { mode } = await params;
  const sp = await searchParams;
  const difficulty = (sp.difficulty ?? "adaptive") as "adaptive" | "easy" | "medium" | "hard";
  const label = MODE_LABELS[mode] ?? mode;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
          {label}
        </h1>
        <p style={{ color: "var(--ink-muted)", marginTop: "0.25rem", fontSize: "0.9rem" }}>
          {mode === "writingTask" ? "סשן תרגול — מטלת כתיבה" : "סשן תרגול — 20 שאלות"}
        </p>
      </div>

      <Suspense
        fallback={
          <div style={{ textAlign: "center", color: "var(--ink-muted)", padding: "3rem" }}>
            טוען שאלות… {/* Loading questions… */}
          </div>
        }
      >
        <PracticeSessionLoader mode={mode} difficulty={difficulty} />
      </Suspense>
    </div>
  );
}
