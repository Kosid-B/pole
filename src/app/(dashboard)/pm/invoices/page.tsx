import { randomUUID } from "node:crypto";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import {
  getInvoiceOverview,
  type EligibleInvoiceCalloff,
  type SupplierInvoice,
} from "@/lib/invoice-control";
import { reviewSupplierInvoiceAction, submitSupplierInvoiceAction } from "./actions";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function number(value: number | null | undefined, digits = 2) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: digits }).format(Number(value || 0));
}

function baht(value: number | null | undefined) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function local(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

function todayBangkok() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function statusClass(status: SupplierInvoice["status"]) {
  if (status === "payment_eligible") return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  if (status === "rejected") return "border-rose-300/20 bg-rose-400/10 text-rose-100";
  return "border-amber-300/20 bg-amber-400/10 text-amber-100";
}

function InvoiceForm({ calloff }: { calloff: EligibleInvoiceCalloff }) {
  return (
    <details className="rounded-2xl border border-white/10 bg-white/5">
      <summary className="cursor-pointer list-none p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-cyan-300 px-2.5 py-1 text-[11px] font-bold text-slate-950">{calloff.calloff_ref}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white">{calloff.batch_code} • {calloff.site_code}</span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">COMPLETED</span>
            </div>
            <h2 className="mt-3 text-base font-semibold text-white">{calloff.supplier_name}</h2>
            <p className="mt-1 text-xs text-slate-400">{calloff.province} • Quote {calloff.quotation_ref || "-"} • {calloff.payment_terms || "No payment terms snapshot"}</p>
          </div>
          <div className="text-xs text-slate-400 xl:text-right">
            <p>Verified Accepted <strong className="text-white">{number(calloff.verified_accepted_m3, 3)} m³</strong></p>
            <p className="mt-1">Unbilled <strong className="text-cyan-200">{number(calloff.remaining_invoice_m3, 3)} m³</strong></p>
            <p className="mt-1">TDC <strong className="text-white">{baht(calloff.tdc_per_m3)}</strong>/m³</p>
          </div>
        </div>
      </summary>

      <form action={submitSupplierInvoiceAction} className="border-t border-white/10 p-4 sm:p-5">
        <input type="hidden" name="request_id" value={randomUUID()} />
        <input type="hidden" name="supplier_bid_id" value={calloff.supplier_bid_id} />
        <input type="hidden" name="calloff_id" value={calloff.id} />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs text-slate-300">Supplier Invoice Ref
            <input name="invoice_ref" required placeholder="เลขใบแจ้งหนี้จริง" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </label>
          <label className="text-xs text-slate-300">Tax Invoice Ref (optional)
            <input name="tax_invoice_ref" placeholder="เลขใบกำกับภาษี ถ้ามี" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </label>
          <label className="text-xs text-slate-300">Invoice Date
            <input name="invoice_date" type="date" required max={todayBangkok()} defaultValue={todayBangkok()} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </label>
          <label className="text-xs text-slate-300">Evidence Ref
            <input name="evidence_ref" required placeholder="Drive/Doc/Scan reference" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </label>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="text-xs text-slate-300">Invoice m³
            <input name="invoiced_m3" type="number" min="0.001" max={calloff.remaining_invoice_m3} step="0.001" required defaultValue={calloff.remaining_invoice_m3.toFixed(3)} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </label>
          <label className="text-xs text-slate-300">Line Net
            <input name="invoice_line_net" type="number" min="0.01" step="0.01" required defaultValue={calloff.expected_remaining_net.toFixed(2)} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </label>
          <label className="text-xs text-slate-300">Invoice Net
            <input name="net_amount" type="number" min="0.01" step="0.01" required defaultValue={calloff.expected_remaining_net.toFixed(2)} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </label>
          <label className="text-xs text-slate-300">VAT
            <input name="vat_amount" type="number" min="0" step="0.01" required defaultValue="0.00" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </label>
          <label className="text-xs text-slate-300">Gross
            <input name="gross_amount" type="number" min="0.01" step="0.01" required defaultValue={calloff.expected_remaining_net.toFixed(2)} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </label>
        </div>

        <div className="mt-3 rounded-xl border border-cyan-300/15 bg-cyan-400/10 p-3 text-xs leading-5 text-cyan-50/80">
          Expected Net for full remaining quantity = {baht(calloff.expected_remaining_net)}. Formula: Invoice m³ × Call-off TDC {baht(calloff.tdc_per_m3)}/m³. หากทำ Partial Invoice ให้ปรับ m³ และ Net ตามเอกสารจริง ระบบจะ re-check ตอน review อีกครั้ง
        </div>

        <textarea name="note" placeholder="หมายเหตุ Supplier Invoice / เอกสารประกอบ" className="mt-3 min-h-20 w-full rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm text-white" />
        <label className="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/30 p-3 text-xs leading-5 text-slate-200">
          <input type="checkbox" name="confirmation" value="yes" required className="mt-1 h-4 w-4" />
          <span>ยืนยันว่า Invoice นี้อ้างอิง Completed Call-off และ PM-Verified Actual จริง การ Submit เป็นเพียง Pending Review และไม่ใช่การอนุมัติจ่ายเงิน</span>
        </label>
        <button className="mt-3 min-h-11 rounded-xl bg-cyan-300 px-5 text-sm font-semibold text-slate-950">Submit Supplier Invoice</button>
      </form>
    </details>
  );
}

function InvoiceCard({ invoice }: { invoice: SupplierInvoice }) {
  const pending = invoice.status === "pending_review";
  return (
    <article className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-violet-300 px-2.5 py-1 text-[11px] font-bold text-slate-950">{invoice.invoice_ref}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass(invoice.status)}`}>{invoice.status.replaceAll("_", " ").toUpperCase()}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${invoice.match_preview.pass ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100" : "border-rose-300/20 bg-rose-400/10 text-rose-100"}`}>PREVIEW {invoice.match_preview.pass ? "MATCH" : "MISMATCH"}</span>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-white">{invoice.supplier_name_snapshot}</h2>
          <p className="mt-1 text-xs text-slate-400">Invoice date {invoice.invoice_date} • Evidence {invoice.evidence_ref} • Submitted {local(invoice.submitted_at)}</p>
        </div>
        <div className="text-xs text-slate-400 xl:text-right">
          <p>Net <strong className="text-white">{baht(invoice.net_amount)}</strong></p>
          <p className="mt-1">VAT {baht(invoice.vat_amount)} • Gross <strong className="text-white">{baht(invoice.gross_amount)}</strong></p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/10 p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-cyan-200/70">Expected Net</p><p className="mt-1 text-lg font-semibold text-white">{baht(invoice.match_preview.expected_net)}</p></div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Claimed Line Net</p><p className="mt-1 text-lg font-semibold text-white">{baht(invoice.match_preview.claimed_line_net)}</p></div>
        <div className={`rounded-xl border p-3 ${Math.abs(invoice.match_preview.delta) <= 0.01 ? "border-emerald-300/15 bg-emerald-400/10" : "border-rose-300/15 bg-rose-400/10"}`}><p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Delta</p><p className="mt-1 text-lg font-semibold text-white">{baht(invoice.match_preview.delta)}</p></div>
      </div>

      <details className="mt-4 rounded-xl border border-white/10 bg-slate-950/30">
        <summary className="cursor-pointer p-3 text-sm font-medium text-white">3-Way Match lines ({invoice.lines.length})</summary>
        <div className="space-y-2 border-t border-white/10 p-3">
          {invoice.lines.map((line) => (
            <div key={line.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div><strong className="text-white">{line.calloff_ref_snapshot}</strong><p className="mt-1">Invoice {number(line.invoiced_m3,3)} m³ • Verified snapshot {number(line.verified_accepted_m3_snapshot,3)} m³</p></div>
                <div className="sm:text-right"><p>TDC {baht(line.tdc_per_m3_snapshot)}/m³</p><p className="mt-1">Expected {baht(line.expected_net_snapshot)} • Claimed {baht(line.invoice_line_net)}</p></div>
              </div>
            </div>
          ))}
        </div>
      </details>

      {invoice.review ? (
        <div className={`mt-4 rounded-xl border p-3 text-xs ${invoice.review.decision === "payment_eligible" ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100" : "border-rose-300/20 bg-rose-400/10 text-rose-100"}`}>
          <strong>{invoice.review.decision.replaceAll("_", " ").toUpperCase()}</strong> • Match {invoice.review.match_pass ? "PASS" : "FAIL"} • {invoice.review.review_reason} • {invoice.review.reviewed_by_name} • {local(invoice.review.reviewed_at)}
        </div>
      ) : null}

      {pending ? (
        <form action={reviewSupplierInvoiceAction} className="mt-4 rounded-xl border border-amber-300/15 bg-amber-400/10 p-3">
          <input type="hidden" name="request_id" value={randomUUID()} />
          <input type="hidden" name="invoice_id" value={invoice.id} />
          <div className="grid gap-2 sm:grid-cols-[220px_1fr]">
            <select name="decision" required defaultValue={invoice.match_preview.pass ? "payment_eligible" : "rejected"} className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white">
              <option value="payment_eligible">Payment Eligible</option>
              <option value="rejected">Reject Invoice</option>
            </select>
            <input name="review_reason" required minLength={8} placeholder="เหตุผล review อย่างน้อย 8 ตัวอักษร" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </div>
          <label className="mt-2 flex items-start gap-2 text-xs text-amber-50/80"><input type="checkbox" name="confirmation" value="yes" required className="mt-1" />ยืนยันว่าตรวจ Invoice/Evidence แล้ว Backend จะ re-check Completed Call-off, Verified Actual, unbilled quantity และ TDC อีกครั้ง การผ่านขั้นนี้ยังไม่ใช่คำสั่งจ่ายเงิน</label>
          <button className="mt-2 min-h-10 rounded-lg bg-amber-300 px-4 text-xs font-semibold text-slate-950">บันทึก Manual Review</button>
        </form>
      ) : null}
    </article>
  );
}

export default async function SupplierInvoicesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireSession();
  if (session.user.role !== "EXECUTIVE" && session.user.role !== "ADMIN") {
    return <section className="rounded-3xl border border-rose-300/20 bg-rose-400/10 p-6 text-rose-100">Supplier Invoice Control is restricted to ADMIN / EXECUTIVE.</section>;
  }

  const [params, result] = await Promise.all([searchParams, getInvoiceOverview(session.user.role)]);
  if (!result.data) {
    return (
      <section className="space-y-6">
        <Link href="/pm/calloffs" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white">← Supplier Call-off</Link>
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50"><h1 className="text-2xl font-semibold">Supplier Invoice Control ยังเชื่อมข้อมูลไม่ได้</h1><p className="mt-2 text-sm leading-6">{result.error}</p></div>
      </section>
    );
  }

  const data = result.data;
  const error = first(params.error);
  return (
    <section className="space-y-7 pb-12">
      <nav className="flex flex-wrap gap-2" aria-label="Supplier invoice navigation">
        <Link href="/pm/calloffs" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white">← Supplier Call-off</Link>
        <Link href="/pm/batches" className="flex min-h-11 items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 text-sm text-cyan-100">Batch Release</Link>
        <Link href="/pm/payment-requests" className="flex min-h-11 items-center rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 text-sm text-amber-100">Payment Request</Link>
        <Link href="/finance" className="flex min-h-11 items-center rounded-xl border border-violet-300/20 bg-violet-400/10 px-4 text-sm text-violet-100">Finance</Link>
        <Link href="/pm" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white">PM Control</Link>
      </nav>

      <header className="rounded-[2rem] border border-violet-300/15 bg-gradient-to-br from-slate-900 via-violet-950/45 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-100">3-WAY MATCH</span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">VERIFIED ACTUAL ONLY</span>
          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">MANUAL ELIGIBILITY</span>
          <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-100">NO AUTO PAY</span>
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Supplier Invoice + Payment Eligibility</h1>
        <p className="mt-3 max-w-5xl text-sm leading-7 text-slate-300 sm:text-base">ตรวจ Supplier Invoice กับ Completed Call-off และ PM-Verified Accepted Actual ก่อนให้สถานะ Payment Eligible ระบบไม่สร้างคำสั่งธนาคาร ไม่ลงจ่าย ไม่สร้าง Settlement และไม่ถือว่า Preview บนหน้าจอเป็นผลอนุมัติ</p>
        <p className="mt-3 text-xs leading-6 text-violet-100/70">{data.rule}</p>
        <p className="mt-3 text-xs text-slate-400">Controller: <strong className="text-white">{session.user.name}</strong> • {session.user.role}</p>
      </header>

      {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-50"><strong>Action blocked:</strong> {decodeURIComponent(error)}</div> : null}
      {first(params.submitted) === "success" ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">Supplier Invoice submitted as Pending Review.</div> : null}
      {first(params.reviewed) === "success" ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">Supplier Invoice review recorded with server-side 3-Way Match snapshot.</div> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ["Eligible Call-offs", data.summary.eligible_calloffs],
          ["Invoices", data.summary.invoices],
          ["Pending Review", data.summary.pending_review],
          ["Payment Eligible", data.summary.payment_eligible],
          ["Rejected", data.summary.rejected],
          ["Eligible Net", baht(data.summary.payment_eligible_net)],
        ].map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">{label}</p><p className="mt-2 text-lg font-semibold text-white">{String(value)}</p></article>)}
      </div>

      <section className="space-y-3">
        <div><h2 className="text-xl font-semibold text-white">Eligible Completed Call-offs</h2><p className="mt-1 text-sm text-slate-400">แสดงเฉพาะ Call-off ที่ Completed, มี PM-Verified Accepted Actual และยังมี unbilled quantity</p></div>
        {data.eligible_calloffs.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">ยังไม่มี Completed Call-off ที่พร้อมออก Supplier Invoice ตาม control gate ปัจจุบัน</div> : null}
        {data.eligible_calloffs.map((calloff) => <InvoiceForm key={calloff.id} calloff={calloff} />)}
      </section>

      <section className="space-y-3">
        <div><h2 className="text-xl font-semibold text-white">Invoice Review Queue + Audit History</h2><p className="mt-1 text-sm text-slate-400">Preview มีไว้ช่วยตรวจ; backend re-check สดตอน Manual Review ทุกครั้ง</p></div>
        {data.invoices.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">ยังไม่มี Supplier Invoice ในระบบ</div> : null}
        {data.invoices.map((invoice) => <InvoiceCard key={invoice.id} invoice={invoice} />)}
      </section>
    </section>
  );
}
