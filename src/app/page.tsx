"use client";
import Link from "next/link";
import { PenLine, Play, BookOpen, Zap, RefreshCw, BarChart2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";

type Feature = {
  Icon: LucideIcon;
  titleKey: keyof Translations["home"];
  descKey: keyof Translations["home"];
  href: string;
  color: string;
};

const FEATURES: Feature[] = [
  { Icon: PenLine,    titleKey: "featSmartPractice", descKey: "featSmartPracticeDesc", href: "/practice",   color: "var(--teal)" },
  { Icon: Play,       titleKey: "featSimulations",   descKey: "featSimulationsDesc",   href: "/simulation", color: "var(--info)" },
  { Icon: BookOpen,   titleKey: "featVocab",          descKey: "featVocabDesc",          href: "/vocab",      color: "var(--success)" },
  { Icon: Zap,        titleKey: "featChallenge",     descKey: "featChallengeDesc",     href: "/challenge",  color: "var(--warn)" },
  { Icon: RefreshCw,  titleKey: "featReview",         descKey: "featReviewDesc",         href: "/review",     color: "var(--danger)" },
  { Icon: BarChart2,  titleKey: "featDashboard",      descKey: "featDashboardDesc",      href: "/app",        color: "var(--ink-soft)" },
];

type SectionPair = {
  nameKey: keyof Translations["home"];
  timeKey: keyof Translations["home"];
};

const SECTIONS: SectionPair[] = [
  { nameKey: "examSection1", timeKey: "examSection1Time" },
  { nameKey: "examSection2", timeKey: "examSection2Time" },
  { nameKey: "examSection3", timeKey: "examSection3Time" },
  { nameKey: "examSection4", timeKey: "examSection4Time" },
  { nameKey: "examSection5", timeKey: "examSection5Time" },
  { nameKey: "examSection6", timeKey: "examSection6Time" },
];

export default function HomePage() {
  const { t } = useLang();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Hero */}
      <section className="card animate-fade-up" style={{
        padding: "2.5rem 2rem",
        background: "var(--teal-faint)",
        borderColor: "var(--teal)",
      }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "var(--teal)",
          marginBottom: "1rem",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal)", display: "inline-block" }} />
          Amirnet Coach — {t.home.tagline}
        </span>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem, 4vw, 2.25rem)",
          fontWeight: 900, color: "var(--ink)", lineHeight: 1.25, marginBottom: "0.875rem",
          maxWidth: 520,
        }}>
          {t.home.hero}
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--ink-soft)", lineHeight: 1.65, marginBottom: "1.5rem", maxWidth: 440 }}>
          {t.home.heroSub}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
          <Link href="/app" className="btn btn-primary btn-lg">{t.home.startFree}</Link>
          <Link href="/simulation" className="btn btn-ghost btn-lg">{t.home.runSim}</Link>
        </div>
        <p style={{ marginTop: "1.25rem", fontSize: "0.72rem", color: "var(--ink-muted)" }}>
          {t.home.disclaimer}
        </p>
      </section>

      {/* Features */}
      <section>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
          {FEATURES.map(({ Icon, titleKey, descKey, href, color }, i) => (
            <Link key={href} href={href}
              className="card card-hover animate-fade-up"
              style={{ padding: "1.25rem", textDecoration: "none", animationDelay: `${i * 0.06}s` }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, marginBottom: "0.75rem",
                background: `color-mix(in srgb, ${color} 12%, var(--raised))`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={18} color={color} strokeWidth={2} />
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", marginBottom: "0.375rem" }}>
                {t.home[titleKey]}
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", lineHeight: 1.55, margin: 0 }}>{t.home[descKey]}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Exam structure */}
      <section className="card animate-fade-up" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "var(--ink)", marginBottom: "1rem" }}>
          {t.home.examStructure}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {SECTIONS.map(({ nameKey, timeKey }, i) => (
            <div key={nameKey} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.7rem 0",
              borderBottom: i < SECTIONS.length - 1 ? "1px solid var(--line)" : "none",
            }}>
              <span style={{ color: "var(--ink-soft)", fontSize: "0.875rem" }}>{t.home[nameKey]}</span>
              <span style={{
                fontSize: "0.72rem", fontWeight: 600, padding: "0.2rem 0.625rem", borderRadius: 6,
                background: "var(--raised)", color: "var(--ink-muted)",
              }}>
                {t.home[timeKey]}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "0.7rem", color: "var(--ink-muted)", marginTop: "1rem", lineHeight: 1.5 }}>
          {t.home.disclaimer}
        </p>
      </section>
    </div>
  );
}
