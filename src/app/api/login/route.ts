import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  USER_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  readSignedValue,
  pwOverrideCookieName,
} from "@/lib/auth/session";
import { findUserByUsername, timingSafeStringEqual } from "@/lib/auth/users";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = (await req.json()) as { username?: unknown; password?: unknown };
  } catch {
    return jsonError("Invalid request body", 400);
  }

  // Length cap stops trivial DoS via huge payload; reject non-strings early.
  const usernameInput = typeof body.username === "string" ? body.username.slice(0, 128) : "";
  const passwordInput = typeof body.password === "string" ? body.password.slice(0, 256) : "";
  const username = usernameInput.trim();
  const password = passwordInput;

  if (!username || !password) {
    return jsonError("Username and password are required", 400);
  }

  const user = findUserByUsername(username);
  if (!user) {
    return jsonError("Invalid username or password", 401);
  }

  // Per-browser password override (if user changed their password earlier).
  const overrideToken = req.cookies.get(pwOverrideCookieName(user.id))?.value;
  const overridePassword = await readSignedValue(overrideToken);
  const expected = overridePassword ?? user.seedPassword;

  if (!timingSafeStringEqual(password, expected)) {
    return jsonError("Invalid username or password", 401);
  }

  const token = await createSessionToken(user.id);

  const res = jsonOk({
    user: { id: user.id, displayName: user.displayName, role: user.role },
  });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  // Companion cookie for client-side userId lookup (NOT a security boundary).
  res.cookies.set({
    name: USER_COOKIE,
    value: user.id,
    httpOnly: false,
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
function jsonOk(body: Record<string, unknown>) {
  const res = NextResponse.json({ ok: true, ...body });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
