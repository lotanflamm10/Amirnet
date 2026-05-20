"use client";
import { usePathname } from "next/navigation";
import { useLang } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Sidebar } from "./Sidebar";
import { BottomTabBar } from "./BottomTabBar";
import { AppFooter } from "./AppFooter";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t, lang, toggle: toggleLang } = useLang();
  const { settings, toggle: toggleTheme } = useTheme();
  const pathname = usePathname();

  // Bare layout for the auth gate — no sidebar / bottom-tabs / footer.
  if (pathname?.startsWith("/login")) {
    return <>{children}</>;
  }

  // dir follows the active language; main content always mirrors current lang
  const dir = lang === "he" ? "rtl" : "ltr";

  return (
    <div className="flex min-h-dvh" style={{ background: "var(--canvas)" }}>
      {/* Desktop sidebar */}
      <Sidebar t={t} lang={lang} toggleLang={toggleLang} theme={settings.mode} toggleTheme={toggleTheme} />

      {/* Main content — offset matches sidebar width */}
      <div className="content-area flex-1 flex flex-col min-w-0">
        <main className="flex-1 w-full px-4 py-6 pb-24 lg:pb-8" dir={dir}>
          {children}
        </main>
        <div className="hidden lg:block" dir={dir}>
          <AppFooter />
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <BottomTabBar t={t} />
    </div>
  );
}
