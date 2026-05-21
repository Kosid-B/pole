import Link from "next/link";
import { getSwitchRoleHref, signOut, type AppSession } from "@/lib/auth";

type TopBarProps = {
  session: AppSession;
};

export function TopBar({ session }: TopBarProps) {
  return (
    <header className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 px-5 py-4 shadow-xl shadow-slate-950/20 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
          Protected workspace
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Project operations dashboard
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Signed in as
          </p>
          <p className="text-sm font-medium text-white">{session.user.email}</p>
        </div>
        <Link
          href={getSwitchRoleHref()}
          prefetch={false}
          className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-300/40 hover:bg-sky-400/10"
        >
          Switch role
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-100"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
