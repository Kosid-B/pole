import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen w-full flex-col px-4 py-6 sm:px-6 sm:py-8">
      <header className="mx-auto w-full max-w-6xl rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-2xl shadow-slate-950/30 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200/80">
          SaaS shell
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Project Command Center
        </h1>
      </header>
      <div className="flex-1 py-6">{children}</div>
    </div>
  );
}
