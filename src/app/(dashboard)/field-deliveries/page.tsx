import { randomUUID } from "node:crypto";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getDeliveryOverview, type DeliveryCalloff, type DeliveryRole } from "@/lib/delivery-control";
import { submitDeliveryAction } from "./actions";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function number(value: number | null | undefined, digits = 0) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: digits }).format(Number(value || 0));
}

function local(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

function DeliveryForm({ calloff }: { calloff: DeliveryCalloff }) {
  const locked = calloff.status !== "confirmed";
  return (
    <article className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-300 px-2.5 py-1 text-[11px] font-bold text-slate-950">{calloff.calloff_ref}</span>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">{calloff.batch_code} • {calloff.site_code}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${locked ? "border-slate-300/20 bg-slate-400/10 text-slate-200" : "border-amber-300/20 bg-amber-400/10 text-amber-100"}`}>{calloff.status.toUpperCase()}</span>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-white">{calloff.supplier_name} • {calloff.supplier_role.toUpperCase()}</h2>
          <p className="mt-1 text-xs text-slate-400">{calloff.district || "-"}, {calloff.province} • Planned {local(calloff.planned_delivery_at)}</p>
        </div>
        <div className="text-xs text-slate-400 sm:text-right">
          <p>Requested <strong className="text-white">{number(calloff.requested_m3, 2)} m³</strong></p>
          <p className="mt-1">PM Verified <strong className="text-emerald-200">{number(calloff.verified_accepted_m3, 2)} m³</strong></p>
        </div>
      </div>

      <form action={submitDeliveryAction} className="mt-4 rounded-xl border border-white/10 bg-slate-950/30 p-4">
        <input type="hidden" name="request_id" value={randomUUID()} />
        <input type="hidden" name="calloff_id" value={calloff.id} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs text-slate-300">DO / Delivery Ticket Ref
            <input name="do_ref" required disabled={locked} placeholder="เลข DO จริง" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white disabled:opacity-40" />
          </label>
          <label className="text-xs text-slate-300">Truck No.
            <input name="truck_no" disabled={locked} placeholder="ทะเบียน/เลขรถ" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white disabled:opacity-40" />
          </label>
          <label className="text-xs text-slate-300">Delivered m³
            <input name="delivered_m3" type="number" min="0.01" step="0.01" required disabled={locked} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white disabled:opacity-40" />
          </label>
          <label className="text-xs text-slate-300">Accepted m³
            <input name="accepted_m3" type="number" min="0" step="0.01" required disabled={locked} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white disabled:opacity-40" />
          </label>
          <label className="text-xs text-slate-300">Rejected m³
            <input name="rejected_m3" type="number" min="0" step="0.01" required defaultValue="0" disabled={locked} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white disabled:opacity-40" />
          </label>
          <label className="text-xs text-slate-300">Slump mm
            <input name="slump_mm" type="number" min="0" step="1" disabled={locked} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white disabled:opacity-40" />
          </label>
          <label className="text-xs text-slate-300">Concrete Temp °C
            <input name="concrete_temp_c" type="number" step="0.1" disabled={locked} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white disabled:opacity-40" />
          </label>
          <label className="text-xs text-slate-300">Cube Sample Ref
            <input name="cube_sample_ref" disabled={locked} placeholder="ถ้ามี" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white disabled:opacity-40" />
          </label>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input name="evidence_ref" required disabled={locked} placeholder="Photo / DO / QA Evidence ref" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white disabled:opacity-40" />
          <input name="note" disabled={locked} placeholder="หมายเหตุหน้างาน/Reject reason" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white disabled:opacity-40" />
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-400">Delivered ต้องเท่ากับ Accepted + Rejected ภายใน 0.01 m³ และ Actual จะยังไม่ถูกนับจน PM Accept</p>
          <button disabled={locked} className="min-h-11 rounded-xl bg-emerald-300 px-5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">ส่ง Delivery Receipt</button>
        </div>
      </form>

      <details className="mt-4 rounded-xl border border-white/10 bg-slate-950/30">
        <summary className="cursor-pointer p-3 text-sm font-medium text-white">ประวัติ DO ({calloff.receipts.length}) • Pending PM {calloff.pending_review}</summary>
        <div className="space-y-2 border-t border-white/10 p-3">
          {calloff.receipts.length === 0 ? <p className="text-xs text-slate-500">ยังไม่มี Delivery Receipt</p> : null}
          {calloff.receipts.map((receipt) => (
            <div key={receipt.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><strong className="text-white">DO {receipt.do_ref}</strong><span>{local(receipt.submitted_at)}</span></div>
              <p className="mt-1">Delivered {number(receipt.delivered_m3,2)} • Accepted {number(receipt.accepted_m3,2)} • Rejected {number(receipt.rejected_m3,2)} m³ • QA {receipt.qa_status.toUpperCase()}</p>
              <p className="mt-1">Evidence {receipt.evidence_ref} • PM {receipt.review ? receipt.review.decision.toUpperCase() : "PENDING"}</p>
            </div>
          ))}
        </div>
      </details>
    </article>
  );
}

export default async function FieldDeliveriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireSession();
  const role = session.user.role as DeliveryRole;
  const [params, result] = await Promise.all([searchParams, getDeliveryOverview(role)]);
  if (!result.data) {
    return <section className="space-y-6"><Link href="/field-reports" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white">← Field Reports</Link><div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50"><h1 className="text-2xl font-semibold">Field Delivery ยังเชื่อมข้อมูลไม่ได้</h1><p className="mt-2 text-sm">{result.error}</p></div></section>;
  }

  const data = result.data;
  const error = first(params.error);
  const openCalloffs = data.calloffs.filter((calloff) => calloff.status === "confirmed");
  const closedCalloffs = data.calloffs.filter((calloff) => calloff.status !== "confirmed");
  return (
    <section className="space-y-7 pb-12">
      <nav className="flex flex-wrap gap-2" aria-label="Field delivery navigation"><Link href="/field-reports" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white">← Field Reports</Link><Link href="/field-readiness" className="flex min-h-11 items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 text-sm text-cyan-100">Field Readiness</Link>{role !== "FIELD_LEADER" ? <Link href="/pm/calloffs" className="flex min-h-11 items-center rounded-xl border border-violet-300/20 bg-violet-400/10 px-4 text-sm text-violet-100">PM Call-off</Link> : null}</nav>
      <header className="rounded-[2rem] border border-emerald-300/15 bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-950 p-6 sm:p-8"><div className="flex flex-wrap gap-2"><span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">DO / QA EVIDENCE</span><span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">PM VERIFY REQUIRED</span><span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-100">NO PRICE / NO PAYMENT DATA</span></div><h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Field Delivery Receipt</h1><p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">บันทึกเฉพาะ Call-off ที่ PM เปิดจาก Released Batch แล้ว หน้างานส่ง DO/QA/Evidence ได้ แต่ Verified Actual Quantity จะเกิดเมื่อ ADMIN/EXECUTIVE ตรวจและ Accept เท่านั้น</p></header>
      {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">{decodeURIComponent(error)}</div> : null}
      {first(params.submitted) === "success" ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">Delivery Receipt ส่งแล้ว รอ PM Verify</div> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Open Call-offs",data.summary.open_calloffs],["Pending PM",data.summary.pending_reviews],["Verified Accepted",`${number(data.summary.verified_accepted_m3,2)} m³`],["Verified Rejected",`${number(data.summary.verified_rejected_m3,2)} m³`]].map(([label,value]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{String(value)}</p></div>)}</div>
      <section className="space-y-3"><h2 className="text-xl font-semibold text-white">Open Call-offs</h2>{openCalloffs.length ? openCalloffs.map((calloff) => <DeliveryForm key={calloff.id} calloff={calloff} />) : <div className="rounded-2xl border border-amber-300/15 bg-amber-400/10 p-5 text-sm text-amber-50">ยังไม่มี Call-off ที่เปิดให้รับ Delivery ระบบไม่อนุญาตบันทึก DO ก่อน PM เปิด Call-off</div>}</section>
      {closedCalloffs.length ? <details className="rounded-2xl border border-white/10 bg-white/5"><summary className="cursor-pointer p-4 text-sm font-medium text-white">Closed Call-offs ({closedCalloffs.length})</summary><div className="space-y-2 border-t border-white/10 p-4">{closedCalloffs.map((calloff) => <div key={calloff.id} className="rounded-xl border border-white/10 bg-slate-950/30 p-3 text-xs text-slate-300">{calloff.calloff_ref} • {calloff.site_code} • {calloff.status.toUpperCase()} • Verified {number(calloff.verified_accepted_m3,2)} m³</div>)}</div></details> : null}
    </section>
  );
}
