import Link from "next/link";
import {
  SITECOST_FINANCIAL_GUARDRAILS,
  SITECOST_MODULES,
  type SiteCostModuleCode,
} from "@/lib/sitecost-saas";

const commandLaneAriaLabels: Record<SiteCostModuleCode, string> = {
  portfolio: "เปิดพอร์ตโครงการ",
  commercial: "เปิดพื้นที่บริหารรายได้และสัญญา",
  pm: "เปิดพื้นที่บริหารโครงการ",
  procurement: "เปิดพื้นที่จัดซื้อและซัพพลายเออร์",
  field: "เปิดพื้นที่ปฏิบัติงานภาคสนาม",
  finance: "เปิดพื้นที่การเงินและกระแสเงินสด",
};

const primaryLaneCodes: SiteCostModuleCode[] = ["commercial", "pm", "procurement"];
const supportLaneCodes: SiteCostModuleCode[] = ["field", "finance"];

export function SaasCommandLanes() {
  const primaryLanes = SITECOST_MODULES.filter((module) => primaryLaneCodes.includes(module.code));
  const supportLanes = SITECOST_MODULES.filter((module) => supportLaneCodes.includes(module.code));

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(8,47,73,0.38),rgba(8,15,28,0.94)_52%,rgba(30,41,59,0.88))] p-6 shadow-[0_24px_80px_rgba(2,6,23,0.28)] sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-end">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold text-cyan-100">
                PROJECT MANAGEMENT SAAS
              </span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold text-emerald-100">
                Multi-project ready
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              เริ่มจากสิ่งที่ต้องตัดสินใจ แล้วค่อยลงรายละเอียด
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              SiteCost จัดลำดับงานตาม flow จริงของโครงการ: ราคาและรายได้ → PM และ Cash → จัดซื้อ → หน้างาน → การเงิน
              เพื่อลดการกระโดดข้ามเมนูและลดความเสี่ยงจากการตัดสินใจบนข้อมูลไม่ครบ
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <Link
              href="/projects"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
            >
              เปิดพอร์ตโครงการ
            </Link>
            <Link
              href="/pm"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            >
              ไป PM Control
            </Link>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Core decision lanes</p>
            <h3 className="mt-1 text-lg font-semibold text-white">3 งานหลักที่ใช้ตัดสินใจบ่อยที่สุด</h3>
          </div>
          <span className="hidden text-xs text-slate-500 sm:block">Hick’s Law • ลดตัวเลือกที่มีน้ำหนักเท่ากัน</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {primaryLanes.map((module, index) => (
            <Link
              key={module.code}
              href={module.href}
              aria-label={commandLaneAriaLabels[module.code]}
              className="group min-h-40 rounded-[1.6rem] border border-white/8 bg-white/[0.04] p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-300/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/10 text-sm font-semibold text-cyan-100">
                  {index + 1}
                </span>
                {module.financialGuardrail ? (
                  <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[11px] font-semibold text-amber-100">
                    Financial gate
                  </span>
                ) : null}
              </div>
              <h4 className="mt-4 text-lg font-semibold text-white group-hover:text-cyan-100">{module.labelTh}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-400">{module.description}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {supportLanes.map((module) => (
          <Link
            key={module.code}
            href={module.href}
            aria-label={commandLaneAriaLabels[module.code]}
            className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 transition hover:border-white/15 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          >
            <span>
              <span className="block text-sm font-semibold text-white">{module.labelTh}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{module.description}</span>
            </span>
            <span className="text-lg text-slate-500" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3" aria-label="Financial guardrails">
        <article className="rounded-[1.4rem] border border-emerald-300/18 bg-emerald-300/[0.06] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-emerald-100">GM Gate</p>
            <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[10px] font-semibold text-emerald-100">HARD GATE</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">≥ {SITECOST_FINANCIAL_GUARDRAILS.minimumGrossMarginPct}%</p>
          <p className="mt-1 text-xs leading-5 text-emerald-50/65">Gross Margin เป็น % ของราคาขาย ไม่ใช่ markup บนต้นทุน</p>
        </article>
        <article className="rounded-[1.4rem] border border-sky-300/18 bg-sky-300/[0.06] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-sky-100">Cash Gate</p>
            <span className="rounded-full bg-sky-300/10 px-2 py-1 text-[10px] font-semibold text-sky-100">HARD GATE</span>
          </div>
          <p className="mt-2 text-lg font-semibold text-white">Rolling Cash ≥ Safety Reserve</p>
          <p className="mt-1 text-xs leading-5 text-sky-50/65">{SITECOST_FINANCIAL_GUARDRAILS.rollingCashRule}</p>
        </article>
        <article className="rounded-[1.4rem] border border-violet-300/18 bg-violet-300/[0.06] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-violet-100">Commitment Gate</p>
            <span className="rounded-full bg-violet-300/10 px-2 py-1 text-[10px] font-semibold text-violet-100">4 WEEKS</span>
          </div>
          <p className="mt-2 text-lg font-semibold text-white">Coverage ก่อน Commitment ใหม่</p>
          <p className="mt-1 text-xs leading-5 text-violet-50/65">{SITECOST_FINANCIAL_GUARDRAILS.commitmentRule}</p>
        </article>
      </div>
    </section>
  );
}
