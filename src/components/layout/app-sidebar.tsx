"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoleBadge } from "@/components/layout/role-badge";
import type { AppSession } from "@/lib/auth";
import {
  getNavigationForRole,
  type NavItem,
  type NavSection,
} from "@/lib/permissions";

type AppSidebarProps = {
  session: AppSession;
};

const sectionMeta: Array<{
  id: NavSection;
  label: string;
  hint: string;
}> = [
  { id: "CORE", label: "งานหลัก", hint: "ภาพรวม → ราคา → PM → จัดซื้อ" },
  { id: "PM_CONTROL", label: "PM Workflow Controls", hint: "อนุมัติและควบคุม commitment" },
  { id: "FIELD", label: "หน้างาน", hint: "ทีม • readiness • delivery" },
  { id: "FINANCE_DATA", label: "การเงินและข้อมูล", hint: "ต้นทุน • billing • import" },
];

function isItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationLink({ item, pathname, compact = false }: {
  item: NavItem;
  pathname: string;
  compact?: boolean;
}) {
  const active = isItemActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`group flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
        active
          ? "border-cyan-300/40 bg-cyan-300/12 text-white shadow-[0_0_0_1px_rgba(103,232,249,0.10)]"
          : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{item.label}</span>
        {!compact && active ? (
          <span className="mt-1 block text-xs leading-5 text-cyan-100/75">
            {item.description}
          </span>
        ) : null}
      </span>
      <span
        className={`h-2 w-2 flex-none rounded-full ${active ? "bg-cyan-300" : "bg-slate-700 group-hover:bg-slate-500"}`}
        aria-hidden="true"
      />
    </Link>
  );
}

export function AppSidebar({ session }: AppSidebarProps) {
  const pathname = usePathname();
  const navItems = getNavigationForRole(session.user.role);

  const groups = sectionMeta
    .map((section) => ({
      ...section,
      items: navItems.filter((item) => item.section === section.id),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="w-full rounded-[2rem] border border-[var(--panel-border)] bg-[linear-gradient(180deg,rgba(8,15,28,0.97),rgba(10,22,38,0.91))] p-4 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur lg:sticky lg:top-6 lg:flex lg:h-[calc(100vh-3rem)] lg:w-80 lg:flex-none lg:flex-col lg:p-5">
      <div className="flex items-start justify-between gap-4 lg:block">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
            SiteCost
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
            Project Command Center
          </h2>
          <p className="mt-1 hidden text-xs leading-5 text-slate-400 lg:block">
            เลือกงานตามลำดับการตัดสินใจ ไม่ต้องไล่เมนูทั้งหมด
          </p>
        </div>
        <div className="flex-none lg:mt-4">
          <RoleBadge role={session.user.role} />
        </div>
      </div>

      <nav className="mt-4 space-y-2 lg:hidden" aria-label="Dashboard navigation">
        {groups.map((group) => {
          const containsActive = group.items.some((item) => isItemActive(pathname, item.href));
          return (
            <details
              key={group.id}
              open={group.id === "CORE" || containsActive}
              className="rounded-2xl border border-white/8 bg-white/[0.035]"
            >
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-white marker:hidden">
                <span>{group.label}</span>
                <span className="text-xs font-normal text-slate-400">{group.items.length} เมนู</span>
              </summary>
              <div className="space-y-1 border-t border-white/6 p-2">
                {group.items.map((item) => (
                  <NavigationLink key={item.href} item={item} pathname={pathname} compact />
                ))}
              </div>
            </details>
          );
        })}
      </nav>

      <nav
        className="mt-5 hidden space-y-5 overflow-y-auto pr-1 lg:block lg:flex-1"
        aria-label="Dashboard navigation"
      >
        {groups.map((group) => (
          <section key={group.id} aria-labelledby={`nav-${group.id}`}>
            <div className="mb-2 px-2">
              <p id={`nav-${group.id}`} className="text-xs font-semibold text-slate-200">
                {group.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-5 text-slate-500">{group.hint}</p>
            </div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavigationLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </section>
        ))}
      </nav>

      <div className="mt-4 hidden rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] px-4 py-3 lg:block">
        <p className="text-xs font-medium text-emerald-100">Financial hard gate</p>
        <p className="mt-1 text-xs leading-5 text-emerald-50/70">
          GM ≥ 32% และ Rolling Cash ต้องไม่ต่ำกว่า Safety Reserve
        </p>
      </div>
    </aside>
  );
}
