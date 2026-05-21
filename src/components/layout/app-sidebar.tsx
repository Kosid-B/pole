import Link from "next/link";
import { RoleBadge } from "@/components/layout/role-badge";
import type { AppSession } from "@/lib/auth";
import { getNavigationForRole } from "@/lib/permissions";

type AppSidebarProps = {
  session: AppSession;
};

export function AppSidebar({ session }: AppSidebarProps) {
  const navItems = getNavigationForRole(session.user.role);

  return (
    <aside className="w-full rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 text-slate-100 shadow-2xl shadow-slate-950/30 backdrop-blur lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-72 lg:flex-none">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
            Dashboard
          </p>
          <h2 className="text-xl font-semibold tracking-tight">
            Operations Shell
          </h2>
          <p className="text-sm text-slate-300">
            Navigate the MVP modules that match your active role.
          </p>
        </div>
        <RoleBadge role={session.user.role} />
      </div>

      <nav className="mt-8 space-y-2" aria-label="Dashboard navigation">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-2xl border border-white/5 bg-white/5 px-4 py-3 transition hover:border-sky-300/40 hover:bg-sky-400/10"
          >
            <span className="block text-sm font-medium text-white">
              {item.label}
            </span>
            <span className="mt-1 block text-xs text-slate-300">
              {item.description}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
