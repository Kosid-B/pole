import Link from "next/link";
import {
  SITECOST_FINANCIAL_GUARDRAILS,
  SITECOST_MODULES,
} from "@/lib/sitecost-saas";

export function SaasCommandLanes() {
  return (
    <section className="space-y-5">
      <div className="rounded-[1.9rem] border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(8,47,73,0.36),rgba(8,15,28,0.92)_52%,rgba(30,41,59,0.88))] p-6 shadow-[0_24px_80px_rgba(2,6,23,0.28)] sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                SITECOST PROJECT MANAGEMENT SAAS
              </span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                Multi-project foundation
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              One command center for Commercial, PM, Procurement, Field and Finance
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              โครงสร้างนี้ทำให้ SiteCost ใช้บริหารหลายโครงการได้ โดยแต่ละ Project มี module,
              สิทธิ์, workflow และ financial guardrail ของตัวเอง งานลานตาก 446 จุดเป็น Project Template
              แรก ไม่ใช่ข้อจำกัดของระบบ
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Open Project Portfolio
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SITECOST_MODULES.map((module) => (
          <Link
            key={module.code}
            href={module.href}
            aria-label={`Open ${module.labelEn} command lane`}
            className="group rounded-[1.6rem] border border-white/8 bg-white/[0.04] p-5 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.07]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  {module.scope === "portfolio" ? "Portfolio" : "Project module"}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white group-hover:text-cyan-100">
                  {module.labelTh}
                </h3>
              </div>
              {module.financialGuardrail ? (
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[11px] font-semibold text-amber-100">
                  Guardrail
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{module.description}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[1.5rem] border border-emerald-300/18 bg-emerald-300/[0.07] p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-100/80">GM Gate</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            ≥ {SITECOST_FINANCIAL_GUARDRAILS.minimumGrossMarginPct}%
          </p>
          <p className="mt-2 text-sm leading-6 text-emerald-50/80">
            Gross Margin เป็นเปอร์เซ็นต์ของราคาขาย และเป็น hard floor ก่อนอนุมัติ commitment ใหม่
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-sky-300/18 bg-sky-300/[0.07] p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-sky-100/80">Cash Gate</p>
          <p className="mt-2 text-lg font-semibold text-white">Rolling Cash ≥ Safety Reserve</p>
          <p className="mt-2 text-sm leading-6 text-sky-50/80">
            {SITECOST_FINANCIAL_GUARDRAILS.rollingCashRule}
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-violet-300/18 bg-violet-300/[0.07] p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-violet-100/80">Commitment Gate</p>
          <p className="mt-2 text-lg font-semibold text-white">4-week coverage</p>
          <p className="mt-2 text-sm leading-6 text-violet-50/80">
            {SITECOST_FINANCIAL_GUARDRAILS.commitmentRule}
          </p>
        </article>
      </div>
    </section>
  );
}
