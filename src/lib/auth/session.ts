/**
 * Edge-compatible signed session cookie helpers.
 *
 * Token format:  base64url(JSON({u: userId, e: expiryUnix})).base64url(HMAC-SHA256 sig)
 *
 * Used by:
 *   - /api/login           → createSessionToken
 *   - /api/logout          → no-op (cookie is cleared)
 *   - /api/me              → verifySessionToken
 *   - /api/change-password → readSignedValue / createSignedValue
 *   - middleware           → verifySessionToken (Edge runtime)
 *
 * Web Crypto API is available in both the Edge runtime and Node runtime in
 * Next.js 16. No Node "Buffer" / "crypto" imports — purely Web-standard APIs.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

export const SESSION_COOKIE = "amirnet-session";
export const USER_COOKIE = "amirnet-user";
export const PW_OVERRIDE_COOKIE_PREFIX = "amirnet-pw-";

/** 30 days. Long enough so reopening the browser doesn't require re-login. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

// ── base64url helpers ───────────────────────────────────────────────────────
function bytesToBase64Url(bytes: Uint8Array): string {
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ── HMAC ───────────────────────────────────────────────────────────────────
function getSecret(): string {
  // AUTH_SECRET should be set in production. Fallback is for local dev only.
  // The fallback is constant per build, so signatures still verify across
  // serverless instances — but a leaked client-side token would be forgeable
  // if AUTH_SECRET is left unset. Set it on Vercel for any non-throwaway use.
  return process.env.AUTH_SECRET ?? "dev-only-amirnet-default-secret-please-set-AUTH_SECRET";
}

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(payload: string): Promise<string> {
  const key = await getHmacKey();
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return bytesToBase64Url(new Uint8Array(sigBuf));
}

async function verify(payload: string, signatureB64Url: string): Promise<boolean> {
  try {
    const key = await getHmacKey();
    const expectedBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
    const expected = new Uint8Array(expectedBuf);
    const got = base64UrlToBytes(signatureB64Url);
    return timingSafeEqualBytes(expected, got);
  } catch {
    return false;
  }
}

// ── Session token ──────────────────────────────────────────────────────────
export interface SessionPayload {
  userId: string;
  expiryUnix: number;
}

export async function createSessionToken(userId: string, maxAgeSeconds = SESSION_MAX_AGE_SECONDS): Promise<string> {
  const payload: { u: string; e: number } = {
    u: userId,
    e: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const payloadB64 = bytesToBase64Url(enc.encode(JSON.stringify(payload)));
  const sig = await sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!(await verify(payloadB64, sig))) return null;
  try {
    const payloadJson = dec.decode(base64UrlToBytes(payloadB64));
    const parsed = JSON.parse(payloadJson) as { u?: unknown; e?: unknown };
    if (typeof parsed.u !== "string" || typeof parsed.e !== "number") return null;
    if (Math.floor(Date.now() / 1000) > parsed.e) return null;
    return { userId: parsed.u, expiryUnix: parsed.e };
  } catch {
    return null;
  }
}

// ── Generic signed value (used for password override) ──────────────────────
/** Sign an arbitrary short payload (e.g. a stored password override). */
export async function signValue(raw: string): Promise<string> {
  const payloadB64 = bytesToBase64Url(enc.encode(raw));
  const sig = await sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function readSignedValue(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!(await verify(payloadB64, sig))) return null;
  try {
    return dec.decode(base64UrlToBytes(payloadB64));
  } catch {
    return null;
  }
}

/** Cookie name for a user's per-browser password override (signed, HttpOnly). */
export function pwOverrideCookieName(userId: string): string {
  return `${PW_OVERRIDE_COOKIE_PREFIX}${userId}`;
}
