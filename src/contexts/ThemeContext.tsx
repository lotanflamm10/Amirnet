"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";

export interface ThemeSettings {
  mode: ThemeMode;
  primary: string;
  bgHue: number | null;
}

const SETTINGS_KEY = "amirnet-theme-settings-v1";
const LEGACY_KEY = "amirnet-theme";
export const DEFAULT_PRIMARY = "#0DCBB1";
export const DEFAULT_BG_HUE_DARK = 222;
export const DEFAULT_BG_HUE_LIGHT = 230;

const PRESET_COLORS = [
  { label: "ברירת מחדל", value: DEFAULT_PRIMARY },
  { label: "כחול", value: "#60A5FA" },
  { label: "סגול", value: "#A78BFA" },
  { label: "ורוד", value: "#F472B6" },
  { label: "כתום", value: "#FB923C" },
  { label: "ירוק", value: "#4ADE80" },
];
export { PRESET_COLORS };

/**
 * Resolve a (possibly legacy) persisted theme value to the binary mode.
 * "system" is the dropped 3-state value — we coerce it to whatever the OS
 * preference resolves to once, then the migration in `loadSettings` re-
 * persists the concrete value.
 */
function resolveLegacySystem(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Public helper for callers that used to ask "is the resolved mode dark or light?". */
export function getEffectiveMode(mode: ThemeMode): "dark" | "light" {
  return mode;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function hexToAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

function darkenHex(hex: string, pct: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const f = 1 - pct / 100;
  const r = Math.max(0, Math.round(rgb.r * f)).toString(16).padStart(2, "0");
  const g = Math.max(0, Math.round(rgb.g * f)).toString(16).padStart(2, "0");
  const b = Math.max(0, Math.round(rgb.b * f)).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

function hslToHex(h: number, s: number, l: number): string {
  const hn = h / 360, sn = s / 100, ln = l / 100;
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const toRgb = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 0.5) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const r = Math.round(toRgb(hn + 1 / 3) * 255);
  const g = Math.round(toRgb(hn) * 255);
  const b = Math.round(toRgb(hn - 1 / 3) * 255);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function applyBgToDom(effective: "dark" | "light", bgHue: number | null) {
  const el = document.documentElement;
  const BG_VARS = ["--canvas", "--surface", "--raised", "--line"] as const;
  if (bgHue === null) {
    BG_VARS.forEach((v) => el.style.removeProperty(v));
    return;
  }
  const h = bgHue;
  if (effective === "dark") {
    el.style.setProperty("--canvas",  hslToHex(h, 28, 7));
    el.style.setProperty("--surface", hslToHex(h, 34, 13));
    el.style.setProperty("--raised",  hslToHex(h, 30, 17));
    el.style.setProperty("--line",    hslToHex(h, 26, 20));
  } else {
    el.style.setProperty("--canvas",  hslToHex(h, 60, 97));
    el.style.setProperty("--surface", hslToHex(h, 20, 100));
    el.style.setProperty("--raised",  hslToHex(h, 55, 96));
    el.style.setProperty("--line",    hslToHex(h, 50, 90));
  }
}

export function applyThemeToDom(settings: ThemeSettings) {
  const effective = settings.mode;
  document.documentElement.setAttribute("data-theme", effective);
  const el = document.documentElement;
  if (settings.primary && settings.primary !== DEFAULT_PRIMARY) {
    const p = settings.primary;
    el.style.setProperty("--teal", p);
    el.style.setProperty("--teal-h", darkenHex(p, 10));
    el.style.setProperty("--teal-sub", hexToAlpha(p, 0.10));
    el.style.setProperty("--teal-faint", hexToAlpha(p, 0.06));
    el.style.setProperty("--shadow-teal", `0 4px 24px ${hexToAlpha(p, 0.18)}`);
    el.style.setProperty("--shadow-btn-primary", `0 2px 8px ${hexToAlpha(p, 0.30)}`);
    el.style.setProperty("--shadow-btn-primary-hover", `0 4px 16px ${hexToAlpha(p, 0.35)}`);
  } else {
    el.style.removeProperty("--teal");
    el.style.removeProperty("--teal-h");
    el.style.removeProperty("--teal-sub");
    el.style.removeProperty("--teal-faint");
    el.style.removeProperty("--shadow-teal");
    el.style.removeProperty("--shadow-btn-primary");
    el.style.removeProperty("--shadow-btn-primary-hover");
  }
  applyBgToDom(effective, settings.bgHue);
}

function loadSettings(): ThemeSettings {
  if (typeof window === "undefined") return { mode: "dark", primary: DEFAULT_PRIMARY, bgHue: null };
  let migratedFromSystem = false;
  let resolved: ThemeSettings = { mode: "dark", primary: DEFAULT_PRIMARY, bgHue: null };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      // `mode` is widened to string here so we can still match the dropped
      // "system" value and migrate it; the union itself no longer accepts it.
      const parsed = JSON.parse(raw) as { mode?: string; primary?: string; bgHue?: number };
      let mode: ThemeMode;
      if (parsed.mode === "light") mode = "light";
      else if (parsed.mode === "system") { mode = resolveLegacySystem(); migratedFromSystem = true; }
      else mode = "dark";
      resolved = {
        mode,
        primary: parsed.primary ?? DEFAULT_PRIMARY,
        bgHue: typeof parsed.bgHue === "number" && parsed.bgHue >= 0 && parsed.bgHue <= 360
          ? parsed.bgHue : null,
      };
    } else {
      const legacy = localStorage.getItem(LEGACY_KEY);
      resolved = { mode: legacy === "light" ? "light" : "dark", primary: DEFAULT_PRIMARY, bgHue: null };
    }
  } catch { /* ignore — fall back to defaults */ }

  if (migratedFromSystem) {
    // Re-persist the concrete value so the next load doesn't have to migrate again.
    saveSettings(resolved);
  }
  return resolved;
}

function saveSettings(s: ThemeSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    // Keep legacy key in sync for the bootstrap script
    localStorage.setItem(LEGACY_KEY, s.mode);
  } catch { /* ignore */ }
}

interface ThemeCtxValue {
  settings: ThemeSettings;
  effectiveMode: "dark" | "light";
  toggle: () => void;
  setPrimary: (hex: string) => void;
  resetPrimary: () => void;
  setBgHue: (hue: number) => void;
  resetBgHue: () => void;
}

const ThemeCtx = createContext<ThemeCtxValue>({
  settings: { mode: "dark", primary: DEFAULT_PRIMARY, bgHue: null },
  effectiveMode: "dark",
  toggle: () => {},
  setPrimary: () => {},
  resetPrimary: () => {},
  setBgHue: () => {},
  resetBgHue: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>({ mode: "dark", primary: DEFAULT_PRIMARY, bgHue: null });
  const [effectiveMode, setEffectiveMode] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setEffectiveMode(s.mode);
    applyThemeToDom(s);
  }, []);

  function toggle() {
    setSettings((prev) => {
      const nextMode: ThemeMode = prev.mode === "dark" ? "light" : "dark";
      const next: ThemeSettings = { ...prev, mode: nextMode };
      setEffectiveMode(nextMode);
      saveSettings(next);
      applyThemeToDom(next);
      return next;
    });
  }

  function setPrimary(hex: string) {
    setSettings((prev) => {
      const next: ThemeSettings = { ...prev, primary: hex };
      saveSettings(next);
      applyThemeToDom(next);
      return next;
    });
  }

  function resetPrimary() { setPrimary(DEFAULT_PRIMARY); }

  function setBgHue(hue: number) {
    setSettings((prev) => {
      const next: ThemeSettings = { ...prev, bgHue: hue };
      saveSettings(next);
      applyThemeToDom(next);
      return next;
    });
  }

  function resetBgHue() {
    setSettings((prev) => {
      const next: ThemeSettings = { ...prev, bgHue: null };
      saveSettings(next);
      applyThemeToDom(next);
      return next;
    });
  }

  return (
    <ThemeCtx.Provider value={{ settings, effectiveMode, toggle, setPrimary, resetPrimary, setBgHue, resetBgHue }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
