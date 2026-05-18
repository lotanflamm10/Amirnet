"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { he, en, type Translations } from "@/lib/i18n/translations";

type Lang = "he" | "en";
const LangCtx = createContext<{ lang: Lang; t: Translations; toggle: () => void }>({
  lang: "he", t: he, toggle: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("he");

  useEffect(() => {
    const saved = localStorage.getItem("amirnet-lang") as Lang | null;
    if (saved) setLang(saved);
  }, []);

  function toggle() {
    setLang((prev) => {
      const next = prev === "he" ? "en" : "he";
      localStorage.setItem("amirnet-lang", next);
      return next;
    });
  }

  const t = lang === "he" ? he : en;
  return <LangCtx.Provider value={{ lang, t, toggle }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
