import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, USER_COOKIE, verifySessionToken, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/users";

/**
 * 1. /admin/* stays disabled in production unless ADMIN_ENABLED=1
 *    (preserves original middleware behavior). When enabled, it ALSO
 *    requires the session's user to have role === "admin"; non-admins
 *    get a 404 (not a redirect) so the route appears to not exist.
 * 2. Everything else requires a valid signed session cookie;
 *    unauthenticated requests are redirected to /login.
 * 3. If the signed session is valid but the companion `amirnet-user`
 *    cookie is missing or mismatched, we refresh it so client code can
 *    read the active userId synchronously via document.cookie.
 *
 * Excluded from the auth check (see `config.matcher` below):
 *   - /api/login, /api/logout, /api/me, /api/change-password
 *   - /_next/static, /_next/image, /favicon.ico, /robots.txt, /sitemap.xml
 *   - /manifest.webmanifest, /icon*.png, /icon*.svg, /apple-touch-icon*
 *   - any path ending in a common static-asset extension
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(sessionToken);
  const isAuthed = session !== null;

  // 1. /admin gate: hidden unless ADMIN_ENABLED=1, AND only available to
  //    users whose seed record carries role === "admin". A non-admin (or
  //    unauthenticated visitor) sees a 404, matching the disabled-route
  //    response — we don't redirect to /login because we want to avoid
  //    leaking that /admin exists at all.
  if (pathname.startsWith("/admin")) {
    if (process.env.ADMIN_ENABLED !== "1") {
      return new NextResponse(null, { status: 404 });
    }
    if (!session) {
      return new NextResponse(null, { status: 404 });
    }
    const user = findUserById(session.userId);
    if (user?.role !== "admin") {
      return new NextResponse(null, { status: 404 });
    }
    // Admin user, ADMIN_ENABLED=1 — fall through to companion-cookie refresh.
  }

  // 2. /login: bounce already-authenticated users to /app, otherwise show form.
  if (pathname === "/login") {
    if (isAuthed) {
      const from = req.nextUrl.searchParams.get("from");
      const dest =
        from && from.startsWith("/") && !from.startsWith("//") && from !== "/login"
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

  // 4. Refresh the companion (non-HttpOnly) `amirnet-user` cookie if missing
  //    or stale, so client-side storage can scope by userId synchronously.
  const userCookie = req.cookies.get(USER_COOKIE)?.value;
  if (session && userCookie !== session.userId) {
    const res = NextResponse.next();
    res.cookies.set({
      name: USER_COOKIE,
      value: session.userId,
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/login|api/logout|api/me|api/change-password|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot|map|txt|xml|webmanifest)).*)",
  ],
};
