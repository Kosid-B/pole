import Link from "next/link";
import { getProcurementRfqOverview, type ProcurementRfqBid } from "@/lib/supplier-sourcing";
import { saveRfqBidAction } from "./actions";

function number(value: number, digits = 0) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: digits }).format(value);
}

function baht(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusTone(status: string) {
  if (status === "confirmed") return "border-emerald-300/20 bg-emerald-400/10 text-emerald-200";
  if (status === "quoted") return "border-sky-300/20 bg-sky-400/10 text-sky-100";
  if (status === "rfq_sent") return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  if (status === "rejected") return "border-rose-300/20 bg-rose-400/10 text-rose-100";
  return "border-white/10 bg-white/5 text-slate-300";
}

function Field({ label, name, value, type = "text", step }: {
  label: string;
  name: string;
  value: string | number | null;
  type?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-slate-400">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={value ?? ""}
        className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/40"
      />
    </label>
  );
}

function BidForm({ bid }: { bid: ProcurementRfqBid }) {
  return (
    <form action={saveRfqBidAction} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <input type="hidden" name="cluster_id" value={bid.cluster_id} />
      <input type="hidden" name="supplier_slot" value={bid.supplier_slot} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-950">Supplier {bid.supplier_slot}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(bid.bid_status)}`}>
              {bid.bid_status}
            </span>
            {bid.award_ready ? (
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                AWARD DATA READY
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-sm text-slate-400">Server-calculated TDC</p>
          <p className="mt-1 text-xl font-semibold text-emerald-200">{baht(bid.effective_delivered_cost)} / m³</p>
        </div>
        <label className="min-w-40">
          <span className="text-[11px] font-medium text-slate-400">RFQ Status</span>
          <select
            name="bid_status"
            defaultValue={bid.bid_status || "draft"}
            className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
          >
            <option value="draft">Draft</option>
            <option value="rfq_sent">RFQ Sent</option>
            <option value="quoted">Quoted</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Supplier name" name="supplier_name" value={bid.supplier_name} />
        <Field label="Plant / Yard" name="plant_location" value={bid.plant_location} />
        <Field label="Quotation ref" name="quotation_ref" value={bid.quotation_ref} />
        <Field label="Valid until" name="valid_until" value={bid.valid_until} type="date" />
      </div>

      <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
        <Field label="Base / m³" name="base_rate" value={bid.base_rate} type="number" step="0.01" />
        <Field label="Freight / m³" name="freight_per_m3" value={bid.freight_per_m3} type="number" step="0.01" />
        <Field label="Pump / m³" name="pump_per_m3" value={bid.pump_per_m3} type="number" step="0.01" />
        <Field label="Waiting / m³" name="waiting_per_m3" value={bid.waiting_per_m3} type="number" step="0.01" />
        <Field label="Short-load / m³" name="short_load_per_m3" value={bid.short_load_per_m3} type="number" step="0.01" />
        <Field label="Cash discount" name="cash_discount_per_m3" value={bid.cash_discount_per_m3} type="number" step="0.01" />
        <Field label="Volume rebate" name="volume_rebate_per_m3" value={bid.volume_rebate_per_m3} type="number" step="0.01" />
        <Field label="Schedule discount" name="schedule_discount_per_m3" value={bid.schedule_discount_per_m3} type="number" step="0.01" />
        <Field label="Other adjustment" name="other_adjustment_per_m3" value={bid.other_adjustment_per_m3} type="number" step="0.01" />
        <Field label="Capacity m³/day" name="capacity_m3_day" value={bid.capacity_m3_day} type="number" step="0.01" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Lead time (days)" name="lead_time_days" value={bid.lead_time_days} type="number" step="1" />
        <Field label="Payment terms" name="payment_terms" value={bid.payment_terms} />
        <Field label="Note" name="note" value={bid.note} />
      </div>

      {bid.rfq_missing?.length ? (
        <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-400/10 p-3">
          <p className="text-xs font-semibold text-amber-100">ยังไม่พร้อม Confirm / Award</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {bid.rfq_missing.map((item) => (
              <span key={item} className="rounded-lg bg-slate-950/30 px-2 py-1 text-[11px] text-amber-50/90">{item}</span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          บันทึก RFQ / คำนวณ TDC ใหม่
        </button>
      </div>
    </form>
  );
}

export default async function ProcurementRfqPage() {
  const result = await getProcurementRfqOverview();

  if (!result.data) {
    return (
      <section className="space-y-6">
        <Link href="/pm/suppliers" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white">
          ← Supplier Sourcing
        </Link>
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50">
          <p className="font-semibold">RFQ Console ยังเชื่อมข้อมูลไม่ได้</p>
          <p className="mt-2 text-sm text-amber-50/80">{result.error}</p>
        </div>
      </section>
    );
  }

  const data = result.data;
  const s = data.summary;

  return (
    <section className="space-y-7 pb-12">
      <nav aria-label="RFQ navigation" className="flex flex-wrap gap-2">
        <Link href="/pm/suppliers" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white">
          ← Supplier Sourcing
        </Link>
        <Link href="/procurement" className="flex min-h-11 items-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 text-sm font-medium text-emerald-100">
          Procurement Control
        </Link>
        <Link href="/pm" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white">
          PM Control Center
        </Link>
      </nav>

      <header className="rounded-[2rem] border border-sky-300/15 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100">RFQ EXECUTION</span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">SERVER TDC</span>
          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">NO AUTO AWARD</span>
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">RFQ / Total Delivered Cost Console</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300 sm:text-base">
          บันทึก Supplier A/B/C ต่อ Cluster จากหลักฐานใบเสนอราคา แล้วให้ backend คำนวณ Total Delivered Cost ก่อนเข้าสู่ GM Gate และ Rolling Cash Gate
        </p>
        <p className="mt-3 text-xs leading-6 text-sky-100/70">{data.formula}</p>
      </header>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ["Clusters", s.clusters],
          ["Bid slots", s.bid_slots],
          ["RFQ sent", s.rfq_sent],
          ["Quoted", s.quoted],
          ["Confirmed", s.confirmed],
          ["Award-ready data", s.award_ready],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-semibold text-white">{String(value)}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-50/90">
        <strong className="text-amber-100">Guardrail:</strong> สถานะ Quoted ต้องมี Supplier, Base Rate, Quotation Ref และวันหมดอายุที่ยังใช้ได้ ส่วน Confirmed ต้องมี Capacity, Lead Time และ Payment Terms ครบ ระบบยังไม่ Award จากหน้านี้
      </div>

      <div className="space-y-4">
        {data.clusters.map((cluster, index) => (
          <details key={cluster.id} open={index < 3} className="group rounded-[1.7rem] border border-white/10 bg-white/5">
            <summary className="flex min-h-16 cursor-pointer list-none flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-sky-400 px-2.5 py-1 text-[11px] font-bold text-slate-950">{cluster.province}</span>
                  <span className="text-xs text-slate-400">{cluster.forecast_sites} จุด • {number(cluster.forecast_volume_m3, 2)} m³</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold text-white">{cluster.cluster_name}</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300">Benchmark {baht(cluster.benchmark_delivered_rate)}</span>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-200">Target {baht(cluster.target_rate)}</span>
                <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1.5 text-sky-100">{cluster.quoted_count} quoted</span>
              </div>
            </summary>

            <div className="space-y-4 border-t border-white/10 px-4 py-5 sm:px-6">
              {cluster.bids.map((bid) => <BidForm key={bid.id} bid={bid} />)}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
