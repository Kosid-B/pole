import Link from "next/link";
import {
  getCustomerProposalLink,
  getPmOverview,
  getProcurementOverview,
} from "@/lib/drying-yard-modules";

const GM_FLOOR_PCT = 32;

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
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
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
          <h1 className="mt-2 text-3xl font-semibold text-white">Project Management Module</h1>
        </div>
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50">
          <p className="font-semibold">PM module ยังเชื่อมข้อมูลไม่ได้</p>
          <p className="mt-2 text-sm text-amber-50/80">{pmResult.error}</p>
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
  const gmHeadroomPct = gmPct - GM_FLOOR_PCT;
  const advanceTarget = Number(settings?.advance_target_pct || 0);
  const procurementCoverage = Number(procurement?.coverage_pct || 0);
  const committedPct = pm.totals.cost > 0 ? (committed / pm.totals.cost) * 100 : 0;

  const gmTone = gmPct >= GM_FLOOR_PCT ? "green" : gmPct >= 31 ? "amber" : "red";
  const procurementTone =
    procurementCoverage >= 70 ? "green" : procurementCoverage >= 30 ? "amber" : "red";
  const advanceTone = advanceTarget >= 20 ? "green" : advanceTarget >= 15 ? "amber" : "red";

  const nextAction =
    gmPct < GM_FLOOR_PCT
      ? "HOLD: Forecast GM ต่ำกว่า 32% — ห้ามปล่อย PO/Batch ใหม่จนแก้ EAC หรือราคาขาย"
      : procurementCoverage < 50
        ? "เร่ง RFQ / Confirm Supplier ใน Cluster ปริมาณสูงก่อนเปิด Commitment ใหม่"
        : "รักษา GM 32% + Cash Safety Reserve และเปิด Batch ตามเงินรับจริง";

  return (
    <section className="space-y-8 pb-10">
      <nav
        aria-label="SiteCost PM navigation"
        className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/60 p-1.5 sm:grid-cols-4"
      >
        <Link
          href="/commercial"
          className="flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          Commercial
        </Link>
        <Link
          href="/pm"
          aria-current="page"
          className="flex min-h-12 items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950"
        >
          PM Control
        </Link>
        <Link
          href="/pm/financial"
          className="flex min-h-12 items-center justify-center rounded-xl border border-sky-300/15 bg-sky-400/10 px-4 text-sm font-medium text-sky-100"
        >
          Financial Control
        </Link>
        <Link
          href="/pm/suppliers"
          className="flex min-h-12 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-400/10 px-4 text-sm font-medium text-violet-100"
        >
          Supplier Sourcing
        </Link>
      </nav>

      <header className="rounded-[2rem] border border-emerald-300/10 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 p-6 shadow-xl shadow-slate-950/20 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            ADMIN = PM
          </span>
          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">
            GM FLOOR 32%
          </span>
          <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100">
            ROLLING CASH GATE
          </span>
        </div>

        <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              PM Control Center
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300 sm:text-base">
              PM ปรับ Advance, Claim Cycle, Batch Size, Supplier Terms และ Procurement Structure ได้
              แต่ทุกการปรับต้องแสดง Trigger และต้องผ่านสองเงื่อนไขพร้อมกัน: Forecast GM ไม่ต่ำกว่า 32%
              และ Rolling Cash ไม่ต่ำกว่า PM Safety Reserve
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:w-[430px]">
            <Link
              href="/pm/financial"
              className="flex min-h-12 items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              เปิด Cash / Advance Model
            </Link>
            <Link
              href="/pm/suppliers"
              className="flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
            >
              ค้นหา / RFQ Supplier
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="BAC / Cost Base" value={million(pm.totals.cost)} />
        <Kpi label="Contract Value ก่อน VAT" value={million(pm.totals.sale)} />
        <Kpi
          label="Forecast GM"
          value={`${gmPct.toFixed(2)}%`}
          detail={`Floor ${GM_FLOOR_PCT}% • Headroom ${gmHeadroomPct.toFixed(2)} pp`}
          emphasis
        />
        <Kpi
          label="Gross Profit"
          value={million(pm.totals.gp)}
          detail="ราคาขายคงที่ → Cost delta กระทบ GP โดยตรง"
        />
        <Kpi
          label="Advance Target"
          value={`${advanceTarget.toFixed(0)}%`}
          detail={settings?.contract_mode || "unknown contract mode"}
        />
      </div>

      <section id="decision-gates" className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-300">PM DECISION GATES</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">ก่อนอนุมัติ Batch / PO / Supplier Award</h2>
          </div>
          <span className="w-fit rounded-full border border-white/10 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-300">
            Scan → diagnose → decide
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Gate
            label="GM Gate"
            value={`${gmPct.toFixed(2)}%`}
            detail={
              gmPct >= GM_FLOOR_PCT
                ? `PASS • เหนือ Floor ${GM_FLOOR_PCT}%`
                : `HOLD • ต่ำกว่า Floor ${GM_FLOOR_PCT}%`
            }
            tone={gmTone}
          />
          <Gate
            label="Advance / Cash Gate"
            value={`${advanceTarget.toFixed(0)}% Advance`}
            detail={`Client cash lag ${Number(settings?.client_payment_lag_days || 0)} วัน • ต้องตรวจ Rolling Cash`}
            tone={advanceTone}
          />
          <Gate
            label="Procurement Gate"
            value={`${procurementCoverage.toFixed(1)}% awarded`}
            detail={`${procurement?.awarded_clusters || 0}/${procurement?.clusters || 0} province clusters`}
            tone={procurementTone}
          />
          <Gate
            label="Commitment Gate"
            value={`${committedPct.toFixed(1)}% BAC`}
            detail={`Committed ${million(committed)} • Paid ${million(paid)}`}
            tone="blue"
          />
        </div>

        <div
          className={`mt-5 rounded-2xl border p-4 sm:flex sm:items-center sm:justify-between sm:gap-5 ${
            gmPct >= GM_FLOOR_PCT
              ? "border-emerald-300/20 bg-emerald-400/10"
              : "border-rose-300/25 bg-rose-400/10"
          }`}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
              Triggered recommendation
            </p>
            <p className="mt-1 text-base font-semibold text-white">{nextAction}</p>
          </div>
          <Link
            href={gmPct < GM_FLOOR_PCT ? "/pm/financial" : "/pm/suppliers"}
            className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 sm:mt-0"
          >
            {gmPct < GM_FLOOR_PCT ? "แก้ Financial Structure" : "ตรวจ Supplier Terms"}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Customer Days-to-Cash"
          value={`${Number(settings?.client_payment_lag_days || 0)} วัน`}
          detail={`Claim cycle ${Number(settings?.claim_cycle_days || 0)} วัน`}
        />
        <Kpi
          label="Supplier Credit Default"
          value={`${Number(settings?.supplier_credit_days_default || 0)} วัน`}
          detail="ใช้ 0 วันจนกว่า RFQ/PO ยืนยัน"
        />
        <Kpi
          label="Batch Control"
          value={`${Number(settings?.batch_size_sites || 0)} จุด`}
          detail={`เปิด Batch ทุก ${Number(settings?.batch_start_interval_days || 0)} วัน`}
        />
        <Kpi
          label="Safety Cash Reserve"
          value={`${Number(settings?.safety_buffer_pct || 0)}% BAC`}
          detail={`Retention ${Number(settings?.retention_pct || 0)}%`}
        />
      </section>

      <details open className="group rounded-3xl border border-white/10 bg-white/5">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-medium text-emerald-300">SUPPLIER / PO COMMITMENT</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Work Package cash commitments</h2>
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
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead className="text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="px-3 py-3">Work Package</th>
                  <th className="px-3 py-3 text-right">Budget</th>
                  <th className="px-3 py-3">Supplier / PO</th>
                  <th className="px-3 py-3 text-right">Credit</th>
                  <th className="px-3 py-3 text-right">Deposit</th>
                  <th className="px-3 py-3 text-right">Committed</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {pm.packages.map((item) => (
                  <tr key={item.package_code} className="border-b border-white/5 text-slate-300">
                    <td className="px-3 py-3 font-medium text-white">
                      {item.package_name}
                      <span className="mt-1 block text-xs text-slate-500">Work week {item.planned_work_week}</span>
                    </td>
                    <td className="px-3 py-3 text-right">{baht(Number(item.budget_amount))}</td>
                    <td className="px-3 py-3">
                      {item.supplier_name || "ยังไม่ยืนยัน"}
                      {item.po_no ? <span className="mt-1 block text-xs text-slate-500">PO {item.po_no}</span> : null}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {item.supplier_credit_days == null
                        ? `${Number(settings?.supplier_credit_days_default || 0)} วัน*`
                        : `${item.supplier_credit_days} วัน`}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {item.deposit_pct == null ? "-" : `${item.deposit_pct}%`}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {baht(Number(item.actual_committed_amount || 0))}
                    </td>
                    <td className="px-3 py-3">{item.status || "planning"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs leading-6 text-slate-500">
            * Supplier Credit Default เป็น planning assumption เท่านั้น จนกว่า RFQ / Quotation / PO จะยืนยันจริง
          </p>
        </div>
      </details>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[2rem] border border-violet-300/15 bg-gradient-to-br from-violet-950/60 to-slate-950 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-violet-200">SUPPLIER SOURCING</p>
              <h2 className="mt-1 text-xl font-semibold text-white">8 Procurement Zones / RFQ Directory</h2>
            </div>
            <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs text-violet-100">
              INTERNAL
            </span>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Candidate จากการค้นหาสาธารณะต้องผ่าน RFQ เพื่อยืนยันราคา, COD/Credit, Deposit,
            Capacity, Lead Time และ Total Delivered Cost ก่อน Promote เป็น Supplier A/B/C
          </p>
          <Link
            href="/pm/suppliers"
            className="mt-5 flex min-h-12 items-center justify-center rounded-2xl bg-violet-300 px-5 text-sm font-semibold text-slate-950"
          >
            เปิด Supplier Sourcing →
          </Link>
        </article>

        <article className="rounded-[2rem] border border-emerald-300/15 bg-gradient-to-br from-emerald-950/70 to-slate-950 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-300">PROCUREMENT FRAMEWORK</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Province Cluster / Bid / Award</h2>
            </div>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
              TDC BASIS
            </span>
          </div>

          {procurement ? (
            <div className="mt-5 grid gap-3 grid-cols-2">
              <Kpi label="Province clusters" value={`${procurement.clusters}`} detail={`${procurement.sites} sites`} />
              <Kpi
                label="Concrete Volume"
                value={`${Number(procurement.volume).toLocaleString("th-TH", { maximumFractionDigits: 0 })} m³`}
                detail="Forecast call-off volume"
              />
              <Kpi label="Saving Target" value={baht(Number(procurement.target_saving))} />
              <Kpi
                label="Award Coverage"
                value={`${Number(procurement.coverage_pct).toFixed(1)}%`}
                detail={`${procurement.awarded_clusters} clusters awarded`}
              />
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
              Procurement API: {procurementResult.error}
            </p>
          )}

          <Link
            href="/procurement"
            className="mt-5 flex min-h-12 items-center justify-center rounded-2xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950"
          >
            เปิด Procurement Control →
          </Link>
        </article>
      </section>

      <section className="rounded-[2rem] border border-sky-300/20 bg-sky-400/10 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-200">CUSTOMER VIEW</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Proposal แยก Internal Cost / Supplier Bid ออกจากลูกค้า</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
              ลูกค้าเห็น Scope, Cluster, Volume, Progress และ Payment Model แต่ไม่เห็น Cost Base,
              Margin, Supplier bid, internal saving target หรือ PM financing assumptions
            </p>
          </div>
          {customerProposal ? (
            <a
              href={customerProposal.url}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-sky-300 px-5 text-sm font-semibold text-slate-950"
            >
              เปิด Customer Proposal ↗
            </a>
          ) : (
            <span className="text-sm text-amber-100">{proposalLinkResult.error}</span>
          )}
        </div>
      </section>
    </section>
  );
}
