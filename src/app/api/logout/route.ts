import { NextResponse } from "next/server";
import { SESSION_COOKIE, USER_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Cache-Control", "no-store");
  const clear = (name: string, httpOnly: boolean) =>
    res.cookies.set({
      name,
      value: "",
      httpOnly,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  clear(SESSION_COOKIE, true);
  clear(USER_COOKIE, false);
  return res;
}
