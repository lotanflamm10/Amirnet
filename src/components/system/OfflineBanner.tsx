"use client";

import { useEffect, useState } from "react";

/**
 * Tiny offline indicator. Listens to navigator.onLine via the standard
 * online/offline window events. Renders nothing while online so it
 * doesn't push layout around.
 *
 * Local progress is unaffected by offline — everything lives in localStorage
 * — so this is purely informational so the user isn't surprised when an
 * auth/login request fails on a flaky connection.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [recoveredAt, setRecoveredAt] = useState<number | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined") setOffline(!navigator.onLine);
    const goOffline = () => {
      setOffline(true);
      setRecoveredAt(null);
    };
    const goOnline = () => {
      setOffline(false);
      setRecoveredAt(Date.now());
      // Auto-hide "reconnected" after 3s
      setTimeout(() => setRecoveredAt(null), 3000);
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  // The banner is fixed-position so it doesn't push the document; push
  // <main> via --main-pad-top (AppShell consults it for paddingTop) so
  // page headers aren't covered while the banner is visible.
  useEffect(() => {
    const root = document.documentElement;
    if (offline || recoveredAt) {
      root.style.setProperty(
        "--main-pad-top",
        "calc(max(1.5rem, env(safe-area-inset-top)) + 2.75rem)",
      );
    } else {
      root.style.removeProperty("--main-pad-top");
    }
    return () => {
      root.style.removeProperty("--main-pad-top");
    };
  }, [offline, recoveredAt]);

  if (!offline && !recoveredAt) return null;

  const isOffline = offline;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: "0.5rem 1rem",
        paddingTop: "max(0.5rem, env(safe-area-inset-top))",
        background: isOffline ? "var(--warn, #f5a623)" : "var(--success, #2ec27e)",
        color: "#fff",
        fontSize: "0.85rem",
        fontWeight: 600,
        textAlign: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      {isOffline ? "אין חיבור לאינטרנט • You appear to be offline" : "Back online"}
    </div>
  );
}
