"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Translations } from "@/lib/i18n/translations";
import { useTheme, DEFAULT_PRIMARY, DEFAULT_BG_HUE_DARK, DEFAULT_BG_HUE_LIGHT } from "@/contexts/ThemeContext";

function hexToHue(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 180;
  const d = max - min;
  let hue = 0;
  if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) hue = ((b - r) / d + 2) / 6;
  else hue = ((r - g) / d + 4) / 6;
  return Math.round(hue * 360);
}

function hueToHex(hue: number, isDark: boolean): string {
  const s = 80, l = isDark ? 52 : 42;
  const hn = hue / 360, sn = s / 100, ln = l / 100;
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const toRgb = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const r = Math.round(toRgb(hn + 1 / 3) * 255);
  const g = Math.round(toRgb(hn) * 255);
  const b = Math.round(toRgb(hn - 1 / 3) * 255);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

type Props = { t: Translations; lang: string; toggleLang: () => void; theme: string; toggleTheme: () => void };

const NAV = (t: Translations) => [
  { href: "/app",              label: t.nav.dashboard,     icon: NavDashboard     },
  { href: "/practice",         label: t.nav.practice,      icon: NavPractice      },
  { href: "/learning-engine",  label: t.nav.learningEngine, icon: NavLearn        },
  { href: "/simulation",       label: t.nav.simulation,    icon: NavSimulation    },
  { href: "/challenge",        label: t.nav.challenge,     icon: NavChallenge     },
  { href: "/vocab",            label: t.nav.vocab,         icon: NavVocab         },
  { href: "/review",           label: t.nav.review,        icon: NavReview        },
];

export function Sidebar({ t, lang, toggleLang, theme, toggleTheme }: Props) {
  const path = usePathname();
  const { settings, setPrimary, resetPrimary, setBgHue, resetBgHue } = useTheme();
  const [hue, setHue] = useState(180);
  const defaultBgHue = settings.mode === "dark" ? DEFAULT_BG_HUE_DARK : DEFAULT_BG_HUE_LIGHT;
  const [bgHue, setBgHueLocal] = useState(settings.bgHue ?? defaultBgHue);

  useEffect(() => {
    const primary = settings.primary === DEFAULT_PRIMARY
      ? (typeof window !== "undefined"
          ? getComputedStyle(document.documentElement).getPropertyValue("--teal").trim()
          : DEFAULT_PRIMARY)
      : settings.primary;
    if (primary.startsWith("#") && primary.length === 7) setHue(hexToHue(primary));
  }, [settings.primary, settings.mode]);

  useEffect(() => {
    setBgHueLocal(settings.bgHue ?? (settings.mode === "dark" ? DEFAULT_BG_HUE_DARK : DEFAULT_BG_HUE_LIGHT));
  }, [settings.bgHue, settings.mode]);

  function handleHueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const h = Number(e.target.value);
    setHue(h);
    setPrimary(hueToHex(h, settings.mode === "dark"));
  }

  function handleBgHueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const h = Number(e.target.value);
    setBgHueLocal(h);
    setBgHue(h);
  }

  return (
    <aside
      className="sidebar-nav hidden lg:flex flex-col fixed top-0 h-full w-64 z-50"
      style={{ background: "var(--surface)" }}
    >
      {/* Brand */}
      <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: "1px solid var(--line)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, var(--teal) 0%, #0994CC 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: "0 2px 8px rgba(13,203,177,0.3)",
          }}>
            <span style={{ color: "#fff", fontSize: "0.9rem", fontWeight: 900, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>A</span>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.08em", color: "var(--teal)", textTransform: "uppercase", lineHeight: 1 }}>AMIRNET</div>
            <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)", lineHeight: 1.3, marginTop: 1 }}>Trainer</div>
          </div>
        </Link>
      </div>

      {/* Primary Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.125rem", overflowY: "auto" }}>
        {NAV(t).map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== "/" && path.startsWith(href));
          return (
            <Link key={href} href={href}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.6rem 0.875rem", borderRadius: 10,
                textDecoration: "none", fontSize: "0.875rem", fontWeight: active ? 600 : 500,
                transition: "all 0.15s ease",
                background: active ? "var(--teal-sub)" : "transparent",
                color: active ? "var(--teal)" : "var(--ink-soft)",
                borderLeft: active ? "2px solid var(--teal)" : "2px solid transparent",
              }}
            >
              <Icon active={active} />
              <span>{label}</span>
            </Link>
          );
        })}

        <div style={{ height: 1, background: "var(--line)", margin: "0.5rem 0" }} />

        <Link href="/pricing"
          style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.6rem 0.875rem", borderRadius: 10, textDecoration: "none",
            fontSize: "0.8rem", fontWeight: 500, color: "var(--ink-muted)",
            transition: "all 0.15s",
          }}
        >
          <NavIcon size={16} opacity={0.6}>◇</NavIcon>
          {t.nav.pricing}
        </Link>
      </nav>

      {/* Controls */}
      <div style={{ borderTop: "1px solid var(--line)" }}>
        {/* Color + BG sliders — shared horizontal padding ensures equal width */}
        <div style={{ padding: "0.75rem 0.75rem 0.5rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {[
            {
              label: "צבע / Color",
              dot: hueToHex(hue, settings.mode === "dark"),
              dotRadius: "50%",
              value: hue,
              onChange: handleHueChange,
              showReset: settings.primary !== DEFAULT_PRIMARY,
              onReset: resetPrimary,
            },
            {
              label: "רקע / BG",
              dot: `hsl(${bgHue}, 55%, ${settings.mode === "dark" ? "22%" : "80%"})`,
              dotRadius: "3px",
              value: bgHue,
              onChange: handleBgHueChange,
              showReset: settings.bgHue !== null && settings.bgHue !== undefined,
              onReset: resetBgHue,
            },
          ].map(({ label, dot, dotRadius, value, onChange, showReset, onReset }) => (
            <div key={label}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <div style={{
                  width: 12, height: 12, borderRadius: dotRadius, flexShrink: 0,
                  background: dot, border: "1.5px solid var(--line)",
                }} />
                <span style={{ fontSize: "0.7rem", color: "var(--ink-muted)", fontFamily: "var(--font-body)", flex: 1 }}>
                  {label}
                </span>
                {showReset && (
                  <button onClick={onReset} style={{
                    fontSize: "0.65rem", color: "var(--ink-muted)", background: "none",
                    border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-body)",
                  }}>
                    איפוס
                  </button>
                )}
              </div>
              <input type="range" min={0} max={360} value={value} onChange={onChange} className="hue-slider" />
            </div>
          ))}
        </div>

        {/* Theme / Lang buttons */}
        <div style={{ padding: "0 0.75rem 0.75rem", display: "flex", gap: "0.5rem" }}>
          <button onClick={toggleTheme}
            style={{
              flex: 1, padding: "0.6rem 0.75rem", borderRadius: 8, border: "1.5px solid var(--line)",
              background: "var(--raised)", color: "var(--ink)", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center",
              justifyContent: "center", gap: "0.4rem", transition: "all 0.15s ease",
              fontFamily: "var(--font-body)",
            }}
          >
            {theme === "dark" ? "☀️" : "🌙"} {theme === "dark" ? "בהיר" : "כהה"}
          </button>
          <button onClick={toggleLang}
            style={{
              padding: "0.6rem 0.75rem", borderRadius: 8, border: "1.5px solid var(--line)",
              background: "var(--raised)", color: "var(--ink)", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 600, transition: "all 0.15s",
              fontFamily: "var(--font-body)",
            }}
          >
            {lang === "he" ? "EN" : "עב"}
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavIcon({ children, size = 18, opacity = 1 }: { children: React.ReactNode; size?: number; opacity?: number }) {
  return (
    <span style={{
      width: size, height: size, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.85, flexShrink: 0, opacity,
    }}>{children}</span>
  );
}

function NavDashboard({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--teal)" : "var(--ink-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function NavPractice({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--teal)" : "var(--ink-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function NavSimulation({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--teal)" : "var(--ink-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" fill={active ? "var(--teal)" : "var(--ink-muted)"} />
    </svg>
  );
}
function NavChallenge({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--teal)" : "var(--ink-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function NavVocab({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--teal)" : "var(--ink-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}
function NavReview({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--teal)" : "var(--ink-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  );
}
function NavLearn({ active }: { active: boolean }) {
  const c = active ? "var(--teal)" : "var(--ink-muted)";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.5-1.3 4.7-3.3 6H8.3A7 7 0 0112 2z" />
    </svg>
  );
}
