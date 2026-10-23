import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "nexus_session";

const PROTECTED = [
  "/dashboard",
  "/stations",
  "/bookings",
  "/games",
  "/members",
  "/tournaments",
  "/transactions",
  "/settings",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(COOKIE_NAME)?.value);

  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!hasSession) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (hasSession && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/dashboard/:path*",
    "/stations/:path*",
    "/bookings/:path*",
    "/games/:path*",
    "/members/:path*",
    "/tournaments/:path*",
    "/transactions/:path*",
    "/settings/:path*",
  ],
};
