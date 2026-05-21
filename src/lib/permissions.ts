export const APP_ROLES = ["EXECUTIVE", "ADMIN", "FIELD_LEADER"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type NavItem = {
  href: string;
  label: string;
  description: string;
};

const routeAccess: Record<AppRole, string[]> = {
  EXECUTIVE: ["/", "/projects", "/teams", "/field-reports", "/finance", "/imports"],
  ADMIN: ["/", "/projects", "/teams", "/field-reports", "/finance", "/imports"],
  FIELD_LEADER: ["/field-reports"],
};

const navItems: NavItem[] = [
  { href: "/", label: "Overview", description: "Command center summary" },
  { href: "/projects", label: "Projects", description: "Project setup and status" },
  { href: "/teams", label: "Teams", description: "Crew and leader management" },
  { href: "/field-reports", label: "Field Reports", description: "Daily execution updates" },
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
