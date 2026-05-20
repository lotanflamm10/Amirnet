"use client";

import { useState } from "react";
import { useUser } from "@/contexts/UserContext";

/**
 * Account security panel: shows the current user, gives a Logout button,
 * and exposes a Change Password form that posts to /api/change-password.
 *
 * All UI strings are bilingual (Hebrew + English) since the rest of the app
 * routes labels through translations.ts but this is a small focused panel.
 */
export function AccountSecurityCard() {
  const { user, loading, logout } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword.length < 6) {
      setError("הסיסמה החדשה חייבת להיות לפחות 6 תווים · New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("הסיסמה החדשה והאישור אינם תואמים · Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      if (res.ok) {
        setSuccess("הסיסמה עודכנה · Password updated");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "שגיאה בעדכון הסיסמה · Could not update password");
      }
    } catch {
      setError("שגיאת רשת · Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          color: "var(--ink)",
          margin: "0 0 0.75rem",
          fontSize: "1rem",
        }}
      >
        חשבון · Account
      </h3>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.6rem", marginBottom: "1rem" }}>
        <div style={{ minWidth: 0, flex: "1 1 160px" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            משתמש · Signed in as
          </div>
          <div
            dir="auto"
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--ink)",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            {loading ? "…" : user?.displayName ?? "—"}
          </div>
          {user && (
            <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>
              {user.role === "admin" ? "admin" : "student"}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="btn btn-ghost btn-sm"
          style={{
            minHeight: 40,
            border: "1.5px solid var(--line)",
            color: "var(--ink-soft)",
            background: "transparent",
            cursor: "pointer",
            padding: "0.5rem 1rem",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: "0.85rem",
          }}
        >
          התנתק · Log out
        </button>
      </div>

      <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }} noValidate>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.5 }}>
          שינוי הסיסמה נשמר בדפדפן הזה בלבד (אין שרת אמיתי) · Password change is stored on this browser only (no real backend).
        </p>

        <Field
          id="cp-current"
          label="סיסמה נוכחית · Current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          disabled={submitting}
        />
        <Field
          id="cp-new"
          label="סיסמה חדשה · New password"
          value={newPassword}
          onChange={setNewPassword}
          disabled={submitting}
        />
        <Field
          id="cp-confirm"
          label="אישור סיסמה · Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          disabled={submitting}
        />

        {error && (
          <div
            role="alert"
            aria-live="polite"
            style={{
              padding: "0.55rem 0.75rem",
              background: "color-mix(in srgb, var(--danger) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--danger) 40%, transparent)",
              borderRadius: 8,
              color: "var(--danger)",
              fontSize: "0.82rem",
              lineHeight: 1.45,
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: "0.55rem 0.75rem",
              background: "color-mix(in srgb, var(--success) 14%, transparent)",
              border: "1px solid color-mix(in srgb, var(--success) 40%, transparent)",
              borderRadius: 8,
              color: "var(--success)",
              fontSize: "0.82rem",
              lineHeight: 1.45,
            }}
          >
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !currentPassword || !newPassword || !confirmPassword}
          style={{
            marginTop: "0.25rem",
            minHeight: 44,
            padding: "0.65rem 1rem",
            background: "var(--teal)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: "0.92rem",
            cursor: submitting ? "wait" : "pointer",
            opacity: submitting || !currentPassword || !newPassword || !confirmPassword ? 0.6 : 1,
            transition: "opacity 0.15s ease",
          }}
        >
          {submitting ? "מעדכן… · Updating…" : "שנה סיסמה · Change password"}
        </button>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "0.25rem" }}>
        {label}
      </label>
      <input
        id={id}
        type="password"
        autoComplete={id === "cp-current" ? "current-password" : "new-password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "0.65rem 0.8rem",
          fontSize: "1rem",
          lineHeight: 1.4,
          background: "var(--raised)",
          color: "var(--ink)",
          border: "1.5px solid var(--line)",
          borderRadius: 8,
          outline: "none",
          boxSizing: "border-box",
          minHeight: 44,
          WebkitAppearance: "none",
          appearance: "none",
        }}
      />
    </div>
  );
}
