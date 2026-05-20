"use client";

/**
 * Last-resort error boundary that catches errors thrown from root layout
 * itself (where providers/context can't render). Must include its own
 * <html>/<body>. Kept very minimal so it always renders.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="he" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#0b1115",
          color: "#e8edf2",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            משהו השתבש · Something went wrong
          </h1>
          <p style={{ fontSize: "0.9rem", opacity: 0.8, lineHeight: 1.5, marginBottom: "1.25rem" }}>
            ההתקדמות שלך נשמרה. נסה לטעון מחדש את הדף.
            <br />
            Your progress is safe. Please reload the page.
          </p>
          <button
            onClick={() => reset()}
            style={{
              minHeight: 44,
              padding: "0.7rem 1.5rem",
              background: "#0DCBB1",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
