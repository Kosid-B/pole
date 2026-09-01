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
    <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:flex-row lg:gap-5 lg:px-5 lg:py-5">
      <AppSidebar session={session} />
      <div className="min-w-0 flex-1 space-y-4">
        <TopBar session={session} />
        <main className="rounded-[1.75rem] border border-[var(--panel-border)] bg-[var(--panel)] p-4 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.28)] backdrop-blur sm:p-6 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
