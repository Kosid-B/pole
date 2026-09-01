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
  { href: "/", label: "ภาพรวม / Overview", description: "สรุปสถานะและงานที่ต้องตัดสินใจ" },
  { href: "/projects", label: "โครงการ / Projects", description: "ตั้งค่าและติดตามสถานะโครงการ" },
  { href: "/drying-yard", label: "งานลานตาก", description: "446 จุด • G63/G64 • BOQ • การจอง" },
  {
    href: "/commercial",
    label: "ราคา / Commercial / Pricing",
    description: "ราคาขาย • Tier • จังหวัด • Quote",
  },
  {
    href: "/pm",
    label: "ควบคุมโครงการ / PM Control",
    description: "BAC • Cash Flow • Batch • Advance",
  },
  {
    href: "/pm/financial",
    label: "การเงิน PM / PM Financial",
    description: "GM ≥32% • Cash Guardrail • Trigger",
  },
  {
    href: "/pm/suppliers/award-approval",
    label: "อนุมัติจัดซื้อ / Award Approval",
    description: "Primary/Backup • Framework • Audit",
  },
  {
    href: "/pm/batches",
    label: "ปล่อยชุดงาน / Batch Release",
    description: "Readiness • Forecast • Manual release",
  },
  {
    href: "/pm/calloffs",
    label: "เรียกส่งของ / Supplier Call-off",
    description: "Released Batch • Supplier • DO • Actual",
  },
  {
    href: "/pm/invoices",
    label: "ใบแจ้งหนี้ / Supplier Invoice",
    description: "3-Way Match • Verified Actual • Eligibility",
  },
  {
    href: "/pm/payment-requests",
    label: "ขอจ่าย / Payment Request",
    description: "Eligible Invoice • Cash Reservation • No Auto Pay",
  },
  {
    href: "/procurement",
    label: "จัดซื้อ / Procurement",
    description: "Cluster • RFQ • TDC • Framework",
  },
  { href: "/teams", label: "ทีมงาน / Teams", description: "ทีมติดตั้งและหัวหน้าทีม" },
  { href: "/field-reports", label: "รายงานสนาม / Field Reports", description: "ความก้าวหน้าและปัญหารายวัน" },
  { href: "/field-readiness", label: "ความพร้อม / Field Readiness", description: "หลักฐาน • PM Verify • Batch Gate" },
  { href: "/field-deliveries", label: "รับของ / Field Delivery", description: "DO • QA • PM Verified Actual" },
  { href: "/finance", label: "บัญชีโครงการ / Finance", description: "ต้นทุน • วางบิล • รับชำระ" },
  { href: "/imports", label: "นำเข้าข้อมูล / Imports", description: "ตรวจ Excel และ PDF ก่อนบันทึก" },
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
