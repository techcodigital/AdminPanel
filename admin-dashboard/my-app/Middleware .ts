import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — allow
  if (pathname.startsWith("/login") || pathname === "/") {
    return NextResponse.next();
  }

  // Admin routes — check token cookie
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};