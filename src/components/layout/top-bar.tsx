import Link from "next/link";
import { getChangeAccountHref, signOut, type AppSession } from "@/lib/auth";

type TopBarProps = {
  session: AppSession;
};

export function TopBar({ session }: TopBarProps) {
  return (
    <header className="flex flex-col gap-4 rounded-[2rem] border border-[var(--panel-border)] bg-[var(--panel-soft)] px-5 py-4 shadow-[0_20px_60px_rgba(2,6,23,0.28)] backdrop-blur sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.34em] text-cyan-200/70">
          Protected workspace
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
          Project operations dashboard
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-slate-300">
          Review portfolio health, jump into active modules, and keep field execution
          moving without losing executive visibility.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <div className="rounded-[1.4rem] border border-white/8 bg-slate-950/70 px-4 py-3 text-left sm:min-w-64 sm:text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Signed in as
          </p>
          <p className="text-sm font-medium text-white">{session.user.email}</p>
        </div>
        <Link
          href={getChangeAccountHref()}
          prefetch={false}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-cyan-300/20 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
        >
          Change account
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
