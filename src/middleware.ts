import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  canAccessRoute,
  normalizeRole,
  type AppRole,
} from "@/lib/permissions";
import {
  getLegacyPrismaRouteGate,
  getRuntimeDefaultDashboardRoute,
} from "@/lib/runtime-access";
import type { SiteCostAuthProvider } from "@/lib/supabase-auth";

const USER_ID_COOKIE_NAME = "pm-user-id";
const ROLE_COOKIE_NAME = "pm-role";
const AUTH_PROVIDER_COOKIE_NAME = "pm-auth-provider";

function isProtectedPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/teams") ||
    pathname.startsWith("/field-reports") ||
    pathname.startsWith("/finance") ||
    pathname.startsWith("/imports") ||
    pathname.startsWith("/drying-yard") ||
    pathname.startsWith("/commercial") ||
    pathname.startsWith("/pm") ||
    pathname.startsWith("/procurement")
  );
}

function getRole(request: NextRequest): AppRole | null {
  const userId = request.cookies.get(USER_ID_COOKIE_NAME)?.value;
  const role = request.cookies.get(ROLE_COOKIE_NAME)?.value;

  if (!userId) return null;
  return normalizeRole(role ?? undefined);
}

function getProvider(request: NextRequest): SiteCostAuthProvider {
  return request.cookies.get(AUTH_PROVIDER_COOKIE_NAME)?.value === "supabase"
    ? "supabase"
    : "legacy";
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const role = getRole(request);
  const provider = getProvider(request);

  if (pathname === "/sign-in") {
    if (!role) {
      return NextResponse.next();
    }

    return NextResponse.redirect(
      new URL(getRuntimeDefaultDashboardRoute(role, provider), request.url),
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
      new URL(getRuntimeDefaultDashboardRoute(role, provider), request.url),
    );
  }

  if (provider === "supabase") {
    const gate = getLegacyPrismaRouteGate(pathname);

    if (gate) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = "/runtime-migration-gate";
      rewriteUrl.search = "";
      rewriteUrl.searchParams.set("gate", gate.key);

      return NextResponse.rewrite(rewriteUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/sign-in",
    "/projects/:path*",
    "/teams/:path*",
    "/field-reports/:path*",
    "/finance/:path*",
    "/imports/:path*",
    "/drying-yard/:path*",
    "/commercial/:path*",
    "/pm/:path*",
    "/procurement/:path*",
  ],
};
