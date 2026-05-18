import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AMIRNET Trainer — הכנה עצמאית לאנגלית פסיכומטרי",
};

export default function HomePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Hero */}
      <section className="card animate-fade-up" style={{
        padding: "2.5rem 2rem",
        background: "linear-gradient(135deg, #0B1930 0%, #0D2040 50%, #0B1930 100%)",
        border: "1px solid rgba(13,203,177,0.2)",
        overflow: "hidden", position: "relative",
      }}>
        {/* Glow */}
        <div style={{
          position: "absolute", top: -60, right: -60,
          width: 240, height: 240, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(13,203,177,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "0.35rem",
            fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--teal)",
            marginBottom: "1rem",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal)", display: "inline-block" }} />
            AMIRNET / AMIRAM — הכנה עצמאית
          </span>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem, 4vw, 2.25rem)",
            fontWeight: 900, color: "#fff", lineHeight: 1.25, marginBottom: "0.875rem",
            maxWidth: 520,
          }}>
            תתאמן באנגלית ברמת אמירנט עם כלים חכמים
          </h1>
          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.65, marginBottom: "1.5rem", maxWidth: 440 }}>
            מילון חכם, דרילים, הדמיות מלאות וניתוח ביצועים. לא קשור לנית.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
            <Link href="/app" className="btn btn-primary btn-lg">התחל חינם →</Link>
            <Link href="/simulation" className="btn btn-ghost btn-lg"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "#fff" }}>
              הדמיה מלאה
            </Link>
          </div>
          <p style={{ marginTop: "1.25rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>
            כלי הכנה עצמאי לאמירנט. לא קשור לנית. ציונים, הדמיות ותחזיות הם לא רשמיים.
          </p>
        </div>
      </section>

      {/* Features */}
      <section>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
          {FEATURES.map(({ icon, title, desc, href, color }, i) => (
            <Link key={href} href={href}
              className="card card-hover animate-fade-up"
              style={{ padding: "1.25rem", textDecoration: "none", animationDelay: `${i * 0.06}s` }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, marginBottom: "0.75rem",
                background: `color-mix(in srgb, ${color} 12%, var(--raised))`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem",
              }}>
                {icon}
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", marginBottom: "0.375rem" }}>
                {title}
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", lineHeight: 1.55, margin: 0 }}>{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Exam structure */}
      <section className="card animate-fade-up" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "var(--ink)", marginBottom: "1rem" }}>
          מבנה מבחן האמירנט
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {SECTIONS.map(([name, timing], i) => (
            <div key={name} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.7rem 0",
              borderBottom: i < SECTIONS.length - 1 ? "1px solid var(--line)" : "none",
            }}>
              <span style={{ color: "var(--ink-soft)", fontSize: "0.875rem" }}>{name}</span>
              <span style={{
                fontSize: "0.72rem", fontWeight: 600, padding: "0.2rem 0.625rem", borderRadius: 6,
                background: "var(--raised)", color: "var(--ink-muted)",
              }}>
                {timing}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "0.7rem", color: "var(--ink-muted)", marginTop: "1rem", lineHeight: 1.5 }}>
          כלי הכנה עצמאי לאמירנט. לא קשור לנית. ציונים, הדמיות ותחזיות הם לא רשמיים.
        </p>
      </section>
    </div>
  );
}

const FEATURES = [
  { icon: "✏️", title: "תרגול חכם",        desc: "השלמת משפטים, ניסוח מחדש, דקדוק וצורות מילים — מותאם לרמתך.", href: "/practice",   color: "var(--teal)" },
  { icon: "▶",  title: "הדמיות בזמן אמת",  desc: "הדמיות אמירנט מלאות עם תזמון אמיתי וניתוח לפי סעיף.",         href: "/simulation", color: "var(--info)" },
  { icon: "📖", title: "מאמן מילים",        desc: "900+ מילים אנגלית-עברית. כרטיסיות החלקה, חזרה חכמה.",          href: "/vocab",      color: "var(--success)" },
  { icon: "⚡", title: "מצב אתגר",          desc: "תרגול מהיר עם ניקוד, סטריקים ובונוסים — שפר תחת לחץ.",         href: "/challenge",  color: "var(--warn)" },
  { icon: "🔄", title: "סקירה חכמה",        desc: "חזרה אוטומטית על שגיאות ושאלות שלקחו זמן רב.",                  href: "/review",     color: "var(--danger)" },
  { icon: "📊", title: "לוח בקרה",           desc: "עקוב אחר הרצף שלך, הציון המשוער ותחומים לשיפור.",              href: "/app",        color: "var(--ink-soft)" },
];

const SECTIONS: [string, string][] = [
  ["השלמת משפטים",                          "~4 דק׳ · 8 שאלות"],
  ["ניסוח מחדש (Restatements)",              "~6 דק׳ · 8 שאלות"],
  ["הבנת הנקרא",                            "~15–20 דק׳ · 3 קטעים"],
  ["דקדוק בהקשר",                           "~4 דק׳ · 6 שאלות"],
  ["צורות מילים",                            "~4 דק׳ · 6 שאלות"],
  ["סעיפי פיילוט (הרצאה, השלמת טקסט)",     "~7–11 דק׳ · ניסיוני"],
];
