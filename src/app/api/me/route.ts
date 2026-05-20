import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/users";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return jsonResponse({ ok: false, user: null }, 401);
  }
  const user = findUserById(session.userId);
  if (!user) {
    return jsonResponse({ ok: false, user: null }, 401);
  }
  return jsonResponse({
    ok: true,
    user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role },
  }, 200);
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  const res = NextResponse.json(body, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
