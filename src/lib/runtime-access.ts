import type { AppRole } from "@/lib/permissions";
import type { SiteCostAuthProvider } from "@/lib/supabase-auth";

export const LEGACY_PRISMA_ROUTE_PREFIXES = [
  "/teams",
  "/field-reports",
  "/finance",
  "/imports",
] as const;

function matchesRoutePrefix(route: string, prefix: string) {
  return route === prefix || route.startsWith(`${prefix}/`);
}

export function isLegacyPrismaRoute(route: string) {
  return LEGACY_PRISMA_ROUTE_PREFIXES.some((prefix) =>
    matchesRoutePrefix(route, prefix),
  );
}

export function canUseRouteInRuntime(
  provider: SiteCostAuthProvider,
  route: string,
) {
  return provider === "legacy" || !isLegacyPrismaRoute(route);
}

export function getRuntimeDefaultDashboardRoute(
  role: AppRole,
  provider: SiteCostAuthProvider,
) {
  if (provider === "supabase" && role === "FIELD_LEADER") {
    return "/field-readiness";
  }

  return role === "FIELD_LEADER" ? "/field-reports" : "/";
}
