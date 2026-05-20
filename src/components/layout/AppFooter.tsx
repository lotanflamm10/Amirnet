"use client";
import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { useLang } from "@/contexts/LanguageContext";

export function AppFooter() {
  const { lang } = useLang();
  const isHe = lang === "he";
  return (
    <footer style={{
      borderTop: "1px solid var(--line)", padding: "1rem 1.5rem",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "1rem", flexWrap: "wrap",
    }}>
      <BrandMark size={24} showName showTagline={false} />
      <p style={{ fontSize: "0.7rem", color: "var(--ink-muted)", textAlign: "center", flex: 1 }}>
        {isHe
          ? "כלי הכנה עצמאי לאמירנט · לא קשור לנית · ציונים אינם רשמיים"
          : "Independent AMIRNET prep tool · not affiliated with NITE · scores are unofficial"}
      </p>
      <div style={{ display: "flex", gap: "1rem" }}>
        {[
          { href: "/legal/privacy", he: "פרטיות", en: "Privacy" },
          { href: "/legal/terms",   he: "תנאים",  en: "Terms" },
          { href: "/pricing",       he: "תמחור",  en: "Pricing" },
        ].map(({ href, he, en }) => (
          <Link key={href} href={href}
            style={{ fontSize: "0.72rem", color: "var(--ink-muted)", textDecoration: "none", transition: "color 0.15s" }}
          >{isHe ? he : en}</Link>
        ))}
      </div>
    </footer>
  );
}
