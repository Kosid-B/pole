"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoleBadge } from "@/components/layout/role-badge";
import type { AppSession } from "@/lib/auth";
import { getNavigationForRole } from "@/lib/permissions";

type AppSidebarProps = {
  session: AppSession;
};

export function AppSidebar({ session }: AppSidebarProps) {
  const pathname = usePathname();
  const navItems = getNavigationForRole(session.user.role);

  return (
    <aside className="w-full rounded-[2rem] border border-[var(--panel-border)] bg-[linear-gradient(180deg,rgba(8,15,28,0.96),rgba(10,22,38,0.88))] p-5 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur lg:sticky lg:top-6 lg:flex lg:h-[calc(100vh-3rem)] lg:w-80 lg:flex-none lg:flex-col lg:p-6">
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.34em] text-cyan-200/70">
            Command lane
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Project Command Center
          </h2>
          <p className="text-sm leading-7 text-slate-300">
            Move through the core modules for your current role without losing the
            portfolio view or field priorities.
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Active role
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <RoleBadge role={session.user.role} />
            <span className="text-xs text-slate-400">Scoped navigation</span>
          </div>
        </div>
      </div>

      <nav
        className="mt-8 space-y-3 lg:flex-1 lg:overflow-y-auto lg:pr-1"
        aria-label="Dashboard navigation"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-[1.4rem] border px-4 py-4 transition hover:border-cyan-300/35 hover:bg-cyan-300/10 hover:shadow-[0_0_0_1px_rgba(103,232,249,0.08)] ${
              pathname === item.href
                ? "border-cyan-300/35 bg-cyan-300/12 shadow-[0_0_0_1px_rgba(103,232,249,0.12)]"
                : "border-white/6 bg-white/[0.04]"
            }`}
          >
            <span className="block text-xs uppercase tracking-[0.26em] text-slate-400">
              {pathname === item.href ? "Active module" : "Module"}
            </span>
            <span className="mt-2 block text-sm font-semibold text-white">
              {item.label}
            </span>
            <span className="mt-1.5 block text-xs leading-6 text-slate-300">
              {item.description}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
