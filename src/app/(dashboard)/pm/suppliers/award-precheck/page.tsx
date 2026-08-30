import Link from "next/link";
import { buildAwardPrecheck } from "@/lib/award-precheck";
import { getPmFinancialGuardrail } from "@/lib/pm-financial-guardrail";
import { getProcurementRfqOverview } from "@/lib/supplier-sourcing";

function baht(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function number(value: number, digits = 0) {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: digits,
  }).format(value);
}

function pct(value: number, digits = 2) {
  return `${(value * 100).toFixed(digits)}%`;
}

function Gate({
  label,
  pass,
  value,
  detail,
}: {
  label: string;
  pass: boolean;
  value: string;
  detail: string;
}) {
  return (
    <article
      className={`rounded-2xl border p-4 ${
        pass
          ? "border-emerald-300/20 bg-emerald-400/10"
          : "border-rose-300/20 bg-rose-400/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
          {label}
        </p>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            pass
              ? "bg-emerald-300/15 text-emerald-100"
              : "bg-rose-300/15 text-rose-100"
          }`}
        >
          {pass ? "PASS" : "BLOCK"}
        </span>
      </div>
      <p className="mt-3 text-xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
    </article>
  );
}

export default async function AwardPrecheckPage() {
  const [rfqResult, financialResult] = await Promise.all([
    getProcurementRfqOverview(),
    getPmFinancialGuardrail(),
  ]);

  if (!rfqResult.data || !financialResult.data) {
    return (
      <section className="space-y-6">
        <Link
          href="/pm/suppliers/rfq"
          className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white"
        >
          ← RFQ Console
        </Link>
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50">
          <h1 className="text-2xl font-semibold">Award Pre-check ยังเชื่อมข้อมูลไม่ได้</h1>
          <p className="mt-2 text-sm leading-6 text-amber-50/80">
            {rfqResult.error || financialResult.error}
          </p>
        </div>
      </section>
    );
  }

  const precheck = buildAwardPrecheck(rfqResult.data, financialResult.data);
  const s = precheck.summary;

  return (
    <section className="space-y-7 pb-12">
      <nav aria-label="Award pre-check navigation" className="flex flex-wrap gap-2">
        <Link href="/pm/suppliers/rfq" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white">
          ← RFQ Console
        </Link>
        <Link href="/pm/financial" className="flex min-h-11 items-center rounded-xl border border-sky-300/20 bg-sky-400/10 px-4 text-sm font-medium text-sky-100">
          Financial Guardrail
        </Link>
        <Link href="/procurement" className="flex min-h-11 items-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 text-sm font-medium text-emerald-100">
          Procurement Control
        </Link>
      </nav>

      <header className="rounded-[2rem] border border-violet-300/15 bg-gradient-to-br from-slate-900 via-violet-950 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-100">
            AWARD PRE-CHECK
          </span>
          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">
            NO AUTO AWARD
          </span>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${precheck.pass ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100" : "border-rose-300/20 bg-rose-400/10 text-rose-100"}`}>
            {precheck.status}
          </span>
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Primary / Backup Award Pre-check
        </h1>
        <p className="mt-3 max-w-5xl text-sm leading-7 text-slate-300 sm:text-base">
          หน้านี้เป็น Read-only decision gate ก่อนทำ Framework Agreement: เปรียบเทียบเฉพาะ RFQ ที่ Confirmed และข้อมูลครบ แล้วตรวจ GM, Rolling Cash และ Customer Funding ก่อนส่งให้ผู้มีอำนาจอนุมัติ Supplier Primary / Backup ด้วยคน
        </p>
        <p className="mt-3 text-xs leading-6 text-violet-100/70">{precheck.rule}</p>
      </header>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 xl:grid-cols-8">
        {[
          ["Clusters", s.clusters],
          ["Primary + Backup ready", s.clusters_with_primary_backup],
          ["Award-ready bids", s.award_ready_bids],
          ["Forecast GM", pct(s.forecast_gm)],
          ["GM floor", pct(s.target_gm)],
          ["Min rolling cash", baht(s.min_cash)],
          ["Safety reserve", baht(s.safety_reserve)],
          ["Confirmed funding", `${number(s.confirmed_customer_direct_funding_pct, 1)}%`],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">{label}</p>
            <p className="mt-2 text-lg font-semibold text-white">{String(value)}</p>
          </article>
        ))}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Gate
          label="Supplier Pair"
          pass={precheck.gates.supplier_pair}
          value={`${s.clusters_with_primary_backup}/${s.clusters} clusters`}
          detail="แต่ละ Cluster ต้องมี Award-ready อย่างน้อย 2 รายเพื่อเป็น Primary + Backup candidate"
        />
        <Gate
          label="GM"
          pass={precheck.gates.gm}
          value={pct(s.forecast_gm)}
          detail="Forecast Gross Margin หลังต้นทุน/commitment ต้องไม่ต่ำกว่า 32.00%"
        />
        <Gate
          label="Rolling Cash"
          pass={precheck.gates.rolling_cash}
          value={baht(s.min_cash)}
          detail={`Safety Reserve ${baht(s.safety_reserve)} • Funding gap ${baht(s.funding_gap)}`}
        />
        <Gate
          label="Customer Funding"
          pass={precheck.gates.customer_funding}
          value={`${number(s.confirmed_customer_direct_funding_pct, 1)}%`}
          detail="นับเฉพาะ Customer Direct Pay / Material Advance ที่ Active, Approved หรือ Confirmed ในโมเดลการเงิน"
        />
        <Gate
          label="Framework Gate"
          pass={precheck.gates.framework_activation}
          value={precheck.gates.framework_activation ? "READY" : "BLOCKED"}
          detail="Framework Agreement ยังไม่ควร Active จนกว่า Supplier + GM + Cash + Funding ผ่านพร้อมกัน"
        />
      </section>

      {precheck.blockers.length ? (
        <section className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-5">
          <p className="text-sm font-semibold text-rose-100">Current blockers</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-rose-50/85">
            {precheck.blockers.map((blocker) => (
              <li key={blocker}>• {blocker}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-200">Cluster review</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Primary / Backup Candidates by TDC</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            ลำดับด้านล่างเป็นข้อมูลประกอบการอนุมัติเท่านั้น ไม่ได้เขียน Award ลงฐานข้อมูล และไม่เปลี่ยน Framework Agreement อัตโนมัติ
          </p>
        </div>

        {precheck.clusters.map((cluster) => (
          <article key={cluster.cluster_id} className="rounded-[1.7rem] border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-violet-400 px-2.5 py-1 text-[11px] font-bold text-slate-950">{cluster.province}</span>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cluster.supplier_gate_pass ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100" : "border-rose-300/20 bg-rose-400/10 text-rose-100"}`}>
                    {cluster.supplier_gate_pass ? "PAIR READY" : "PAIR BLOCKED"}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">{cluster.cluster_name}</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {cluster.forecast_sites} จุด • {number(cluster.forecast_volume_m3, 2)} m³ • Target {baht(cluster.target_rate)} / m³
                </p>
              </div>
              <div className="text-sm text-slate-300 sm:text-right">
                <p>{cluster.award_ready_candidates} award-ready</p>
                <p className="mt-1 text-xs text-slate-500">{cluster.confirmed_candidates} confirmed RFQ</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                ["Primary candidate", cluster.primary_candidate],
                ["Backup candidate", cluster.backup_candidate],
              ].map(([label, candidate]) => (
                <div key={String(label)} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{String(label)}</p>
                  {candidate && typeof candidate === "object" ? (
                    <>
                      <p className="mt-2 text-lg font-semibold text-white">{candidate.supplier_name}</p>
                      <p className="mt-1 text-xl font-semibold text-emerald-200">{baht(candidate.tdc_per_m3)} / m³</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <p>Capacity <strong className="text-slate-200">{number(candidate.capacity_m3_day, 1)} m³/day</strong></p>
                        <p>Lead <strong className="text-slate-200">{candidate.lead_time_days} days</strong></p>
                        <p>Quote <strong className="text-slate-200">{candidate.quotation_ref}</strong></p>
                        <p>Valid <strong className="text-slate-200">{candidate.valid_until}</strong></p>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-slate-400">Payment: {candidate.payment_terms}</p>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-rose-200">ยังไม่มี candidate ที่ผ่าน RFQ readiness</p>
                  )}
                </div>
              ))}
            </div>

            {cluster.candidate_spread_per_m3 != null ? (
              <p className="mt-3 text-xs text-slate-400">
                Backup spread จาก Primary: {baht(cluster.candidate_spread_per_m3)} / m³
              </p>
            ) : null}

            {cluster.blockers.length ? (
              <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-400/10 p-3 text-xs leading-5 text-amber-50/90">
                {cluster.blockers.join(" • ")}
              </div>
            ) : null}
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-sky-300/15 bg-sky-400/10 p-5 text-sm leading-6 text-sky-50/85">
        <strong className="text-sky-100">Next control:</strong> เมื่อ Pre-check ผ่าน ระบบจึงควรเปิดขั้น Manual Award Approval เพื่อเลือก Primary/Backup และค่อย Activate Framework Agreement / Rolling Batch Funding โดยบันทึกผู้อนุมัติ เวลา เหตุผล และ snapshot ของ TDC/GM/Cash ณ ตอนอนุมัติ
      </section>
    </section>
  );
}
