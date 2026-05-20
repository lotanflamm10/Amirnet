"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function sanitizeRedirect(from: string | null): string {
  if (!from) return "/app";
  if (!from.startsWith("/") || from.startsWith("//")) return "/app";
  if (from.startsWith("/login")) return "/app";
  return from;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const dest = sanitizeRedirect(params.get("from"));

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.replace(dest);
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Login failed. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="ltr"
      style={{
        minHeight: "100dvh",
        background: "var(--canvas)",
        color: "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(1rem, 4vw, 2.5rem)",
        boxSizing: "border-box",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--surface)",
          border: "1.5px solid var(--line)",
          borderRadius: 16,
          padding: "clamp(1.5rem, 5vw, 2.25rem)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--teal)",
              marginBottom: "0.5rem",
            }}
          >
            Amirnet Coach
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "var(--ink)",
            }}
          >
            Sign in to continue
          </h1>
          <p
            style={{
              margin: "0.5rem 0 0",
              fontSize: "0.85rem",
              color: "var(--ink-muted)",
              lineHeight: 1.5,
            }}
          >
            Private testing build. Ask the project owner for credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label
            htmlFor="username"
            style={{
              display: "block",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--ink-soft)",
              marginBottom: "0.35rem",
            }}
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
            autoFocus
            style={inputStyle}
          />

          <label
            htmlFor="password"
            style={{
              display: "block",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--ink-soft)",
              margin: "1rem 0 0.35rem",
            }}
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            style={inputStyle}
          />

          {error && (
            <div
              role="alert"
              aria-live="polite"
              style={{
                marginTop: "1rem",
                padding: "0.65rem 0.85rem",
                background: "color-mix(in srgb, var(--danger) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--danger) 40%, transparent)",
                borderRadius: 10,
                color: "var(--danger)",
                fontSize: "0.85rem",
                lineHeight: 1.45,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              marginTop: "1.5rem",
              width: "100%",
              padding: "0.85rem 1rem",
              background: "var(--teal)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: loading || !username || !password ? "not-allowed" : "pointer",
              opacity: loading || !username || !password ? 0.65 : 1,
              transition: "opacity 0.15s ease, transform 0.05s ease",
              minHeight: 48,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "0.72rem",
            color: "var(--ink-muted)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Temporary friends-testing access. Not for production use.
        </p>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.7rem 0.85rem",
  fontSize: "1rem",
  lineHeight: 1.4,
  background: "var(--raised)",
  color: "var(--ink)",
  border: "1.5px solid var(--line)",
  borderRadius: 10,
  outline: "none",
  boxSizing: "border-box",
  minHeight: 44,
  WebkitAppearance: "none",
  appearance: "none",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100dvh",
            background: "var(--canvas)",
            display: "grid",
            placeItems: "center",
            color: "var(--ink-muted)",
          }}
        >
          Loading…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
