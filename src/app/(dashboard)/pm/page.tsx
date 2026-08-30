import Link from "next/link";
import {
  getCustomerProposalLink,
  getPmOverview,
  getProcurementOverview,
} from "@/lib/drying-yard-modules";

const PROCUREMENT_URL =
  process.env.NEXT_PUBLIC_DRYING_YARD_PROCUREMENT_URL ||
  "https://sitecost-lantak-admin.vercel.app/procurement";

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
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
      {detail ? <p className="mt-2 text-sm text-slate-400">{detail}</p> : null}
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

  return (
    <section className="space-y-8">
      <header className="rounded-[2rem] border border-emerald-300/10 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 p-6 shadow-xl shadow-slate-950/20 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            INTERNAL PM MODULE
          </span>
          <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200">
            Admin = Project Manager
          </span>
        </div>
        <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              PM Control Center
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
              BAC, Margin, Advance, Supplier/PO Commitment, Procurement Cluster,
              Framework Agreement และ Cash-flow assumptions แยกออกจาก Commercial
              เพื่อไม่ให้ข้อมูลภายในปะปนกับหน้าขาย
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/commercial"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Commercial / Pricing
            </Link>
            <a
              href={PROCUREMENT_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Procurement ↗
            </a>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="BAC / Cost Base" value={million(pm.totals.cost)} />
        <Kpi label="Contract Value ก่อน VAT" value={million(pm.totals.sale)} />
        <Kpi label="Gross Profit" value={million(pm.totals.gp)} />
        <Kpi
          label="Forecast GM"
          value={`${(Number(pm.totals.gm) * 100).toFixed(2)}%`}
          detail={`Concrete ${million(pm.totals.concrete)}`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Advance Target"
          value={`${Number(settings?.advance_target_pct || 0).toFixed(0)}%`}
          detail={settings?.contract_mode || "unknown contract mode"}
        />
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
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-300">
                SUPPLIER / PO COMMITMENT
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Work Package cash commitments
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Committed {baht(committed)} • Paid {baht(paid)}
            </p>
          </div>

          <div className="mt-5 overflow-x-auto">
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
        </article>

        <div className="space-y-6">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-medium text-emerald-300">PROCUREMENT</p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Cluster Framework
            </h2>
            {procurement ? (
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Clusters</dt>
                  <dd className="font-semibold text-white">{procurement.clusters}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Concrete volume</dt>
                  <dd className="font-semibold text-white">
                    {Number(procurement.volume).toLocaleString("th-TH", {
                      maximumFractionDigits: 2,
                    })} m³
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Saving target</dt>
                  <dd className="font-semibold text-emerald-300">
                    {baht(Number(procurement.target_saving))}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Award coverage</dt>
                  <dd className="font-semibold text-white">
                    {Number(procurement.coverage_pct).toFixed(1)}%
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Awarded saving</dt>
                  <dd className="font-semibold text-emerald-300">
                    {baht(Number(procurement.awarded_saving))}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm text-amber-200">
                Procurement API: {procurementResult.error}
              </p>
            )}
            <a
              href={PROCUREMENT_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-5 block rounded-2xl bg-emerald-400 px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              เปิด Procurement Control ↗
            </a>
          </article>

          <article className="rounded-3xl border border-sky-300/20 bg-sky-400/10 p-6">
            <p className="text-sm font-medium text-sky-200">CUSTOMER VIEW</p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Proposal ใช้ Cluster ชุดเดียวกับ PM
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              ลูกค้าเห็น Scope, Cluster, Volume, Procurement status และ Payment
              Model แต่ไม่เห็น Cost Base, Margin หรือ Supplier bid ภายใน
            </p>
            {customerProposal ? (
              <>
                <p className="mt-4 text-xs text-slate-400">
                  {customerProposal.proposal_no} • {customerProposal.version_no} • {customerProposal.status}
                </p>
                <a
                  href={customerProposal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block rounded-2xl border border-sky-300/20 bg-sky-400/10 px-4 py-3 text-center text-sm font-medium text-sky-100 transition hover:bg-sky-400/20"
                >
                  เปิด Customer Proposal ↗
                </a>
              </>
            ) : (
              <p className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                Customer Proposal link: {proposalLinkResult.error}
              </p>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
