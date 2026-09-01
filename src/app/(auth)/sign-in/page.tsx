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
    <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[1.75rem] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_38%),rgba(8,20,37,0.9)] p-6 text-slate-100 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-8">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.75)]" />
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-200/70">
            SiteCost 446
          </p>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Project Command Center
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          ศูนย์ควบคุมงานลานตาก 446 จุด สำหรับ Commercial, PM, Procurement และ Field โดยแสดงเฉพาะข้อมูลตามสิทธิ์บัญชี
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.07] p-4">
            <p className="text-sm font-medium text-emerald-200">Financial Guardrail</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">GM ≥ 32% · Cash ≥ Safety Reserve</p>
          </div>
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.07] p-4">
            <p className="text-sm font-medium text-cyan-100">Role-based workspace</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Executive · Admin · Field Leader</p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-6 text-slate-100 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">เข้าสู่ระบบ</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">บัญชีโครงการ</h2>
        <p className="mt-1 text-sm text-slate-400">กรอกอีเมลและรหัสผ่านที่ได้รับอนุญาต</p>
        <form action="/api/auth/sign-in" method="post" className="space-y-5">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          {error === "invalid-credentials" ? (
            <div role="alert" aria-live="polite" className="mt-5 rounded-2xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              <p className="font-medium">เข้าสู่ระบบไม่สำเร็จ</p>
              <p className="mt-1 text-xs text-rose-100/75">ตรวจตัวพิมพ์เล็ก–ใหญ่ของอีเมลและรหัสผ่าน แล้วลองอีกครั้ง</p>
            </div>
          ) : null}

          <div className="space-y-2 pt-5">
            <label className="text-sm font-medium text-slate-100" htmlFor="email">
              อีเมล
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              inputMode="email"
              placeholder="support@b-tctraining.com"
              defaultValue="support@b-tctraining.com"
              className="min-h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-100" htmlFor="password">
              รหัสผ่าน
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="min-h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/50"
            />
          </div>

          <button
            type="submit"
            aria-label="Sign in"
            className="min-h-12 w-full rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </section>
  );
}
