"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * App-router error boundary. Catches uncaught errors in a route segment
 * and shows a friendly fallback instead of a blank page.
 *
 * Stack traces are NOT shown to end users. The full error is sent to
 * console in dev so a developer can still see it via DevTools.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[Amirnet] route error:", error);
    }
  }, [error]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--canvas)",
        color: "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(1rem, 4vw, 2rem)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 460,
          width: "100%",
          background: "var(--surface)",
          border: "1.5px solid var(--line)",
          borderRadius: 16,
          padding: "clamp(1.5rem, 5vw, 2rem)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "0.7rem",
            letterSpacing: "0.18em",
            fontWeight: 700,
            color: "var(--danger)",
            marginBottom: "0.5rem",
          }}
        >
          UNEXPECTED ERROR
        </div>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)" }}>
          משהו השתבש · Something went wrong
        </h1>
        <p style={{ margin: "0 0 1.25rem", fontSize: "0.9rem", color: "var(--ink-soft)", lineHeight: 1.55 }}>
          ההתקדמות שלך נשמרה בכל מקרה. נסה לטעון מחדש או לחזור לדף הראשי.
          <br />
          Your progress is safe. Try reloading or returning to the dashboard.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button
            onClick={() => reset()}
            style={{
              minHeight: 44,
              padding: "0.7rem 1.1rem",
              background: "var(--teal)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            טען מחדש · Reload
          </button>
          <Link
            href="/app"
            style={{
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.7rem 1.1rem",
              background: "transparent",
              color: "var(--ink-soft)",
              border: "1.5px solid var(--line)",
              borderRadius: 10,
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            חזור ללוח הבקרה · Back to dashboard
          </Link>
        </div>
        {error.digest && (
          <p style={{ marginTop: "1rem", fontSize: "0.65rem", color: "var(--ink-muted)" }}>
            ref: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
