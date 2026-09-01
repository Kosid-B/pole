import Link from "next/link";
import { getChangeAccountHref, signOut, type AppSession } from "@/lib/auth";

type TopBarProps = {
  session: AppSession;
};

export function TopBar({ session }: TopBarProps) {
  return (
    <header className="flex flex-col gap-4 rounded-[1.75rem] border border-[var(--panel-border)] bg-[var(--panel-soft)] px-5 py-4 shadow-[0_18px_50px_rgba(2,6,23,0.22)] backdrop-blur sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.75)]" />
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-100/70">
            Project Command Center
          </p>
        </div>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
          SiteCost — งานลานตาก 446 จุด
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Commercial · PM · Procurement · Field Control
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <div className="mr-auto min-w-0 sm:mr-1 sm:text-right">
          <p className="truncate text-sm font-medium text-white">{session.user.email}</p>
          <p className="text-xs text-slate-400">บัญชีโครงการ · {session.user.role}</p>
        </div>
        <Link
          href={getChangeAccountHref()}
          prefetch={false}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
        >
          เปลี่ยนบัญชี
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            ออกจากระบบ
          </button>
        </form>
      </div>
    </header>
  );
}
