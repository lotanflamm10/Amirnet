"use client";

import { useLang } from "@/contexts/LanguageContext";

export default function TermsPage() {
  const { lang } = useLang();
  const isHe = lang === "he";

  const title = isHe ? "תנאי שימוש" : "Terms of Use";

  const paragraphs = isHe
    ? [
        "Amirnet Coach הוא כלי לימוד עצמאי. הוא אינו קשור למאל״ו, ל-NITE או לכל גוף בחינה רשמי.",
        "כל השאלות ואוצר המילים הם מקוריים או שנתרמו על ידי משתמשים. אין שכפול של שאלות מבחן רשמיות. כל התוכן מיועד למטרות חינוכיות ולתרגול בלבד.",
        "ציונים, הדמיות והמלצות שמופקים באפליקציה אינם רשמיים ומיועדים להערכה עצמית בלבד. אין להשתמש בהם כאינדיקציה לביצועים במבחן הרשמי.",
        "השימוש בכלי הוא לצורך לימוד אישי ולא מסחרי בלבד.",
      ]
    : [
        "Amirnet Coach is an independent study tool. It is not affiliated with NITE or any official examination authority.",
        "All questions and vocabulary are original or user-contributed. No official NITE questions are reproduced. All content is for educational and practice purposes only.",
        "Scores, simulations, and predictions are unofficial. They are intended for self-assessment only and should not be used as indicators of official exam performance.",
        "By using this tool, you agree to use it for personal, non-commercial study purposes only.",
      ];

  return (
    <article
      dir={isHe ? "rtl" : "ltr"}
      style={{
        maxWidth: 720,
        marginInline: "auto",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        boxSizing: "border-box",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.5rem, 5vw, 2rem)",
          fontWeight: 800,
          color: "var(--ink)",
          margin: 0,
          textAlign: isHe ? "right" : "left",
        }}
      >
        {title}
      </h1>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          color: "var(--ink-soft)",
          fontSize: "0.95rem",
          lineHeight: 1.7,
          textAlign: isHe ? "right" : "left",
        }}
      >
        {paragraphs.map((p, i) => (
          <p key={i} style={{ margin: 0, overflowWrap: "anywhere" }}>
            {p}
          </p>
        ))}
      </div>
    </article>
  );
}
