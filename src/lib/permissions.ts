export const APP_ROLES = ["EXECUTIVE", "ADMIN", "FIELD_LEADER"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type NavItem = {
  href: string;
  label: string;
  description: string;
};

const routeAccess: Record<AppRole, string[]> = {
  EXECUTIVE: [
    "/",
    "/projects",
    "/teams",
    "/field-reports",
    "/field-readiness",
    "/finance",
    "/imports",
    "/drying-yard",
    "/commercial",
    "/pm",
    "/procurement",
  ],
  ADMIN: [
    "/",
    "/projects",
    "/teams",
    "/field-reports",
    "/field-readiness",
    "/finance",
    "/imports",
    "/drying-yard",
    "/commercial",
    "/pm",
    "/procurement",
  ],
  FIELD_LEADER: ["/field-reports", "/field-readiness", "/drying-yard"],
};

const navItems: NavItem[] = [
  { href: "/", label: "Overview", description: "Command center summary" },
  { href: "/projects", label: "Projects", description: "Project setup and status" },
  { href: "/drying-yard", label: "งานลานตาก", description: "446 จุด • G63/G64 • BOQ • การจอง" },
  {
    href: "/commercial",
    label: "Commercial / Pricing",
    description: "ราคา • Tier • G63/G64 • จังหวัด • Quote",
  },
  {
    href: "/pm",
    label: "PM Control",
    description: "BAC • Cash Flow • Supplier/PO • Advance",
  },
  {
    href: "/pm/financial",
    label: "PM Financial",
    description: "GM ≥32% • Cash Guardrail • Advance Trigger",
  },
  {
    href: "/pm/suppliers/award-approval",
    label: "Award Approval",
    description: "Manual Primary/Backup • Framework • Audit trail",
  },
  {
    href: "/pm/batches",
    label: "Batch Release",
    description: "Site readiness • 14-day forecast • Manual release",
  },
  {
    href: "/procurement",
    label: "Procurement",
    description: "Cluster • RFQ A/B/C • Framework • Customer funding",
  },
  { href: "/teams", label: "Teams", description: "Crew and leader management" },
  { href: "/field-reports", label: "Field Reports", description: "Daily execution updates" },
  { href: "/field-readiness", label: "Field Readiness", description: "Site evidence • PM verification • Batch gate" },
  { href: "/finance", label: "Finance", description: "Costs, billing, and collections" },
  { href: "/imports", label: "Imports", description: "Spreadsheet and PDF review" },
];

function matchesRoutePrefix(route: string, prefix: string) {
  if (prefix === "/") {
    return route === "/";
  }

  return route === prefix || route.startsWith(`${prefix}/`);
}

export function isAppRole(value: string): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}

export function normalizeRole(value: string | undefined) {
  if (!value) {
    return null;
  }

  return isAppRole(value) ? value : null;
}

export function canAccessRoute(role: AppRole, route: string) {
  return routeAccess[role].some((prefix) => matchesRoutePrefix(route, prefix));
}

export function getDefaultDashboardRoute(role: AppRole) {
  return role === "FIELD_LEADER" ? "/field-reports" : "/";
}

export function getNavigationForRole(role: AppRole) {
  return navItems.filter((item) => canAccessRoute(role, item.href));
}
