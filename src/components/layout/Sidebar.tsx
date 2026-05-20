"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Translations } from "@/lib/i18n/translations";
import { useTheme, DEFAULT_PRIMARY, DEFAULT_BG_HUE_DARK, DEFAULT_BG_HUE_LIGHT } from "@/contexts/ThemeContext";
import { BrandMark } from "@/components/brand/BrandMark";
import { NavIcon, Sun, Moon, Monitor, Globe } from "@/components/icons/NavIcons";
import { Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Helpers: accent hue ──────────────────────────────────────────────────────
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

// ─── Nav items ────────────────────────────────────────────────────────────────
type Props = { t: Translations; lang: string; toggleLang: () => void; theme: string; toggleTheme: () => void };

const NAV = (t: Translations) => [
  { href: "/app",             label: t.nav.dashboard,      icon: "dashboard"      },
  { href: "/practice",        label: t.nav.practice,       icon: "practice"       },
  { href: "/learning-engine", label: t.nav.learningEngine, icon: "learningEngine" },
  { href: "/simulation",      label: t.nav.simulation,     icon: "simulation"     },
  { href: "/challenge",       label: t.nav.challenge,      icon: "challenge"      },
  { href: "/vocab",           label: t.nav.vocab,          icon: "vocab"          },
  { href: "/review",          label: t.nav.review,         icon: "review"         },
];

const THEME_CYCLE: Record<string, { labelKey: keyof Translations["sidebar"]; Icon: LucideIcon }> = {
  dark:   { labelKey: "themeDark",   Icon: Moon },
  light:  { labelKey: "themeLight",  Icon: Sun },
  system: { labelKey: "themeSystem", Icon: Monitor },
};

export function Sidebar({ t, lang, toggleLang, theme, toggleTheme }: Props) {
  const path = usePathname();
  const { settings, effectiveMode, setPrimary, resetPrimary, setBgHue, resetBgHue } = useTheme();
  const [hue, setHue] = useState(180);
  const defaultBgHue = effectiveMode === "dark" ? DEFAULT_BG_HUE_DARK : DEFAULT_BG_HUE_LIGHT;
  const [bgHue, setBgHueLocal] = useState(settings.bgHue ?? defaultBgHue);

  useEffect(() => {
    const primary = settings.primary === DEFAULT_PRIMARY
      ? (typeof window !== "undefined"
          ? getComputedStyle(document.documentElement).getPropertyValue("--teal").trim()
          : DEFAULT_PRIMARY)
      : settings.primary;
    if (primary.startsWith("#") && primary.length === 7) setHue(hexToHue(primary));
  }, [settings.primary, effectiveMode]);

  useEffect(() => {
    setBgHueLocal(settings.bgHue ?? (effectiveMode === "dark" ? DEFAULT_BG_HUE_DARK : DEFAULT_BG_HUE_LIGHT));
  }, [settings.bgHue, effectiveMode]);

  function handleHueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const h = Number(e.target.value);
    setHue(h);
    setPrimary(hueToHex(h, effectiveMode === "dark"));
  }

  function handleBgHueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const h = Number(e.target.value);
    setBgHueLocal(h);
    setBgHue(h);
  }

  const themeCtrl = THEME_CYCLE[theme] ?? THEME_CYCLE.dark;
  const ThemeIconComponent = themeCtrl.Icon;

  return (
    <aside
      className="sidebar-nav hidden lg:flex flex-col fixed top-0 h-full w-64 z-50"
      style={{ background: "var(--surface)" }}
    >
      {/* Brand */}
      <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: "1px solid var(--line)" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <BrandMark size={36} showName showTagline={false} />
        </Link>
      </div>

      {/* Primary Nav */}
      <nav style={{ flex: 1, padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.125rem", overflowY: "auto" }}>
        {NAV(t).map(({ href, label, icon }) => {
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
                // Logical property: paints on the side closest to the
                // sidebar edge — right in RTL (Hebrew), left in LTR (English).
                borderInlineStart: active ? "2px solid var(--teal)" : "2px solid transparent",
              }}
            >
              <NavIcon name={icon} size={17} color={active ? "var(--teal)" : "var(--ink-muted)"} />
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
          <Tag size={16} color="var(--ink-muted)" strokeWidth={2} />
          {t.nav.pricing}
        </Link>
      </nav>

      {/* Controls */}
      <div style={{ borderTop: "1px solid var(--line)" }}>
        {/* Color + BG sliders */}
        <div style={{ padding: "0.75rem 0.75rem 0.5rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {[
            {
              key: "color",
              label: t.sidebar.colorLabel,
              dot: hueToHex(hue, effectiveMode === "dark"),
              dotRadius: "50%",
              value: hue,
              onChange: handleHueChange,
              showReset: settings.primary !== DEFAULT_PRIMARY,
              onReset: resetPrimary,
            },
            {
              key: "bg",
              label: t.sidebar.bgLabel,
              dot: `hsl(${bgHue}, 55%, ${effectiveMode === "dark" ? "22%" : "80%"})`,
              dotRadius: "3px",
              value: bgHue,
              onChange: handleBgHueChange,
              showReset: settings.bgHue !== null && settings.bgHue !== undefined,
              onReset: resetBgHue,
            },
          ].map(({ key, label, dot, dotRadius, value, onChange, showReset, onReset }) => (
            <div key={key}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <div style={{ width: 12, height: 12, borderRadius: dotRadius, flexShrink: 0, background: dot, border: "1.5px solid var(--line)" }} />
                <span style={{ fontSize: "0.7rem", color: "var(--ink-muted)", fontFamily: "var(--font-body)", flex: 1 }}>{label}</span>
                {showReset && (
                  <button onClick={onReset} style={{ fontSize: "0.65rem", color: "var(--ink-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-body)" }}>
                    {t.sidebar.reset}
                  </button>
                )}
              </div>
              <input type="range" min={0} max={360} value={value} onChange={onChange} className="hue-slider" />
            </div>
          ))}
        </div>

        {/* Theme / Lang buttons */}
        <div style={{ padding: "0 0.75rem 0.75rem", display: "flex", gap: "0.5rem" }}>
          <button
            onClick={toggleTheme}
            aria-label={`Switch theme (current: ${theme})`}
            style={{
              flex: 1, padding: "0.6rem 0.75rem", borderRadius: 8, border: "1.5px solid var(--line)",
              background: "var(--raised)", color: "var(--ink)", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center",
              justifyContent: "center", gap: "0.4rem", transition: "all 0.15s ease",
              fontFamily: "var(--font-body)",
            }}
          >
            <ThemeIconComponent size={14} strokeWidth={2} />
            {t.sidebar[themeCtrl.labelKey]}
          </button>
          <button
            onClick={toggleLang}
            aria-label="Switch language"
            style={{
              padding: "0.6rem 0.75rem", borderRadius: 8, border: "1.5px solid var(--line)",
              background: "var(--raised)", color: "var(--ink)", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 600, transition: "all 0.15s",
              fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: "0.35rem",
            }}
          >
            <Globe size={14} strokeWidth={2} />
            {lang === "he" ? "EN" : "עב"}
          </button>
        </div>
      </div>
    </aside>
  );
}
