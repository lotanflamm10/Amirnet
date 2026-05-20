import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
  readSignedValue,
  signValue,
  pwOverrideCookieName,
} from "@/lib/auth/session";
import { findUserById, timingSafeStringEqual } from "@/lib/auth/users";

export const runtime = "nodejs";

/**
 * Change the current user's password.
 *
 * Persistence model (documented for the user in the account page UI):
 *   - There is no database. The new password is stored as an HMAC-signed
 *     HttpOnly cookie named `amirnet-pw-<userId>`, scoped to THIS browser.
 *   - Other devices keep using the seed password until they too change it.
 *   - Clearing cookies reverts to the seed password.
 *   - This route does NOT log credentials.
 */
export async function POST(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return jsonError("Not signed in", 401);

  const user = findUserById(session.userId);
  if (!user) return jsonError("Account not found", 401);

  let body: { currentPassword?: unknown; newPassword?: unknown; confirmPassword?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const currentInput = typeof body.currentPassword === "string" ? body.currentPassword.slice(0, 256) : "";
  const newInput = typeof body.newPassword === "string" ? body.newPassword.slice(0, 256) : "";
  const confirmInput = typeof body.confirmPassword === "string" ? body.confirmPassword.slice(0, 256) : "";

  if (!currentInput || !newInput || !confirmInput) {
    return jsonError("All three password fields are required", 400);
  }
  if (newInput.length < 6) {
    return jsonError("New password must be at least 6 characters", 400);
  }
  if (newInput !== confirmInput) {
    return jsonError("New password and confirmation do not match", 400);
  }

  const overrideToken = req.cookies.get(pwOverrideCookieName(user.id))?.value;
  const overridePassword = await readSignedValue(overrideToken);
  const expectedCurrent = overridePassword ?? user.seedPassword;
  if (!timingSafeStringEqual(currentInput, expectedCurrent)) {
    return jsonError("Current password is incorrect", 401);
  }

  const newToken = await signValue(newInput);
  const res = NextResponse.json({ ok: true });
  res.headers.set("Cache-Control", "no-store");
  res.cookies.set({
    name: pwOverrideCookieName(user.id),
    value: newToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}

function jsonError(error: string, status: number) {
  const res = NextResponse.json({ error }, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
