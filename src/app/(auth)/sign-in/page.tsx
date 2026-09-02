type SignInPageProps = {
  searchParams?: Promise<{
    redirectTo?: string;
    error?: string;
    invite?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = (await searchParams) ?? {};
  const redirectTo = params.redirectTo ?? "/";
  const error = params.error ?? "";
  const invite = params.invite ?? "";

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-100 shadow-2xl shadow-slate-950/30 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
          SiteCost SaaS
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
          เข้าสู่ Project Command Center
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
          เข้าสู่ระบบด้วยบัญชีโครงการ ระบบจะเปิดเฉพาะ Commercial, PM, Procurement และ Field modules ตามสิทธิ์ของบัญชี
        </p>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 text-slate-100 shadow-2xl shadow-slate-950/30 backdrop-blur">
        <form action="/api/auth/sign-in" method="post" className="space-y-5">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          {invite === "accepted" ? (
            <div role="status" className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm leading-6 text-emerald-100">
              ตั้งรหัสผ่านสำเร็จแล้ว คุณสามารถเข้าสู่ระบบด้วยอีเมลและรหัสผ่านใหม่ได้
            </div>
          ) : null}

          {error === "invalid-credentials" ? (
            <div role="alert" className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่
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
              autoComplete="username"
              inputMode="email"
              placeholder="support@b-tctraining.com"
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/50 focus-visible:ring-2 focus-visible:ring-sky-300/50"
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
              autoComplete="current-password"
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/50 focus-visible:ring-2 focus-visible:ring-sky-300/50"
            />
          </div>

          <button
            type="submit"
            aria-label="Sign in"
            className="min-h-12 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </section>
  );
}
