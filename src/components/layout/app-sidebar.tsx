"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { RoleBadge } from "@/components/layout/role-badge";
import type { AppSession } from "@/lib/auth";
import { getNavigationForRole, type NavItem } from "@/lib/permissions";

type AppSidebarProps = {
  session: AppSession;
};

const groupOrder = ["ศูนย์ควบคุม", "จัดซื้อและการเงิน", "ภาคสนาม", "ตั้งค่าระบบ"] as const;
type NavigationGroup = (typeof groupOrder)[number];

function getGroup(item: NavItem): NavigationGroup {
  if (["/", "/commercial", "/pm", "/procurement", "/drying-yard"].includes(item.href)) {
    return "ศูนย์ควบคุม";
  }
  if (item.href.startsWith("/pm/") || item.href === "/finance") {
    return "จัดซื้อและการเงิน";
  }
  if (item.href.startsWith("/field-") || item.href === "/teams") {
    return "ภาคสนาม";
  }
  return "ตั้งค่าระบบ";
}

function NavMarker({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`h-2.5 w-2.5 flex-none rounded-full ${
        active
          ? "bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.85)]"
          : "bg-slate-600"
      }`}
    />
  );
}

export function AppSidebar({ session }: AppSidebarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = getNavigationForRole(session.user.role);
  const currentItem = navItems.find((item) => item.href === pathname);

  return (
    <aside className="w-full rounded-[1.75rem] border border-[var(--panel-border)] bg-[linear-gradient(180deg,rgba(8,15,28,0.97),rgba(10,22,38,0.9))] p-4 text-slate-100 shadow-[0_24px_70px_rgba(2,6,23,0.3)] backdrop-blur lg:sticky lg:top-5 lg:flex lg:h-[calc(100vh-2.5rem)] lg:w-[18rem] lg:flex-none lg:flex-col">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="group min-w-0" onClick={() => setMenuOpen(false)}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/65">
            SiteCost 446
          </p>
          <p className="mt-1 truncate text-lg font-semibold text-white group-hover:text-cyan-100">
            Command Center
          </p>
        </Link>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="dashboard-navigation"
          onClick={() => setMenuOpen((value) => !value)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-lg text-white lg:hidden"
        >
          <span className="sr-only">{menuOpen ? "ปิดเมนู" : "เปิดเมนู"}</span>
          <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">สิทธิ์ใช้งาน</p>
          <div className="mt-1.5"><RoleBadge role={session.user.role} /></div>
        </div>
        {currentItem ? (
          <p className="max-w-28 text-right text-xs leading-5 text-slate-400">
            {currentItem.label}
          </p>
        ) : null}
      </div>

      <nav
        id="dashboard-navigation"
        className={`${menuOpen ? "block" : "hidden"} mt-4 space-y-5 overflow-y-auto pr-1 lg:block lg:flex-1`}
        aria-label="Dashboard navigation"
      >
        {groupOrder.map((group) => {
          const groupItems = navItems.filter((item) => getGroup(item) === group);
          if (groupItems.length === 0) return null;

          return (
            <section key={group} aria-labelledby={`nav-${group}`}>
              <h2
                id={`nav-${group}`}
                className="px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500"
              >
                {group}
              </h2>
              <div className="mt-2 space-y-1">
                {groupItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                      className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                        active
                          ? "border-cyan-300/25 bg-cyan-300/10 text-white"
                          : "border-transparent text-slate-300 hover:border-white/8 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <NavMarker active={active} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{item.label}</span>
                        {active ? (
                          <span className="mt-0.5 block truncate text-[11px] text-cyan-100/60">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>

      <div className="mt-4 hidden rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.07] px-3 py-3 lg:block">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Financial Guardrail
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-400">GM ≥ 32% · Cash ≥ Safety Reserve</p>
      </div>
    </aside>
  );
}
