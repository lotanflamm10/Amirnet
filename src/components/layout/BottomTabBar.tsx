"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Translations } from "@/lib/i18n/translations";
import { NavIcon, ChevronDown } from "@/components/icons/NavIcons";

interface TabItem {
  href: string;
  label: string;
  icon: string;
}

const PRIMARY = (t: Translations): TabItem[] => [
  { href: "/app",        label: t.nav.dashboard,  icon: "dashboard"  },
  { href: "/practice",   label: t.nav.practice,   icon: "practice"   },
  { href: "/simulation", label: t.nav.simulation, icon: "simulation" },
  { href: "/vocab",      label: t.nav.vocab,      icon: "vocab"      },
];

// "More" sheet exposes the remaining sidebar entries so every desktop nav
// destination is reachable from mobile within two taps (More → item).
const SECONDARY = (t: Translations): TabItem[] => [
  { href: "/review",          label: t.nav.review,         icon: "review"         },
  { href: "/challenge",       label: t.nav.challenge,      icon: "challenge"      },
  { href: "/learning-engine", label: t.nav.learningEngine, icon: "learningEngine" },
  { href: "/account",         label: t.nav.account,        icon: "account"        },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

export function BottomTabBar({ t }: { t: Translations }) {
  const path = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [examActive, setExamActive] = useState(false);

  const primary = PRIMARY(t);
  const secondary = SECONDARY(t);

  const moreActive = secondary.some((item) => isActive(path, item.href));

  // Close the More sheet when the route changes (e.g. user taps an entry).
  useEffect(() => {
    setMoreOpen(false);
  }, [path]);

  // Hide the tab bar while a timed simulation/challenge is in progress.
  // SimulationRunner and ChallengeSession set <html data-exam-active="1">
  // for the duration of the active phase; we mirror that into local state
  // via a MutationObserver so render stays declarative.
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setExamActive(root.getAttribute("data-exam-active") === "1");
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["data-exam-active"] });
    return () => obs.disconnect();
  }, []);

  // Lock the page scroll while the sheet is open so the underlay doesn't slide.
  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [moreOpen]);

  if (examActive) return null;

  function handleSecondaryClick(href: string) {
    setMoreOpen(false);
    router.push(href);
  }

  return (
    <>
      <nav
        className="lg:hidden flex fixed bottom-0 left-0 right-0 z-40"
        aria-label={t.nav.bottomNavAria}
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--line)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {primary.map(({ href, label, icon }) => {
          const active = isActive(path, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              style={{
                flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "0.5rem 0.15rem", gap: "0.2rem",
                minHeight: 48,
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

        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          aria-current={moreActive ? "page" : undefined}
          style={{
            flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "0.5rem 0.15rem", gap: "0.2rem",
            minHeight: 48,
            background: "none", border: "none",
            fontSize: "0.62rem", fontWeight: 600,
            color: moreActive || moreOpen ? "var(--teal)" : "var(--ink-muted)",
            transition: "color 0.15s",
            position: "relative",
            WebkitTapHighlightColor: "transparent",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {(moreActive || moreOpen) && (
            <span style={{
              position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
              width: 28, height: 2, borderRadius: "0 0 2px 2px",
              background: "var(--teal)",
            }} />
          )}
          <ChevronDown size={18} color={moreActive || moreOpen ? "var(--teal)" : "var(--ink-muted)"} strokeWidth={2} />
          <span style={{ lineHeight: 1.05, letterSpacing: "0.005em" }}>{t.nav.more}</span>
        </button>
      </nav>

      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          onClick={() => setMoreOpen(false)}
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            role="menu"
            aria-label={t.nav.moreSheetAria}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute", left: 0, right: 0, bottom: 0,
              background: "var(--surface)",
              borderTop: "1px solid var(--line)",
              borderTopLeftRadius: 14, borderTopRightRadius: 14,
              padding: "0.75rem 0.75rem calc(0.75rem + env(safe-area-inset-bottom, 0px))",
              display: "flex", flexDirection: "column", gap: "0.25rem",
              boxShadow: "0 -8px 24px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{
              width: 40, height: 4, borderRadius: 2,
              background: "var(--line)", margin: "0 auto 0.5rem",
            }} />
            {secondary.map(({ href, label, icon }) => {
              const active = isActive(path, href);
              return (
                <button
                  key={href}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSecondaryClick(href)}
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    minHeight: 48,
                    background: active ? "var(--teal-sub)" : "transparent",
                    border: "none",
                    borderRadius: 10,
                    fontSize: "0.95rem", fontWeight: active ? 700 : 500,
                    color: active ? "var(--teal)" : "var(--ink)",
                    cursor: "pointer",
                    textAlign: "start",
                    fontFamily: "inherit",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <NavIcon name={icon} size={20} color={active ? "var(--teal)" : "var(--ink-muted)"} />
                  <span>{label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              aria-label={t.nav.closeAria}
              style={{
                marginTop: "0.5rem",
                padding: "0.6rem 1rem",
                minHeight: 44,
                background: "var(--raised)",
                color: "var(--ink-soft)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                fontSize: "0.85rem", fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t.nav.closeAria}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
