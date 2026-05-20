/**
 * TEMPORARY user registry for the friends-testing build.
 *
 * NOT production auth. This file lives in src/lib/auth/ and is only imported
 * by SERVER-ONLY route handlers (/api/login, /api/change-password), so the
 * password constants below do NOT ship to the client bundle. Still, in real
 * deployments the seed passwords should come from env vars.
 *
 * Password change persistence: changes are stored in a per-user
 * HttpOnly + signed override cookie. That means changes are scoped to
 * THIS BROWSER on THIS DEVICE. Other devices keep the seed password until
 * they too get an override cookie. Clearing cookies reverts to the seed.
 */

export type UserId = "admin" | "gili";
export type UserRole = "admin" | "student";

export interface UserRecord {
  id: UserId;
  /** Username typed at login. Stored case-insensitively (lowercased) where ASCII. */
  username: string;
  /** Display name shown in UI. */
  displayName: string;
  role: UserRole;
  /** Plaintext seed password. Override via env var per user. */
  seedPassword: string;
}

export const USERS: UserRecord[] = [
  {
    id: "admin",
    username: "admin",
    displayName: "admin",
    role: "admin",
    seedPassword: process.env.ADMIN_SEED_PASSWORD ?? "tsnhi5326",
  },
  {
    id: "gili",
    username: "גילי",
    displayName: "גילי",
    role: "student",
    seedPassword: process.env.GILI_SEED_PASSWORD ?? "גילי7369!",
  },
];

/** Lookup helper. Case-insensitive for ASCII; Hebrew is matched literally. */
export function findUserByUsername(input: string): UserRecord | undefined {
  const needle = input.trim();
  const lower = needle.toLowerCase();
  return USERS.find((u) => u.username === needle || u.username.toLowerCase() === lower);
}

export function findUserById(id: string): UserRecord | undefined {
  return USERS.find((u) => u.id === id);
}

/** Constant-time string compare to avoid timing oracle on password length. */
export function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
