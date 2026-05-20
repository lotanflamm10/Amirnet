/**
 * Per-user namespaced localStorage helpers.
 *
 * Keys are stored under: `amirnet:user:<userId>:<legacyKey>`
 *
 * Legacy code reads/writes via `userKey("amirnet-foo")`. When the user
 * cookie is present (always true on authenticated pages), the result is
 * the namespaced key. When no user cookie is present (e.g. /login,
 * SSR/initial render before any user logs in), the legacy key is
 * returned as a fallback — so login itself never fails.
 *
 * One-time migration copies the original singleton keys onto the `admin`
 * user namespace, so admin's existing progress survives the upgrade.
 * Other users (גילי) start fresh by design.
 */

const NS_PREFIX = "amirnet:user:";

/** All localStorage keys that should be per-user. Theme/lang stay global. */
export const LEGACY_USER_KEYS: readonly string[] = [
  "amirnet-progress-v1",
  "amirnet-vocab-v1",
  "amirnet-unknown-words-v1",
  "amirnet-custom-vocab-raw",
  "amirnet-custom-vocab-cards-v1",
  "amirnet-session-current",
  "amirnet-sim-current",
  "amirnet-qhistory-v1",
  "amirnet-learning-completed",
  "amirnet-learning-bookmarked",
  "amirnet-learning-last-idx",
  "amirnet-credits-v1",
  "amirnet-entitlement-v1",
  "amirnet-reading-passages-v1",
];

/** Read the active user id from the companion (non-HttpOnly) cookie. */
export function getCurrentUserId(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)amirnet-user=([^;]+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]) || null;
  } catch {
    return null;
  }
}

/**
 * Returns the namespaced storage key for the active user. Falls back to the
 * unnamespaced legacy key when no user is logged in — that path only triggers
 * on /login and during initial render, where stores aren't really used.
 */
export function userKey(legacyKey: string): string {
  const uid = getCurrentUserId();
  return uid ? `${NS_PREFIX}${uid}:${legacyKey}` : legacyKey;
}

/** Per-user namespaced key, given an explicit userId. */
export function userKeyFor(userId: string, legacyKey: string): string {
  return `${NS_PREFIX}${userId}:${legacyKey}`;
}

const MIGRATION_FLAG = `${NS_PREFIX}admin:_migrated_legacy_v1`;

/**
 * Idempotent migration: if the logged-in user is `admin` and we haven't run
 * the migration before, copy every LEGACY_USER_KEYS entry from its original
 * unnamespaced location into the admin namespace. Legacy values are left in
 * place as a safety net — `userKey()` only reads the namespaced location once
 * the user is known.
 */
export function migrateLegacyToUserOnce(userId: string): { migrated: number } {
  if (typeof window === "undefined") return { migrated: 0 };
  if (userId !== "admin") return { migrated: 0 };
  try {
    if (localStorage.getItem(MIGRATION_FLAG)) return { migrated: 0 };
  } catch {
    return { migrated: 0 };
  }

  let migrated = 0;
  for (const legacyKey of LEGACY_USER_KEYS) {
    const target = userKeyFor(userId, legacyKey);
    try {
      if (localStorage.getItem(target) !== null) continue;
      const value = localStorage.getItem(legacyKey);
      if (value === null) continue;
      // Validate JSON for json-shaped values — if corrupted, skip silently.
      if (value.startsWith("{") || value.startsWith("[")) {
        try { JSON.parse(value); } catch { continue; }
      }
      localStorage.setItem(target, value);
      migrated++;
    } catch {
      // quota / DOM exception — skip
    }
  }

  try { localStorage.setItem(MIGRATION_FLAG, new Date().toISOString()); } catch { /* quota */ }
  return { migrated };
}

/**
 * Safe getItem: returns null on any DOMException (corrupted storage, quota,
 * disabled cookies on iOS Safari private mode, etc.).
 */
export function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Safe setItem: silently no-ops on quota / DOM errors. */
export function safeSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // quota / SecurityError — drop
  }
}

export function safeRemoveItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Clear all per-user keys for a given user. Used when the user explicitly
 * resets progress; NOT called on logout (logout preserves data).
 */
export function clearUserNamespace(userId: string): void {
  if (typeof window === "undefined") return;
  const prefix = `${NS_PREFIX}${userId}:`;
  const toDelete: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) toDelete.push(k);
    }
    for (const k of toDelete) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}
