import { NextRequest, NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  if (process.env.ADMIN_ENABLED !== "1") {
    return new NextResponse(null, { status: 404 });
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
