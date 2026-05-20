import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_VALUE } from "@/lib/auth/gate";

/**
 * 1. /admin/* stays disabled in production unless ADMIN_ENABLED=1
 *    (preserves original middleware behavior).
 * 2. Everything else requires the shared-credential session cookie;
 *    unauthenticated requests are redirected to /login.
 *
 * Excluded from the auth check (see `config.matcher` below):
 *   - /api/login, /api/logout                  (auth endpoints themselves)
 *   - /_next/static, /_next/image, /favicon.ico, /robots.txt, /sitemap.xml
 *   - any path ending in a common static-asset extension
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Preserve original /admin gate.
  if (pathname.startsWith("/admin")) {
    if (process.env.ADMIN_ENABLED !== "1") {
      return new NextResponse(null, { status: 404 });
    }
    // /admin is reachable only with ADMIN_ENABLED=1 — still require login below.
  }

  const isAuthed = req.cookies.get(SESSION_COOKIE)?.value === SESSION_VALUE;

  // 2. /login: bounce already-authenticated users to /app, otherwise show form.
  if (pathname === "/login") {
    if (isAuthed) {
      const from = req.nextUrl.searchParams.get("from");
      const dest = from && from.startsWith("/") && !from.startsWith("//") && from !== "/login"
        ? from
        : "/app";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // 3. Gate everything else.
  if (!isAuthed) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/login|api/logout|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot|map|txt|xml)).*)",
  ],
};
