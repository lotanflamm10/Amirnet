"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Sidebar } from "./Sidebar";
import { BottomTabBar } from "./BottomTabBar";
import { AppFooter } from "./AppFooter";

/**
 * Mobile-only Privacy · Terms link row. Desktop already has AppFooter at
 * the bottom of every page; on mobile the footer is hidden in favour of
 * the bottom tab bar, so dashboards and the account page would otherwise
 * have no path to the legal pages.
 */
function MobileLegalLinks({ isHe }: { isHe: boolean }) {
  const linkStyle = {
    color: "inherit",
    textDecoration: "none",
    padding: "0.4rem 0.6rem",
    minHeight: 32,
    display: "inline-flex",
    alignItems: "center",
  } as const;
  return (
    <div
      className="lg:hidden"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.5rem",
        marginTop: "2rem",
        fontSize: "0.74rem",
        color: "var(--ink-muted)",
      }}
    >
      <Link href="/legal/privacy" style={linkStyle}>{isHe ? "פרטיות" : "Privacy"}</Link>
      <span aria-hidden="true">·</span>
      <Link href="/legal/terms" style={linkStyle}>{isHe ? "תנאים" : "Terms"}</Link>
    </div>
  );
}

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

  // Mobile-only legal-link row appears on the dashboard and the account
  // page only. Timed flows (simulation, challenge, practice runs) and
  // content-heavy routes (vocab, reading, learning-engine) keep a clean
  // bottom so the existing UX isn't pushed around.
  const showMobileLegal = pathname === "/app" || pathname?.startsWith("/account");

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
            // back to the previous 1.5rem. OfflineBanner inflates this via
            // --main-pad-top so the fixed banner doesn't overlap the page
            // header when it shows.
            paddingTop:    "var(--main-pad-top, max(1.5rem, env(safe-area-inset-top)))",
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
          {showMobileLegal && <MobileLegalLinks isHe={lang === "he"} />}
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
