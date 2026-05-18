"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Translations } from "@/lib/i18n/translations";

const TABS = (t: Translations) => [
  { href: "/app",              label: t.nav.dashboard,      icon: "⊟" },
  { href: "/practice",         label: t.nav.practice,       icon: "✏" },
  { href: "/learning-engine",  label: t.nav.learningEngine, icon: "💡" },
  { href: "/vocab",            label: t.nav.vocab,          icon: "📖" },
  { href: "/account",          label: t.nav.account,        icon: "◉" },
];

export function BottomTabBar({ t }: { t: Translations }) {
  const path = usePathname();
  return (
    <nav
      className="lg:hidden flex fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--line)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {TABS(t).map(({ href, label, icon }) => {
        const active = path === href || (href !== "/" && path.startsWith(href));
        return (
          <Link key={href} href={href}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "0.625rem 0.25rem", gap: "0.2rem",
              textDecoration: "none", fontSize: "0.65rem", fontWeight: 600,
              color: active ? "var(--teal)" : "var(--ink-muted)",
              transition: "color 0.15s",
              position: "relative",
            }}
          >
            {active && (
              <span style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                width: 28, height: 2, borderRadius: "0 0 2px 2px",
                background: "var(--teal)",
              }} />
            )}
            <span style={{ fontSize: "1.15rem", lineHeight: 1 }}>{icon}</span>
            <span style={{ lineHeight: 1, letterSpacing: "0.01em" }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
