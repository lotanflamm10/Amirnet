"use client";
import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { useLang } from "@/contexts/LanguageContext";

/**
 * Single source of truth for the global app disclaimer / legal links.
 * Mounted from <AppShell/> at the bottom of every authenticated route on
 * desktop. Mobile relies on the bottom tab bar for nav — disclaimer is
 * shown only on legal pages, /pricing, /account directly via this footer
 * being rendered by AppShell on lg+. Per-page disclaimers should NOT
 * exist; if you need one, use this component or update the strings here.
 */
export function AppFooter() {
  const { lang } = useLang();
  const isHe = lang === "he";

  const disclaimer = isHe
    ? "Amirnet Coach הוא כלי עצמאי להכנה לאמירנט. אינו קשור למאל״ו או ל-NITE. הציונים והחיזויים אינם רשמיים."
    : "Amirnet Coach is an independent AMIRNET preparation tool. It is not affiliated with NITE or any official examination body. Scores and predictions are unofficial.";

  return (
    <footer
      dir={isHe ? "rtl" : "ltr"}
      style={{
        borderTop: "1px solid var(--line)",
        padding: "1rem 1.5rem",
        paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
        boxSizing: "border-box",
        maxWidth: "100%",
        overflowWrap: "anywhere",
      }}
    >
      <BrandMark size={24} showName showTagline={false} />
      <p
        style={{
          fontSize: "0.72rem",
          color: "var(--ink-muted)",
          textAlign: "center",
          lineHeight: 1.5,
          flex: "1 1 280px",
          minWidth: 0,
          margin: 0,
        }}
      >
        {disclaimer}
      </p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {[
          { href: "/legal/privacy", he: "פרטיות", en: "Privacy" },
          { href: "/legal/terms", he: "תנאים", en: "Terms" },
          { href: "/pricing", he: "תמחור", en: "Pricing" },
        ].map(({ href, he, en }) => (
          <Link
            key={href}
            href={href}
            style={{
              fontSize: "0.74rem",
              color: "var(--ink-muted)",
              textDecoration: "none",
              transition: "color 0.15s",
            }}
          >
            {isHe ? he : en}
          </Link>
        ))}
      </div>
    </footer>
  );
}
