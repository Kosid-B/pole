import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  canAccessRoute,
  getDefaultDashboardRoute,
  normalizeRole,
  type AppRole,
} from "@/lib/permissions";

const ROLE_COOKIE_NAME = "pm-role";

function isProtectedPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/teams") ||
    pathname.startsWith("/field-reports") ||
    pathname.startsWith("/finance") ||
    pathname.startsWith("/imports")
  );
}

function getRole(request: NextRequest): AppRole | null {
  const role = request.cookies.get(ROLE_COOKIE_NAME)?.value;

  return normalizeRole(role ?? undefined);
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const role = getRole(request);

  if (pathname === "/sign-in") {
    if (!role) {
      return NextResponse.next();
    }

    return NextResponse.redirect(
      new URL(getDefaultDashboardRoute(role), request.url),
    );
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (!role) {
    const signInUrl = new URL("/sign-in", request.url);

    signInUrl.searchParams.set("redirectTo", `${pathname}${search}`);

    return NextResponse.redirect(signInUrl);
  }

  if (!canAccessRoute(role, pathname)) {
    return NextResponse.redirect(
      new URL(getDefaultDashboardRoute(role), request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/sign-in", "/projects/:path*", "/teams/:path*", "/field-reports/:path*", "/finance/:path*", "/imports/:path*"],
};
