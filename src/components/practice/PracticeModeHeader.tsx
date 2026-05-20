"use client";

import { useLang } from "@/contexts/LanguageContext";

interface Labels { he: string; en: string }

const MODE_LABELS: Record<string, Labels> = {
  sentenceCompletion: { he: "השלמת משפטים",   en: "Sentence Completion" },
  restatements:       { he: "ניסוח מחדש",      en: "Restatements" },
  reading:            { he: "הבנת הנקרא",      en: "Reading Comprehension" },
  grammar:            { he: "דקדוק בהקשר",     en: "Grammar in Context" },
  wordFormation:      { he: "יצירת מילה",      en: "Word Formation" },
  textCompletion:     { he: "השלמת קטע שמע",   en: "Audio Completion" },
  lectureQuestions:   { he: "הרצאה / שיחה",    en: "Lecture / Conversation" },
  writingTask:        { he: "מטלת כתיבה",      en: "Writing Task" },
  mixed:              { he: "תרגול מעורב",     en: "Mixed Practice" },
  smartReview:        { he: "חזרה חכמה",       en: "Smart Review" },
  vocabularyInContext:{ he: "אוצר מילים בהקשר", en: "Vocabulary in Context" },
  synonymRecognition: { he: "זיהוי נרדפות",     en: "Synonym Recognition" },
  antonymRecognition: { he: "זיהוי הפכים",      en: "Antonym Recognition" },
  connectorPractice:  { he: "מילות קישור",       en: "Connectors Practice" },
  restatementMini:    { he: "ניסוח מחדש מהיר",  en: "Restatement Mini" },
  sentenceLogic:      { he: "היגיון משפטי",     en: "Sentence Logic" },
  distractorTrap:     { he: "מלכודות ניסוח",    en: "Distractor Traps" },
  academicPhrase:     { he: "ביטויים אקדמיים",  en: "Academic Phrases" },
};

export default function PracticeModeHeader({ mode }: { mode: string }) {
  const { lang, t } = useLang();
  const isHe = lang === "he";

  const labels = MODE_LABELS[mode];
  const title = labels ? (isHe ? labels.he : labels.en) : mode;

  const subtitle =
    mode === "writingTask"
      ? t.practice.writingSessionSubtitle
      : mode === "reading"
      ? t.practice.readingPassageSubtitle
      : t.practice.standardSessionSubtitle;

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
        {title}
      </h1>
      <p style={{ color: "var(--ink-muted)", marginTop: "0.25rem", fontSize: "0.9rem" }}>
        {subtitle}
      </p>
    </div>
  );
}
