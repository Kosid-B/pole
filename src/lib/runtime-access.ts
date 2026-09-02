import type { AppRole } from "@/lib/permissions";
import type { SiteCostAuthProvider } from "@/lib/supabase-auth";

export const LEGACY_PRISMA_ROUTE_GATES = [
  {
    key: "teams",
    prefix: "/teams",
    moduleLabel: "Teams",
    replacementHref: "/field-readiness",
    replacementLabel: "ไป Field Readiness",
  },
  {
    key: "field-reports",
    prefix: "/field-reports",
    moduleLabel: "Field Reports",
    replacementHref: "/field-readiness",
    replacementLabel: "ไป Field Readiness",
  },
  {
    key: "finance",
    prefix: "/finance",
    moduleLabel: "Finance",
    replacementHref: "/pm/financial",
    replacementLabel: "ไป PM Financial",
  },
  {
    key: "imports",
    prefix: "/imports",
    moduleLabel: "Imports",
    replacementHref: "/projects",
    replacementLabel: "ไป Project Portfolio",
  },
] as const;

export type LegacyPrismaRouteGateKey =
  (typeof LEGACY_PRISMA_ROUTE_GATES)[number]["key"];

export const LEGACY_PRISMA_ROUTE_PREFIXES = LEGACY_PRISMA_ROUTE_GATES.map(
  ({ prefix }) => prefix,
);

function matchesRoutePrefix(route: string, prefix: string) {
  return route === prefix || route.startsWith(`${prefix}/`);
}

export function getLegacyPrismaRouteGate(route: string) {
  return (
    LEGACY_PRISMA_ROUTE_GATES.find(({ prefix }) =>
      matchesRoutePrefix(route, prefix),
    ) ?? null
  );
}

export function getLegacyPrismaRouteGateByKey(
  key: string | null | undefined,
) {
  return LEGACY_PRISMA_ROUTE_GATES.find((gate) => gate.key === key) ?? null;
}

export function isLegacyPrismaRoute(route: string) {
  return getLegacyPrismaRouteGate(route) !== null;
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
