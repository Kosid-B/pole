import Link from "next/link";
import { getDashboardAlerts } from "@/lib/dashboard/get-dashboard-alerts";
import { getCommercialOverview, getProcurementOverview } from "@/lib/drying-yard-modules";
import { getPmFinancialGuardrail } from "@/lib/pm-financial-guardrail";

function number(value: number, digits = 0) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: digits }).format(value);
}

function pct(value: number | null | undefined) {
  return value == null ? "รอตรวจ" : `${(Number(value) * 100).toFixed(2)}%`;
}

function baht(value: number | null | undefined) {
  if (value == null) return "รอตรวจ";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function GateCard({
  label,
  value,
  detail,
  pass,
}: {
  label: string;
  value: string;
  detail: string;
  pass: boolean | null;
}) {
  const tone =
    pass === true
      ? "border-emerald-300/20 bg-emerald-400/[0.08] text-emerald-200"
      : pass === false
        ? "border-rose-300/25 bg-rose-400/[0.1] text-rose-100"
        : "border-amber-300/20 bg-amber-400/[0.08] text-amber-100";

  return (
    <article className={`rounded-2xl border p-4 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] opacity-75">{label}</p>
        <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold">
          {pass === true ? "PASS" : pass === false ? "HOLD" : "CHECK"}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 opacity-75">{detail}</p>
    </article>
  );
}

const modules = [
  {
    href: "/commercial",
    code: "C",
    title: "Commercial",
    thai: "ราคาและข้อเสนอลูกค้า",
    description: "ราคาขาย, Tier, G63/G64 และ Quote โดยไม่เปิดเผยต้นทุนจัดซื้อภายใน",
    tone: "border-sky-300/20 bg-sky-400/[0.07] text-sky-200",
  },
  {
    href: "/pm",
    code: "PM",
    title: "PM Control",
    thai: "ควบคุมแผนและกระแสเงินสด",
    description: "BAC, EAC, Rolling Batch, Advance และ Decision Gates ก่อน Commitment",
    tone: "border-emerald-300/20 bg-emerald-400/[0.07] text-emerald-200",
  },
  {
    href: "/procurement",
    code: "P",
    title: "Procurement",
    thai: "จัดซื้อแบบ Cluster",
    description: "Supplier Sourcing, RFQ, TDC, Award และ Framework Agreement",
    tone: "border-violet-300/20 bg-violet-400/[0.07] text-violet-200",
  },
  {
    href: "/field-readiness",
    code: "F",
    title: "Field Control",
    thai: "ความพร้อมและหลักฐานหน้างาน",
    description: "Site Readiness, Delivery Evidence และ PM Verified Actual แยกตามสิทธิ์",
    tone: "border-amber-300/20 bg-amber-400/[0.07] text-amber-100",
  },
] as const;

export default async function DashboardHomePage() {
  const [commercialResult, procurementResult, guardrailResult, alerts] = await Promise.all([
    getCommercialOverview(),
    getProcurementOverview(),
    getPmFinancialGuardrail(),
    getDashboardAlerts().catch(() => []),
  ]);

  const commercial = commercialResult.data;
  const procurement = procurementResult.data;
  const guardrail = guardrailResult.data;
  const siteCount = commercial?.summary.site_count ?? procurement?.summary.sites ?? 446;
  const clusterCount = procurement?.summary.clusters ?? 24;
  const awardCoverage = procurement?.summary.coverage_pct ?? 0;
  const gmValue = guardrail?.gm_gate.forecast_gm ?? commercial?.summary.gross_margin;
  const gmPass = guardrail ? guardrail.gm_gate.pass : gmValue != null ? gmValue >= 0.32 : null;
  const cashPass = guardrail ? guardrail.cash_gate.pass : null;
  const dataConnected = Boolean(commercial || procurement || guardrail);

  const nextAction =
    gmPass === false
      ? { tone: "rose", title: "หยุด Commitment ใหม่", detail: "Forecast GM ต่ำกว่า 32% — ตรวจ EAC และราคาขายก่อนปล่อย Batch หรือ PO", href: "/pm/financial", cta: "เปิด Financial Control" }
      : cashPass === false
        ? { tone: "rose", title: "ทบทวน Rolling Cash", detail: "เงินสดต่ำกว่า Safety Reserve — ปรับ Advance, Claim Cycle หรือขนาด Batch", href: "/pm/financial", cta: "แก้โครงสร้างเงินสด" }
        : awardCoverage < 100
          ? { tone: "amber", title: "เร่ง Supplier RFQ ตาม Cluster", detail: `Award Coverage ปัจจุบัน ${number(awardCoverage, 1)}% — ยืนยันราคา TDC, Capacity และ Payment Terms`, href: "/pm/suppliers", cta: "เปิด Supplier Sourcing" }
          : { tone: "green", title: "ตรวจ Batch ถัดไป", detail: "Guardrail ผ่านแล้ว ให้ตรวจ Readiness, Funding และ Supplier Capacity ก่อน Manual Release", href: "/pm/batches", cta: "เปิด Batch Release" };

  const actionTone =
    nextAction.tone === "rose"
      ? "border-rose-300/20 bg-rose-400/[0.08]"
      : nextAction.tone === "amber"
        ? "border-amber-300/20 bg-amber-400/[0.08]"
        : "border-emerald-300/20 bg-emerald-400/[0.08]";

  return (
    <section className="space-y-5 pb-4">
      <header className="overflow-hidden rounded-[1.75rem] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_35%),linear-gradient(135deg,rgba(8,20,37,0.98),rgba(7,31,47,0.9))] p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
            ภาพรวมโครงการ
          </span>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${dataConnected ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200" : "border-amber-300/20 bg-amber-400/10 text-amber-100"}`}>
            {dataConnected ? "● เชื่อมข้อมูลโครงการ" : "● รอตรวจการเชื่อมข้อมูล"}
          </span>
        </div>

        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div>
            <p className="text-sm font-medium text-cyan-200/75">SiteCost Project Command Center</p>
            <h2 className="mt-2 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              งานลานตาก 446 จุด — เห็นสถานะก่อน แล้วค่อยตัดสินใจ
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              รวม Commercial, PM, Procurement และ Field Control ไว้ในภาพเดียว พร้อมล็อกการตัดสินใจด้วย GM 32% และ Rolling Cash Safety Reserve
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:w-[390px]">
            <Link href="/pm" className="flex min-h-12 items-center justify-center rounded-xl bg-cyan-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
              เปิด PM Control
            </Link>
            <Link href="/pm/suppliers" className="flex min-h-12 items-center justify-center rounded-xl border border-white/12 bg-white/[0.05] px-4 text-sm font-medium text-white transition hover:bg-white/10">
              Supplier Sourcing
            </Link>
          </div>
        </div>
      </header>

      <section aria-labelledby="guardrail-title" className="rounded-[1.75rem] border border-white/8 bg-slate-950/35 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/65">Decision Guardrails</p>
            <h2 id="guardrail-title" className="mt-1 text-xl font-semibold text-white">ตรวจเงื่อนไขก่อนอนุมัติ Commitment</h2>
          </div>
          <Link href="/pm/financial" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">ดูรายละเอียด Financial Control →</Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <GateCard label="GM Gate" value={pct(gmValue)} detail="ต้องไม่ต่ำกว่า 32.00% ของราคาขาย" pass={gmPass} />
          <GateCard label="Cash Gate" value={baht(guardrail?.cash_gate.min_cash)} detail={`Safety Reserve ${baht(guardrail?.cash_gate.safety_reserve)}`} pass={cashPass} />
          <GateCard label="Procurement Gate" value={`${number(awardCoverage, 1)}%`} detail={`${number(procurement?.summary.awarded_clusters ?? 0)} / ${number(clusterCount)} Cluster Awarded`} pass={procurement ? awardCoverage >= 100 : null} />
          <GateCard label="Project Gate" value={`${number(siteCount)} จุด`} detail="ขอบเขตงานลานตากที่ต้องควบคุม" pass={siteCount === 446 ? true : null} />
        </div>
      </section>

      <section aria-labelledby="modules-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/65">Workspaces</p>
            <h2 id="modules-title" className="mt-1 text-xl font-semibold text-white">เลือกงานที่ต้องทำ</h2>
          </div>
          <p className="hidden text-sm text-slate-400 sm:block">แสดงเฉพาะโมดูลตามสิทธิ์บัญชี</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => (
            <Link key={module.href} href={module.href} className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-current/35 hover:shadow-[0_16px_40px_rgba(2,6,23,0.25)] ${module.tone}`}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-current/20 bg-slate-950/35 px-2 text-sm font-bold">{module.code}</span>
                <span aria-hidden="true" className="text-lg opacity-45 transition group-hover:translate-x-1 group-hover:opacity-90">→</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{module.title}</h3>
              <p className="mt-1 text-sm font-medium text-current">{module.thai}</p>
              <p className="mt-3 text-xs leading-6 text-slate-400">{module.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className={`rounded-[1.75rem] border p-5 ${actionTone}`} aria-labelledby="next-action-title">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Next best action</p>
          <h2 id="next-action-title" className="mt-2 text-xl font-semibold text-white">{nextAction.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">{nextAction.detail}</p>
          <Link href={nextAction.href} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
            {nextAction.cta}
          </Link>
        </section>

        <aside className="rounded-[1.75rem] border border-white/8 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Action queue</p>
              <h2 className="mt-1 text-lg font-semibold text-white">รายการติดตาม</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-slate-950/40 px-2.5 py-1 text-xs text-slate-300">{number(alerts.length)}</span>
          </div>
          <div className="mt-4 space-y-2">
            {alerts.length === 0 ? (
              <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/[0.07] p-3 text-sm text-emerald-100">ยังไม่มี Alert จาก Project shell</div>
            ) : (
              alerts.slice(0, 3).map((alert) => (
                <article key={alert.id} className="rounded-xl border border-white/8 bg-slate-950/35 p-3">
                  <p className="text-sm font-medium text-white">{alert.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{alert.description}</p>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
