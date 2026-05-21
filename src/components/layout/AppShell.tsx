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
      <div className="content-area flex-1 flex flex-col min-w-0" style={{ maxWidth: "100%" }}>
        <main
          className="flex-1 w-full px-4"
          dir={dir}
          style={{
            // Respect iPhone notch / dynamic island and home indicator.
            paddingInlineStart: "max(1rem, env(safe-area-inset-left))",
            paddingInlineEnd:   "max(1rem, env(safe-area-inset-right))",
            // Top padding lifts content below the iPhone status bar / dynamic
            // island when the app runs as a PWA (display: standalone). On
            // regular browser tabs env(safe-area-inset-top) is 0 so we fall
            // back to the previous 1.5rem.
            paddingTop:    "max(1.5rem, env(safe-area-inset-top))",
            // Driven by --content-bottom-pad which collapses to 2rem on
            // desktop (no bottom tab bar) and expands on mobile to clear
            // the bar + sticky next-action-bar + iPhone home indicator.
            paddingBottom: "var(--content-bottom-pad)",
            minWidth: 0,
            maxWidth: "100%",
            overflowWrap: "anywhere",
          }}
        >
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
