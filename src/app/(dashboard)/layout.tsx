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
    <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-5 px-4 py-4 lg:flex-row lg:px-6 lg:py-6">
      <AppSidebar session={session} />
      <div className="flex-1 space-y-6">
        <TopBar session={session} />
        <main className="rounded-[2rem] border border-[var(--panel-border)] bg-[var(--panel)] p-5 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
