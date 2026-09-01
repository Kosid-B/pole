import { randomUUID } from "node:crypto";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import {
  getPaymentRequestOverview,
  type PaymentEligibleInvoice,
  type SupplierPaymentRequest,
} from "@/lib/payment-request-control";
import {
  reviewSupplierPaymentRequestAction,
  submitSupplierPaymentRequestAction,
} from "./actions";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function baht(value: number | null | undefined) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function pct(value: number | null | undefined) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`;
}

function local(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

function todayBangkok() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function statusClass(status: SupplierPaymentRequest["status"]) {
  if (status === "cash_reserved") return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  if (status === "rejected") return "border-rose-300/20 bg-rose-400/10 text-rose-100";
  return "border-amber-300/20 bg-amber-400/10 text-amber-100";
}

function RequestForm({ invoice }: { invoice: PaymentEligibleInvoice }) {
  const dueDate = invoice.invoice_date > todayBangkok() ? invoice.invoice_date : todayBangkok();
  return (
    <details className="rounded-2xl border border-white/10 bg-white/5">
      <summary className="cursor-pointer list-none p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-violet-300 px-2.5 py-1 text-[11px] font-bold text-slate-950">{invoice.invoice_ref}</span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">PAYMENT ELIGIBLE</span>
            </div>
            <h2 className="mt-3 text-base font-semibold text-white">{invoice.supplier_name_snapshot}</h2>
            <p className="mt-1 text-xs text-slate-400">Invoice {invoice.invoice_date} • Evidence {invoice.evidence_ref}</p>
          </div>
          <div className="text-sm sm:text-right">
            <p className="text-slate-400">Cash reservation basis</p>
            <p className="mt-1 text-xl font-semibold text-white">{baht(invoice.gross_amount)}</p>
            <p className="mt-1 text-xs text-slate-500">Gross amount • conservative cash hold</p>
          </div>
        </div>
      </summary>
      <form action={submitSupplierPaymentRequestAction} className="border-t border-white/10 p-4 sm:p-5">
        <input type="hidden" name="request_id" value={randomUUID()} />
        <input type="hidden" name="invoice_id" value={invoice.id} />
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs text-slate-300">Payment Due Date
            <input name="due_date" type="date" min={invoice.invoice_date} required defaultValue={dueDate} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </label>
          <label className="text-xs text-slate-300">Evidence / Approval Pack Ref
            <input name="evidence_ref" required placeholder="AP pack / Drive / document reference" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </label>
        </div>
        <label className="mt-3 block text-xs text-slate-300">Request reason
          <textarea name="request_reason" required minLength={8} placeholder="เหตุผลและเงื่อนไขการขอกันวงเงิน อย่างน้อย 8 ตัวอักษร" className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm text-white" />
        </label>
        <label className="mt-3 flex items-start gap-3 rounded-xl border border-amber-300/15 bg-amber-400/10 p-3 text-xs leading-5 text-amber-50/85">
          <input type="checkbox" name="confirmation" value="yes" required className="mt-1 h-4 w-4" />
          <span>ยืนยันว่าเอกสารนี้เป็น Payment Request เท่านั้น จำนวนเงินอ้างอิง Gross ตาม Invoice ที่ผ่าน 3-Way Match และยังไม่ใช่คำสั่งจ่ายเงินหรือสถานะ Paid</span>
        </label>
        <button className="mt-3 min-h-11 rounded-xl bg-violet-300 px-5 text-sm font-semibold text-slate-950">Submit Payment Request</button>
      </form>
    </details>
  );
}

function RequestCard({ request, canReview }: { request: SupplierPaymentRequest; canReview: boolean }) {
  const pending = request.status === "pending_approval";
  const snapshot = request.review?.financial_snapshot || {};
  const after = Number(snapshot.projected_min_cash_after_reservation || 0);
  const reserve = Number(snapshot.safety_reserve || 0);
  return (
    <article className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-cyan-300 px-2.5 py-1 text-[11px] font-bold text-slate-950">{request.invoice_ref_snapshot}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass(request.status)}`}>{request.status.replaceAll("_", " ").toUpperCase()}</span>
            <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-2.5 py-1 text-[11px] font-semibold text-rose-100">NO AUTO PAY</span>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-white">{request.supplier_name_snapshot}</h2>
          <p className="mt-1 text-xs text-slate-400">Due {request.due_date} • Submitted {local(request.submitted_at)} by {request.submitted_by_name}</p>
          <p className="mt-2 text-xs leading-5 text-slate-300">{request.request_reason}</p>
        </div>
        <div className="xl:text-right">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Requested Gross</p>
          <p className="mt-2 text-2xl font-semibold text-white">{baht(request.requested_gross_amount)}</p>
          <p className="mt-1 text-xs text-slate-500">Evidence {request.evidence_ref}</p>
        </div>
      </div>

      {request.review ? (
        <div className={`mt-4 rounded-xl border p-4 text-xs leading-5 ${request.review.decision === "cash_reserved" ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-50" : "border-rose-300/20 bg-rose-400/10 text-rose-50"}`}>
          <p className="font-semibold">{request.review.decision.replaceAll("_", " ").toUpperCase()} • {request.review.reviewed_by_name}</p>
          <p className="mt-1">{request.review.review_reason}</p>
          {request.review.decision === "cash_reserved" ? <p className="mt-2">Projected Min Cash {baht(after)} • Safety Reserve {baht(reserve)} • {request.review.financial_gate_pass ? "PASS" : "FAIL"}</p> : null}
          <p className="mt-1 opacity-70">{local(request.review.reviewed_at)}</p>
        </div>
      ) : null}

      {pending && canReview ? (
        <form action={reviewSupplierPaymentRequestAction} className="mt-4 rounded-xl border border-amber-300/20 bg-amber-400/10 p-4">
          <input type="hidden" name="request_id" value={randomUUID()} />
          <input type="hidden" name="payment_request_id" value={request.id} />
          <div className="grid gap-2 sm:grid-cols-[220px_1fr]">
            <select name="decision" required defaultValue="cash_reserved" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white">
              <option value="cash_reserved">Approve Cash Reservation</option>
              <option value="rejected">Reject Request</option>
            </select>
            <input name="review_reason" required minLength={8} placeholder="เหตุผลอนุมัติ/ปฏิเสธ อย่างน้อย 8 ตัวอักษร" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </div>
          <label className="mt-2 flex items-start gap-2 text-xs leading-5 text-amber-50/85"><input type="checkbox" name="confirmation" value="yes" required className="mt-1" />Backend จะโหลด Financial Guardrail สดและกันวงเงินได้เฉพาะเมื่อ GM ≥ 32% และ Min Cash หลังรวม reservation ทั้งหมด ≥ Safety Reserve ขั้นนี้ยังไม่จ่ายเงินจริง</label>
          <button className="mt-2 min-h-10 rounded-lg bg-amber-300 px-4 text-xs font-semibold text-slate-950">บันทึก Executive Review</button>
        </form>
      ) : null}

      {pending && !canReview ? <p className="mt-4 rounded-xl border border-amber-300/15 bg-amber-400/10 p-3 text-xs text-amber-50/80">รอ EXECUTIVE ตรวจและกันวงเงินด้วย Manual Review</p> : null}
    </article>
  );
}

export default async function PaymentRequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireSession();
  if (session.user.role !== "EXECUTIVE" && session.user.role !== "ADMIN") {
    return <section className="rounded-3xl border border-rose-300/20 bg-rose-400/10 p-6 text-rose-100">Payment Request Control is restricted to ADMIN / EXECUTIVE.</section>;
  }
  const [params, result] = await Promise.all([searchParams, getPaymentRequestOverview(session.user.role)]);
  if (!result.data) {
    return <section className="space-y-6"><Link href="/pm/invoices" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white">← Supplier Invoice</Link><div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50"><h1 className="text-2xl font-semibold">Payment Request Control ยังเชื่อมข้อมูลไม่ได้</h1><p className="mt-2 text-sm leading-6">{result.error}</p></div></section>;
  }
  const data = result.data;
  const error = first(params.error);
  const cashPass = data.financial_gate.available_cash_buffer >= 0;
  return (
    <section className="space-y-7 pb-12">
      <nav className="flex flex-wrap gap-2" aria-label="Payment request navigation">
        <Link href="/pm/invoices" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white">← Supplier Invoice</Link>
        <Link href="/pm/financial" className="flex min-h-11 items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 text-sm text-cyan-100">Financial Guardrail</Link>
        <Link href="/finance" className="flex min-h-11 items-center rounded-xl border border-violet-300/20 bg-violet-400/10 px-4 text-sm text-violet-100">Finance</Link>
      </nav>

      <header className="rounded-[2rem] border border-violet-300/15 bg-gradient-to-br from-slate-900 via-violet-950/45 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-100">PAYMENT REQUEST</span>
          <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">LIVE CASH RE-CHECK</span>
          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">EXECUTIVE RESERVATION</span>
          <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-100">NO BANK / NO PAID</span>
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Supplier Payment Request + Cash Reservation</h1>
        <p className="mt-3 max-w-5xl text-sm leading-7 text-slate-300 sm:text-base">เปลี่ยน Invoice ที่ผ่าน 3-Way Match ให้เป็นคำขอกันวงเงิน โดยใช้ Gross เป็นฐานสำรองเงินแบบ conservative และให้ EXECUTIVE อนุมัติได้เมื่อ Financial Guardrail สดผ่านเท่านั้น ระบบไม่สร้างธุรกรรมธนาคาร ไม่ตั้ง Paid และไม่ลงบัญชี</p>
        <p className="mt-3 text-xs leading-6 text-violet-100/70">{data.rule}</p>
      </header>

      {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-50"><strong>Action blocked:</strong> {decodeURIComponent(error)}</div> : null}
      {first(params.submitted) === "success" ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">Payment Request submitted as Pending Approval.</div> : null}
      {first(params.reviewed) === "success" ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">Executive review recorded with immutable Financial Guardrail snapshot.</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className={`rounded-2xl border p-4 ${data.financial_gate.gm_pass ? "border-emerald-300/20 bg-emerald-400/10" : "border-rose-300/20 bg-rose-400/10"}`}><p className="text-xs uppercase tracking-[0.12em] text-slate-400">GM Gate</p><p className="mt-2 text-xl font-semibold text-white">{pct(data.financial_gate.forecast_gm)}</p><p className="mt-1 text-xs text-slate-400">Floor {pct(data.financial_gate.gm_floor)}</p></article>
        <article className={`rounded-2xl border p-4 ${cashPass ? "border-emerald-300/20 bg-emerald-400/10" : "border-rose-300/20 bg-rose-400/10"}`}><p className="text-xs uppercase tracking-[0.12em] text-slate-400">Available Cash Buffer</p><p className="mt-2 text-xl font-semibold text-white">{baht(data.financial_gate.available_cash_buffer)}</p><p className="mt-1 text-xs text-slate-400">เหนือ Safety Reserve หลัง reservation ปัจจุบัน</p></article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-400">Cash Reserved</p><p className="mt-2 text-xl font-semibold text-white">{baht(data.financial_gate.existing_cash_reserved)}</p><p className="mt-1 text-xs text-slate-400">{data.summary.cash_reserved} approved request(s)</p></article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-400">Safety Reserve</p><p className="mt-2 text-xl font-semibold text-white">{baht(data.financial_gate.safety_reserve)}</p><p className="mt-1 text-xs text-slate-400">ห้ามใช้ต่ำกว่าเส้นนี้</p></article>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[["Eligible Invoice", data.summary.eligible_invoices],["Requests", data.summary.requests],["Pending", data.summary.pending_approval],["Reserved", data.summary.cash_reserved],["Rejected", data.summary.rejected],["Reserved Gross", baht(data.summary.reserved_gross)]].map(([label,value]) => <article key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">{label}</p><p className="mt-2 text-lg font-semibold text-white">{String(value)}</p></article>)}
      </div>

      <section className="space-y-3"><div><h2 className="text-xl font-semibold text-white">Payment Eligible Invoices</h2><p className="mt-1 text-sm text-slate-400">Invoice ที่ผ่าน server 3-Way Match และยังไม่มี Active Payment Request</p></div>{data.eligible_invoices.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">ยังไม่มี Payment Eligible Invoice ที่พร้อมสร้างคำขอ</div> : null}{data.eligible_invoices.map((invoice) => <RequestForm key={invoice.id} invoice={invoice} />)}</section>
      <section className="space-y-3"><div><h2 className="text-xl font-semibold text-white">Request Queue + Reservation Audit</h2><p className="mt-1 text-sm text-slate-400">EXECUTIVE approval จะ re-check GM/Cash สดและบันทึก snapshot แบบ append-only</p></div>{data.requests.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">ยังไม่มี Supplier Payment Request ในระบบ</div> : null}{data.requests.map((request) => <RequestCard key={request.id} request={request} canReview={data.can_review} />)}</section>
    </section>
  );
}
