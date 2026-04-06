import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  verifySessionToken,
  SESSION_COOKIE_NAME,
  type Role,
} from "@/lib/auth/session";

const ROLE_PATH_MAP: Record<Role, string> = {
  student: "/student",
  teacher: "/teacher",
  parent: "/parent",
  admin: "/admin",
};

async function handleProtectedRoute(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifySessionToken(token);

  if (!session) {
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    response.headers.set(
      "X-Auth-Error",
      "Session expired or invalid. Please log in again.",
    );
    return response;
  }

  const expectedPrefix = ROLE_PATH_MAP[session.role];
  const pathname = request.nextUrl.pathname;

  if (
    expectedPrefix &&
    (pathname.startsWith("/student") ||
      pathname.startsWith("/teacher") ||
      pathname.startsWith("/parent") ||
      pathname.startsWith("/admin")) &&
    !pathname.startsWith(expectedPrefix) &&
    session.role !== "admin"
  ) {
    return NextResponse.redirect(
      new URL(`${expectedPrefix}/dashboard`, request.url),
    );
  }

  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const protectedPrefixes = [
    "/dashboard",
    "/student",
    "/teacher",
    "/parent",
    "/admin",
    "/ai",
  ];

  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return handleProtectedRoute(request);
  }

  if (
    request.nextUrl.pathname.startsWith("/auth/login") ||
    request.nextUrl.pathname.startsWith("/auth/register")
  ) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const session = await verifySessionToken(token);
      if (session) {
        const redirectPath =
          ROLE_PATH_MAP[session.role]?.concat("/dashboard") ?? "/";
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/student/:path*",
    "/teacher/:path*",
    "/parent/:path*",
    "/admin/:path*",
    "/ai/:path*",
    "/auth/login",
    "/auth/register",
  ],
};

