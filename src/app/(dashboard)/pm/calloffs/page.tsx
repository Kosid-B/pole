import { randomUUID } from "node:crypto";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getDeliveryOverview, type DeliveryCalloff, type EligibleCalloffSite } from "@/lib/delivery-control";
import { closeCalloffAction, createCalloffAction, reviewDeliveryAction } from "./actions";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function number(value: number | null | undefined, digits = 0) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: digits }).format(Number(value || 0));
}

function baht(value: number | null | undefined) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function local(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

function SiteCalloffForm({ site }: { site: EligibleCalloffSite }) {
  return (
    <details className="rounded-2xl border border-white/10 bg-white/5">
      <summary className="cursor-pointer list-none p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-cyan-300 px-2.5 py-1 text-[11px] font-bold text-slate-950">{site.site_code}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white">{site.batch_code}</span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">RELEASED</span>
            </div>
            <p className="mt-2 text-sm font-medium text-white">{site.district || "-"} • {site.province}</p>
          </div>
          <div className="text-xs text-slate-400 sm:text-right">
            <p>Verified {number(site.confirmed_concrete_m3, 2)} m³</p>
            <p className="mt-1">Remaining <strong className="text-cyan-200">{number(site.remaining_m3, 2)} m³</strong></p>
          </div>
        </div>
      </summary>

      <form action={createCalloffAction} className="border-t border-white/10 p-4 sm:p-5">
        <input type="hidden" name="request_id" value={randomUUID()} />
        <input type="hidden" name="batch_id" value={site.batch_id} />
        <input type="hidden" name="site_id" value={site.site_id} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs text-slate-300">Supplier
            <select name="supplier_bid_id" required className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white">
              <option value="">เลือก Primary / Backup</option>
              {site.suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.role.toUpperCase()} • {supplier.supplier_name} • TDC {number(supplier.tdc_per_m3, 2)} /m³
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-300">Call-off Ref
            <input name="calloff_ref" required placeholder="เลขอ้างอิงจริงจาก PM/ผู้ขาย" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </label>
          <label className="text-xs text-slate-300">Requested m³
            <input name="requested_m3" type="number" min="0.01" max={site.remaining_m3} step="0.01" required defaultValue={site.remaining_m3.toFixed(2)} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </label>
          <label className="text-xs text-slate-300">Planned Delivery (Bangkok)
            <input name="planned_delivery_at" type="datetime-local" required className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </label>
        </div>

        <div className="mt-3 rounded-xl border border-cyan-300/15 bg-cyan-400/10 p-3 text-xs leading-5 text-cyan-50/80">
          Framework {site.framework.agreement_no} • Notice {site.framework.calloff_notice_hours}h • Effective {site.framework.effective_from || "-"} → {site.framework.effective_to || "open"} • Reserved/Actual {number(site.reserved_or_verified_actual_m3, 2)} m³
        </div>
        <textarea name="reason" required minLength={8} placeholder="เหตุผล/แผน Pour/เหตุผลเลือก Supplier (อย่างน้อย 8 ตัวอักษร)" className="mt-3 min-h-24 w-full rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm text-white" />
        <label className="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/30 p-3 text-xs leading-5 text-slate-200">
          <input type="checkbox" name="confirmation" value="yes" required className="mt-1 h-4 w-4" />
          <span>ยืนยันว่า Batch ถูก Release แล้ว, Supplier เป็น Primary/Backup ใน Active Framework, Quote/Delivery date ยัง valid และ Call-off นี้ไม่ใช่ PO/Payment approval อัตโนมัติ</span>
        </label>
        <button className="mt-3 min-h-11 rounded-xl bg-cyan-300 px-5 text-sm font-semibold text-slate-950">ยืนยัน Manual Call-off</button>
      </form>
    </details>
  );
}

function CalloffCard({ calloff }: { calloff: DeliveryCalloff }) {
  const open = calloff.status === "confirmed";
  return (
    <article className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-violet-300 px-2.5 py-1 text-[11px] font-bold text-slate-950">{calloff.calloff_ref}</span>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">{calloff.batch_code} • {calloff.site_code}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${open ? "border-amber-300/20 bg-amber-400/10 text-amber-100" : "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"}`}>{calloff.status.toUpperCase()}</span>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-white">{calloff.supplier_name} • {calloff.supplier_role.toUpperCase()}</h2>
          <p className="mt-1 text-xs text-slate-400">{calloff.district || "-"}, {calloff.province} • Delivery {local(calloff.planned_delivery_at)}</p>
        </div>
        <div className="text-xs text-slate-400 xl:text-right">
          <p>Requested <strong className="text-white">{number(calloff.requested_m3, 2)} m³</strong></p>
          <p className="mt-1">TDC <strong className="text-white">{baht(calloff.tdc_per_m3_snapshot)}</strong>/m³</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/10 p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-emerald-200/70">Verified Accepted</p><p className="mt-1 text-lg font-semibold text-white">{number(calloff.verified_accepted_m3, 2)} m³</p></div>
        <div className="rounded-xl border border-rose-300/15 bg-rose-400/10 p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-rose-200/70">Verified Rejected</p><p className="mt-1 text-lg font-semibold text-white">{number(calloff.verified_rejected_m3, 2)} m³</p></div>
        <div className="rounded-xl border border-amber-300/15 bg-amber-400/10 p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-amber-200/70">Pending Review</p><p className="mt-1 text-lg font-semibold text-white">{calloff.pending_review}</p></div>
      </div>

      <details className="mt-4 rounded-xl border border-white/10 bg-slate-950/30">
        <summary className="cursor-pointer p-3 text-sm font-medium text-white">Delivery receipts ({calloff.receipts.length})</summary>
        <div className="space-y-3 border-t border-white/10 p-3">
          {calloff.receipts.length === 0 ? <p className="text-xs text-slate-500">ยังไม่มี DO จากหน้างาน</p> : null}
          {calloff.receipts.map((receipt) => (
            <div key={receipt.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="text-sm font-semibold text-white">DO {receipt.do_ref} • {receipt.qa_status.toUpperCase()}</p><p className="mt-1 text-xs text-slate-400">Truck {receipt.truck_no || "-"} • Evidence {receipt.evidence_ref}</p></div>
                <div className="text-xs text-slate-400 sm:text-right">Delivered {number(receipt.delivered_m3,2)} • Accepted {number(receipt.accepted_m3,2)} • Rejected {number(receipt.rejected_m3,2)} m³</div>
              </div>
              {receipt.review ? (
                <div className={`mt-3 rounded-lg border p-2 text-xs ${receipt.review.decision === "accepted" ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100" : "border-rose-300/20 bg-rose-400/10 text-rose-100"}`}>PM {receipt.review.decision.toUpperCase()} • {receipt.review.review_reason}</div>
              ) : (
                <form action={reviewDeliveryAction} className="mt-3 rounded-xl border border-amber-300/15 bg-amber-400/10 p-3">
                  <input type="hidden" name="request_id" value={randomUUID()} />
                  <input type="hidden" name="submission_id" value={receipt.id} />
                  <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
                    <select name="decision" required defaultValue="accepted" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white"><option value="accepted">Accept receipt</option><option value="rejected">Reject receipt</option></select>
                    <input name="review_reason" minLength={8} required placeholder="เหตุผลตรวจรับอย่างน้อย 8 ตัวอักษร" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
                  </div>
                  <label className="mt-2 flex items-start gap-2 text-xs text-amber-50/80"><input type="checkbox" name="confirmation" value="yes" required className="mt-1" />ยืนยันว่าตรวจ DO/QA/Evidence แล้ว ปริมาณ Actual จะนับเฉพาะ Receipt ที่ Accept</label>
                  <button className="mt-2 min-h-10 rounded-lg bg-amber-300 px-4 text-xs font-semibold text-slate-950">บันทึก PM Review</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </details>

      {open ? (
        <form action={closeCalloffAction} className="mt-4 rounded-xl border border-white/10 bg-slate-950/30 p-3">
          <input type="hidden" name="request_id" value={randomUUID()} />
          <input type="hidden" name="calloff_id" value={calloff.id} />
          <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
            <select name="status" required defaultValue="completed" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white"><option value="completed">Complete Call-off</option><option value="cancelled">Cancel Call-off</option></select>
            <input name="reason" required minLength={8} placeholder="เหตุผลปิด/ยกเลิก Call-off" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </div>
          <label className="mt-2 flex items-start gap-2 text-xs text-slate-400"><input type="checkbox" name="confirmation" value="yes" required className="mt-1" />ยืนยันว่าปิดงานหลังตรวจ Receipt ที่ค้างทั้งหมดแล้ว ระบบจะใช้ Verified Accepted Actual ใน remaining quantity</label>
          <button className="mt-2 min-h-10 rounded-lg border border-white/10 bg-white/10 px-4 text-xs font-semibold text-white">ปิด Call-off</button>
        </form>
      ) : null}
    </article>
  );
}

export default async function CalloffPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireSession();
  if (session.user.role !== "EXECUTIVE" && session.user.role !== "ADMIN") {
    return <section className="rounded-3xl border border-rose-300/20 bg-rose-400/10 p-6 text-rose-100">PM Call-off is restricted to ADMIN / EXECUTIVE.</section>;
  }
  const [params, result] = await Promise.all([searchParams, getDeliveryOverview(session.user.role)]);
  if (!result.data) {
    return <section className="space-y-6"><Link href="/pm/batches" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white">← Batch Release</Link><div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50"><h1 className="text-2xl font-semibold">Call-off Control ยังเชื่อมข้อมูลไม่ได้</h1><p className="mt-2 text-sm">{result.error}</p></div></section>;
  }

  const data = result.data;
  const error = first(params.error);
  return (
    <section className="space-y-7 pb-12">
      <nav className="flex flex-wrap gap-2" aria-label="Call-off navigation"><Link href="/pm/batches" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white">← Batch Release</Link><Link href="/field-deliveries" className="flex min-h-11 items-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 text-sm text-emerald-100">Field Delivery</Link></nav>
      <header className="rounded-[2rem] border border-violet-300/15 bg-gradient-to-br from-slate-900 via-violet-950/40 to-slate-950 p-6 sm:p-8"><div className="flex flex-wrap gap-2"><span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-100">RELEASED BATCH ONLY</span><span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">PRIMARY / BACKUP</span><span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-100">NO AUTO PO / PAYMENT</span></div><h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Supplier Call-off & Delivery Reconciliation</h1><p className="mt-3 max-w-5xl text-sm leading-7 text-slate-300">Call-off ใช้ได้เฉพาะ Batch ที่ Release แล้วและ Site ที่ PM Verify Ready จาก Active Framework เท่านั้น Actual Quantity นับจาก DO ที่หน้างานส่งและ PM Accept แล้ว ไม่ใช้ยอดสั่งซื้อเป็น Actual</p><p className="mt-3 text-xs leading-6 text-violet-100/70">{data.rule}</p></header>

      {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">{decodeURIComponent(error)}</div> : null}
      {first(params.created) === "success" ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">Manual Call-off created with gate snapshot.</div> : null}
      {first(params.reviewed) === "success" ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">Delivery receipt verified.</div> : null}
      {first(params.closed) === "success" ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">Call-off closed with immutable audit record.</div> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[
        ["Eligible sites", data.summary.eligible_sites], ["Call-offs", data.summary.calloffs], ["Open", data.summary.open_calloffs], ["Pending review", data.summary.pending_reviews], ["Verified accepted", `${number(data.summary.verified_accepted_m3,2)} m³`],
      ].map(([label,value]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{String(value)}</p></div>)}</div>

      <section className="space-y-3"><div><h2 className="text-xl font-semibold text-white">1. Eligible Released Sites</h2><p className="mt-1 text-sm text-slate-400">จะว่างจนกว่า Batch Release + Active Framework + Verified Site Quantity ผ่านครบ</p></div>{data.eligible_sites.length ? data.eligible_sites.map((site) => <SiteCalloffForm key={`${site.batch_id}:${site.site_id}`} site={site} />) : <div className="rounded-2xl border border-amber-300/15 bg-amber-400/10 p-5 text-sm text-amber-50">ยังไม่มี Site ที่เปิด Call-off ได้ ระบบไม่สร้าง Call-off ล่วงหน้าก่อน Batch Release</div>}</section>

      <section className="space-y-3"><div><h2 className="text-xl font-semibold text-white">2. Call-off / Receipt / Actual</h2><p className="mt-1 text-sm text-slate-400">PM ตรวจ DO/QA ก่อน Actual Quantity ถูกนำไปรวม และต้องปิด Call-off แบบ Manual</p></div>{data.calloffs.length ? data.calloffs.map((calloff) => <CalloffCard key={calloff.id} calloff={calloff} />) : <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">ยังไม่มี Call-off</div>}</section>
    </section>
  );
}
