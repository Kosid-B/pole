import { signInWithPassword } from "@/lib/auth";

type SignInPageProps = {
  searchParams?: Promise<{
    redirectTo?: string;
    error?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = (await searchParams) ?? {};
  const redirectTo = params.redirectTo ?? "/";
  const error = params.error ?? "";

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-100 shadow-2xl shadow-slate-950/30 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
          Access control
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
          Sign in to your role-aware workspace
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
          Sign in with a real project account to enter the protected dashboard shell.
        </p>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 text-slate-100 shadow-2xl shadow-slate-950/30 backdrop-blur">
        <form action={signInWithPassword} className="space-y-5">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          {error === "invalid-credentials" ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              Invalid email or password. Please try again.
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-100" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue="admin@example.com"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-100" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              defaultValue="password"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/50"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-100"
          >
            Sign in
          </button>
        </form>
      </div>
    </section>
  );
}
