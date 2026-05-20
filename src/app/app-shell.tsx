import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
      <header className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-2xl shadow-slate-950/30 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200/80">
          SaaS shell
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Project Command Center
        </h1>
      </header>
      <main className="flex-1 py-6">{children}</main>
    </div>
  );
}
