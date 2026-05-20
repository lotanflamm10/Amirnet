"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Translations } from "@/lib/i18n/translations";
import { NavIcon } from "@/components/icons/NavIcons";

const TABS = (t: Translations) => [
  { href: "/app",             label: t.nav.dashboard,      icon: "dashboard"      },
  { href: "/practice",        label: t.nav.practice,       icon: "practice"       },
  { href: "/simulation",      label: t.nav.simulation,     icon: "simulation"     },
  { href: "/vocab",           label: t.nav.vocab,          icon: "vocab"          },
  { href: "/learning-engine", label: t.nav.learningEngine, icon: "learningEngine" },
  { href: "/account",         label: t.nav.account,        icon: "account"        },
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
              flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "0.5rem 0.15rem", gap: "0.2rem",
              textDecoration: "none", fontSize: "0.62rem", fontWeight: 600,
              color: active ? "var(--teal)" : "var(--ink-muted)",
              transition: "color 0.15s",
              position: "relative",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {active && (
              <span style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                width: 28, height: 2, borderRadius: "0 0 2px 2px",
                background: "var(--teal)",
              }} />
            )}
            <NavIcon name={icon} size={18} color={active ? "var(--teal)" : "var(--ink-muted)"} />
            <span
              style={{
                lineHeight: 1.05,
                letterSpacing: "0.005em",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
