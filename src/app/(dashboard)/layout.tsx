import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { requireSession } from "@/lib/auth";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await requireSession();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row">
      <AppSidebar session={session} />
      <div className="flex-1 space-y-6">
        <TopBar session={session} />
        <main className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 text-slate-100 shadow-2xl shadow-slate-950/20 backdrop-blur sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
