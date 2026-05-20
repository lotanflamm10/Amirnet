"use client";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { he, en, type Translations } from "@/lib/i18n/translations";

type Lang = "he" | "en";

function applyLangToDom(lang: Lang) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
}

const LangCtx = createContext<{ lang: Lang; t: Translations; toggle: () => void }>({
  lang: "he", t: he, toggle: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  // SSR + initial client render always start in Hebrew to match what was
  // delivered in the HTML stream (this preserves hydration correctness).
  // `useLayoutEffect` then synchronously swaps to the saved language BEFORE
  // the first browser paint, so the user never sees the Hebrew flash when
  // English is their selected language.
  const [lang, setLang] = useState<Lang>("he");

  useLayoutEffect(() => {
    let saved: Lang | null = null;
    // Prefer the value that the inline boot script in app/layout.tsx already
    // wrote onto <html lang>, falling back to localStorage if that's missing.
    if (typeof document !== "undefined") {
      const fromDom = document.documentElement.getAttribute("lang");
      if (fromDom === "en" || fromDom === "he") saved = fromDom;
    }
    if (!saved) {
      try {
        const ls = localStorage.getItem("amirnet-lang");
        if (ls === "en" || ls === "he") saved = ls;
      } catch {
        /* ignore */
      }
    }
    if (saved && saved !== lang) setLang(saved);
    applyLangToDom(saved ?? lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === "he" ? "en" : "he";
      try {
        localStorage.setItem("amirnet-lang", next);
      } catch {
        /* quota — silent */
      }
      applyLangToDom(next);
      return next;
    });
  }, []);

  const t = lang === "he" ? he : en;
  return <LangCtx.Provider value={{ lang, t, toggle }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
