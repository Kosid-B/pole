export const APP_ROLES = ["EXECUTIVE", "ADMIN", "FIELD_LEADER"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const NAV_SECTIONS = ["CORE", "PM_CONTROL", "FIELD", "FINANCE_DATA"] as const;
export type NavSection = (typeof NAV_SECTIONS)[number];

export type NavItem = {
  href: string;
  label: string;
  description: string;
  section: NavSection;
};

const routeAccess: Record<AppRole, string[]> = {
  EXECUTIVE: [
    "/",
    "/projects",
    "/teams",
    "/field-reports",
    "/field-readiness",
    "/field-deliveries",
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
    "/field-deliveries",
    "/finance",
    "/imports",
    "/drying-yard",
    "/commercial",
    "/pm",
    "/procurement",
  ],
  FIELD_LEADER: [
    "/field-reports",
    "/field-readiness",
    "/field-deliveries",
    "/drying-yard",
  ],
};

const navItems: NavItem[] = [
  { href: "/", label: "ภาพรวม", description: "สถานะโครงการและสิ่งที่ต้องตัดสินใจ", section: "CORE" },
  { href: "/projects", label: "โครงการ", description: "พอร์ตโครงการ สถานะ และการตั้งค่า", section: "CORE" },
  { href: "/drying-yard", label: "งานลานตาก", description: "446 จุด • G63/G64 • BOQ • การจอง", section: "CORE" },
  {
    href: "/commercial",
    label: "Commercial / Pricing",
    description: "ราคา • Tier • G63/G64 • จังหวัด • Quote",
    section: "CORE",
  },
  {
    href: "/pm",
    label: "PM Control",
    description: "BAC • Cash Flow • Supplier/PO • Advance",
    section: "CORE",
  },
  {
    href: "/procurement",
    label: "Procurement",
    description: "Cluster • RFQ • Framework • Customer funding",
    section: "CORE",
  },
  {
    href: "/pm/financial",
    label: "PM Financial",
    description: "GM ≥32% • Cash Guardrail • Advance Trigger",
    section: "PM_CONTROL",
  },
  {
    href: "/pm/suppliers/award-approval",
    label: "Award Approval",
    description: "Primary/Backup • Framework • Audit trail",
    section: "PM_CONTROL",
  },
  {
    href: "/pm/batches",
    label: "Batch Release",
    description: "Readiness • 14-day forecast • Manual release",
    section: "PM_CONTROL",
  },
  {
    href: "/pm/calloffs",
    label: "Supplier Call-off",
    description: "Released Batch • Supplier • DO • Actual quantity",
    section: "PM_CONTROL",
  },
  {
    href: "/pm/invoices",
    label: "Supplier Invoice",
    description: "3-Way Match • Verified Actual • Eligibility",
    section: "PM_CONTROL",
  },
  {
    href: "/pm/payment-requests",
    label: "Payment Request",
    description: "Cash Reservation • Manual approval • No Auto Pay",
    section: "PM_CONTROL",
  },
  { href: "/teams", label: "ทีมงาน", description: "Crew และหัวหน้าทีม", section: "FIELD" },
  { href: "/field-reports", label: "Field Reports", description: "รายงานความก้าวหน้าหน้างาน", section: "FIELD" },
  { href: "/field-readiness", label: "Field Readiness", description: "หลักฐานหน้างาน • PM verification • Batch gate", section: "FIELD" },
  { href: "/field-deliveries", label: "Field Delivery", description: "DO • QA evidence • PM verified actual", section: "FIELD" },
  { href: "/finance", label: "Finance", description: "ต้นทุน • Billing • Collection", section: "FINANCE_DATA" },
  { href: "/imports", label: "Imports", description: "ตรวจและนำเข้า Spreadsheet / PDF", section: "FINANCE_DATA" },
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
