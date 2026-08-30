import Link from "next/link";
import {
  getCustomerProposalLink,
  getPmOverview,
  getProcurementOverview,
} from "@/lib/drying-yard-modules";

function baht(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function million(value: number) {
  return `${new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 2,
  }).format(value / 1_000_000)} ลบ.`;
}

function Kpi({
  label,
  value,
  detail,
  emphasis = false,
}: {
  label: string;
  value: string;
  detail?: string;
  emphasis?: boolean;
}) {
  return (
    <article
      className={`rounded-3xl border p-5 ${
        emphasis
          ? "border-emerald-300/30 bg-emerald-400/10 shadow-[0_18px_50px_rgba(16,185,129,0.12)]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
      {detail ? <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p> : null}
    </article>
  );
}

function Gate({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "green" | "amber" | "red" | "blue";
}) {
  const toneClass = {
    green: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
    amber: "border-amber-300/20 bg-amber-400/10 text-amber-100",
    red: "border-rose-300/20 bg-rose-400/10 text-rose-100",
    blue: "border-sky-300/20 bg-sky-400/10 text-sky-100",
  }[tone];

  return (
    <article className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 opacity-80">{detail}</p>
    </article>
  );
}

export default async function PmPage() {
  const [pmResult, procurementResult, proposalLinkResult] = await Promise.all([
    getPmOverview(),
    getProcurementOverview(),
    getCustomerProposalLink(),
  ]);

  if (!pmResult.data) {
    return (
      <section className="space-y-6">
        <div>
          <p className="text-sm font-medium text-emerald-300">PM Control</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Project Management Module
          </h1>
        </div>
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50">
          <p className="font-semibold">PM module ยังเชื่อมข้อมูลไม่ได้</p>
          <p className="mt-2 text-sm text-amber-50/80">{pmResult.error}</p>
          <p className="mt-4 rounded-2xl bg-slate-950/40 p-4 font-mono text-xs text-slate-300">
            DRYING_YARD_ADMIN_ACCESS_CODE=...
          </p>
        </div>
      </section>
    );
  }

  const pm = pmResult.data;
  const settings = pm.settings;
  const procurement = procurementResult.data?.summary;
  const customerProposal = proposalLinkResult.data;
  const committed = pm.packages.reduce(
    (sum, item) => sum + Number(item.actual_committed_amount || 0),
    0,
  );
  const paid = pm.packages.reduce(
    (sum, item) => sum + Number(item.actual_paid_amount || 0),
    0,
  );
  const gmPct = Number(pm.totals.gm) * 100;
  const advanceTarget = Number(settings?.advance_target_pct || 0);
  const procurementCoverage = Number(procurement?.coverage_pct || 0);
  const committedPct = pm.totals.cost > 0 ? (committed / pm.totals.cost) * 100 : 0;

  const gmTone = gmPct >= 30 ? "green" : gmPct >= 28 ? "amber" : "red";
  const procurementTone =
    procurementCoverage >= 70 ? "green" : procurementCoverage >= 30 ? "amber" : "red";
  const advanceTone = advanceTarget >= 20 ? "green" : advanceTarget >= 15 ? "amber" : "red";
  const nextAction =
    procurementCoverage < 50
      ? "เร่ง RFQ / Award Supplier ใน Cluster ปริมาณสูงก่อน"
      : gmPct < 30
        ? "ทบทวน EAC และ Cost overrun ก่อนเปิด Batch ถัดไป"
        : "รักษา Cash Gate และเปิด Batch ตามเงินรับจริง";

  return (
    <section className="space-y-8 pb-8">
      <nav
        aria-label="SiteCost module switcher"
        className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-slate-950/60 p-1.5 sm:w-fit"
      >
        <Link
          href="/commercial"
          className="flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          Commercial / Pricing
        </Link>
        <Link
          href="/pm"
          aria-current="page"
          className="flex min-h-12 items-center justify-center rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-950/20"
        >
          PM Control
        </Link>
      </nav>

      <header className="rounded-[2rem] border border-emerald-300/10 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 p-6 shadow-xl shadow-slate-950/20 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            INTERNAL PM MODULE
          </span>
          <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200">
            Admin = Project Manager
          </span>
        </div>

        <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              PM Control Center
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300 sm:text-base">
              เริ่มจากสิ่งที่ PM ต้องตัดสินใจวันนี้ก่อน แล้วค่อยเปิด Supplier/PO และ
              Work Package รายละเอียดภายหลัง เพื่อคุม Margin, Working Capital และ
              Procurement ของ 446 จุดโดยไม่เพิ่ม cognitive load
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:w-[390px]">
            <a
              href="#decision-gates"
              className="flex min-h-12 items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              ดู PM Decision Gates
            </a>
            <a
              href="#procurement"
              className="flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
            >
              ดู Procurement
            </a>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="BAC / Cost Base" value={million(pm.totals.cost)} />
        <Kpi label="Contract Value ก่อน VAT" value={million(pm.totals.sale)} />
        <Kpi
          label="Forecast GM"
          value={`${gmPct.toFixed(2)}%`}
          detail={`Gross Profit ${million(pm.totals.gp)}`}
          emphasis
        />
        <Kpi
          label="Advance Target"
          value={`${advanceTarget.toFixed(0)}%`}
          detail={settings?.contract_mode || "unknown contract mode"}
        />
      </div>

      <section id="decision-gates" className="scroll-mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-300">PM DECISION GATES</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              สถานะที่ต้องดู ก่อนอนุมัติ Batch / PO ใหม่
            </h2>
          </div>
          <span className="w-fit rounded-full border border-white/10 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-300">
            Progressive control • scan first, detail second
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Gate
            label="Margin Gate"
            value={`${gmPct.toFixed(2)}% GM`}
            detail={gmPct >= 30 ? "อยู่เหนือ guardrail 30%" : "ต้องทบทวน EAC / cost overrun"}
            tone={gmTone}
          />
          <Gate
            label="Advance Gate"
            value={`${advanceTarget.toFixed(0)}%`}
            detail={`Customer days-to-cash ${Number(settings?.client_payment_lag_days || 0)} วัน`}
            tone={advanceTone}
          />
          <Gate
            label="Procurement Gate"
            value={`${procurementCoverage.toFixed(1)}% awarded`}
            detail={`${procurement?.awarded_clusters || 0}/${procurement?.clusters || 0} clusters`}
            tone={procurementTone}
          />
          <Gate
            label="Commitment Gate"
            value={`${committedPct.toFixed(1)}% BAC`}
            detail={`Committed ${million(committed)} • Paid ${million(paid)}`}
            tone="blue"
          />
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">
              Recommended next action
            </p>
            <p className="mt-1 text-base font-semibold text-white">{nextAction}</p>
          </div>
          <a
            href="#procurement"
            className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950 sm:mt-0"
          >
            ไปยัง Procurement
          </a>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Customer Days-to-Cash"
          value={`${Number(settings?.client_payment_lag_days || 0)} วัน`}
          detail={`Claim cycle ${Number(settings?.claim_cycle_days || 0)} วัน`}
        />
        <Kpi
          label="Batch Control"
          value={`${Number(settings?.batch_size_sites || 0)} จุด`}
          detail={`เปิด batch ทุก ${Number(settings?.batch_start_interval_days || 0)} วัน`}
        />
        <Kpi
          label="Safety Cash Buffer"
          value={`${Number(settings?.safety_buffer_pct || 0)}% BAC`}
          detail={`Retention ${Number(settings?.retention_pct || 0)}%`}
        />
        <Kpi
          label="Concrete Exposure"
          value={million(pm.totals.concrete)}
          detail="Critical procurement category"
        />
      </section>

      <details open className="group rounded-3xl border border-white/10 bg-white/5">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-medium text-emerald-300">SUPPLIER / PO COMMITMENT</p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Work Package cash commitments
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-400 sm:block">
              Committed {baht(committed)} • Paid {baht(paid)}
            </span>
            <span className="text-xl text-slate-400 transition group-open:rotate-45">+</span>
          </div>
        </summary>

        <div className="border-t border-white/10 px-5 pb-6 pt-4 sm:px-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead className="text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="px-3 py-3">Work Package</th>
                  <th className="px-3 py-3 text-right">Budget</th>
                  <th className="px-3 py-3">Supplier / PO</th>
                  <th className="px-3 py-3 text-right">Credit</th>
                  <th className="px-3 py-3 text-right">Deposit</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {pm.packages.map((item) => (
                  <tr key={item.package_code} className="border-b border-white/5 text-slate-300">
                    <td className="px-3 py-3 font-medium text-white">
                      {item.package_name}
                      <span className="mt-1 block text-xs text-slate-500">
                        Work week {item.planned_work_week}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {baht(Number(item.budget_amount))}
                    </td>
                    <td className="px-3 py-3">
                      {item.supplier_name || "ยังไม่ยืนยัน"}
                      {item.po_no ? (
                        <span className="mt-1 block text-xs text-slate-500">
                          PO {item.po_no}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {item.supplier_credit_days == null
                        ? `${Number(settings?.supplier_credit_days_default || 0)} วัน*`
                        : `${item.supplier_credit_days} วัน`}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {item.deposit_pct == null ? "-" : `${item.deposit_pct}%`}
                    </td>
                    <td className="px-3 py-3">{item.status || "planning"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs leading-6 text-slate-500">
            * ใช้ Supplier Credit Default จนกว่า PM จะยืนยันใบเสนอราคา/PO จริง
          </p>
        </div>
      </details>

      <div id="procurement" className="grid scroll-mt-8 gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-[2rem] border border-emerald-300/15 bg-gradient-to-br from-emerald-950/70 to-slate-950 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-300">PROCUREMENT</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Cluster Framework</h2>
            </div>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              PM INTERNAL
            </span>
          </div>

          {procurement ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Kpi label="Clusters" value={`${procurement.clusters}`} detail={`${procurement.sites} sites`} />
              <Kpi
                label="Concrete Volume"
                value={`${Number(procurement.volume).toLocaleString("th-TH", { maximumFractionDigits: 0 })} m³`}
                detail="Framework volume"
              />
              <Kpi
                label="Saving Target"
                value={baht(Number(procurement.target_saving))}
                detail="Internal procurement target"
              />
              <Kpi
                label="Award Coverage"
                value={`${Number(procurement.coverage_pct).toFixed(1)}%`}
                detail={`Awarded saving ${baht(Number(procurement.awarded_saving))}`}
              />
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
              Procurement API: {procurementResult.error}
            </p>
          )}

          <p className="mt-5 text-sm leading-7 text-slate-400">
            ใช้ Cluster เป็นหน่วยต่อรอง Framework Agreement และ Customer Direct Pay
            โดยจัดลำดับจังหวัดปริมาณสูงก่อน เพื่อลดจำนวน supplier decisions ที่ PM
            ต้องทำพร้อมกัน
          </p>
        </article>

        <article className="rounded-[2rem] border border-sky-300/20 bg-sky-400/10 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-sky-200">CUSTOMER VIEW</p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Proposal ใช้ Cluster ชุดเดียวกับ PM
              </h2>
            </div>
            <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100">
              SAFE TO SHARE
            </span>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            ลูกค้าเห็น Scope, Cluster, Volume, Procurement status และ Payment Model
            แต่ไม่เห็น Cost Base, Margin, Supplier bid หรือ saving target ภายใน
          </p>

          {customerProposal ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <p className="text-xs text-slate-400">
                {customerProposal.proposal_no} • {customerProposal.version_no} • {customerProposal.status}
              </p>
              <a
                href={customerProposal.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex min-h-12 items-center justify-center rounded-2xl bg-sky-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
              >
                เปิด Customer Proposal ↗
              </a>
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              Customer Proposal link: {proposalLinkResult.error}
            </p>
          )}
        </article>
      </div>

      <section className="rounded-[2rem] border border-sky-300/15 bg-gradient-to-r from-blue-950/70 to-slate-950 p-6 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-300">COMMERCIAL HANDOFF</p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              ต้องการตรวจราคาที่ลูกค้าเห็น → กลับ Commercial
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              Commercial และ PM ใช้ Source of Truth เดียวกัน แต่แยกชั้นข้อมูลตามหน้าที่
              เพื่อป้องกันข้อมูลต้นทุนภายในหลุดไปหน้าขาย
            </p>
          </div>
          <Link
            href="/commercial"
            className="flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-sky-300 px-6 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
          >
            เปิด Commercial →
          </Link>
        </div>
      </section>
    </section>
  );
}
