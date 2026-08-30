import { randomUUID } from "node:crypto";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import {
  getFieldReadinessOverview,
  type ReadinessBatch,
  type ReadinessRole,
  type ReadinessSite,
} from "@/lib/field-readiness";
import { reviewReadinessAction, submitReadinessAction } from "./actions";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function number(value: number | null | undefined, digits = 0) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: digits }).format(Number(value || 0));
}

function statusTone(status: "good" | "warn" | "bad") {
  if (status === "good") return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  if (status === "warn") return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  return "border-rose-300/20 bg-rose-400/10 text-rose-100";
}

function SiteSubmissionForm({ site, batch }: { site: ReadinessSite; batch: ReadinessBatch }) {
  const latest = site.latest_submission;
  const locked = ["released", "in_progress", "completed", "cancelled"].includes(batch.status);
  return (
    <form action={submitReadinessAction} className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <input type="hidden" name="request_id" value={randomUUID()} />
      <input type="hidden" name="batch_id" value={batch.id} />
      <input type="hidden" name="site_id" value={site.site_id} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-cyan-300 px-2.5 py-1 text-[11px] font-bold text-slate-950">{site.site_code}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${site.verified_ready ? statusTone("good") : latest?.candidate_ready ? statusTone("warn") : statusTone("bad")}`}>
              {site.verified_ready ? "VERIFIED READY" : latest?.candidate_ready ? "WAITING PM VERIFY" : "NOT READY"}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-white">{site.location?.district || "-"} • {site.location?.province || batch.province}</p>
          <p className="mt-1 text-xs text-slate-400">Batch sequence #{site.sequence_no} • Site status {site.site_status}</p>
        </div>
        <div className="text-xs text-slate-400 sm:text-right">
          <p>Latest submit: {latest ? new Date(latest.submitted_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) : "-"}</p>
          <p className="mt-1">Review: {latest?.review ? latest.review.decision.toUpperCase() : "PENDING / NONE"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4 text-xs text-slate-300">
        {[
          ["quantity_confirmed", "Quantity confirmed", latest?.quantity_confirmed ?? site.quantity_confirmed],
          ["drawing_confirmed", "Drawing confirmed", latest?.drawing_confirmed ?? site.drawing_confirmed],
          ["site_condition_confirmed", "Site condition", latest?.site_condition_confirmed ?? site.site_condition_confirmed],
          ["access_ready", "Access ready", latest?.access_ready ?? site.access_ready],
        ].map(([name, label, value]) => (
          <label key={String(name)} className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3">
            <input type="checkbox" name={String(name)} defaultChecked={Boolean(value)} className="h-4 w-4" disabled={locked} /> {String(label)}
          </label>
        ))}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <input name="confirmed_area_m2" type="number" min="0" step="0.01" disabled={locked} defaultValue={latest?.confirmed_area_m2 ?? site.confirmed_area_m2 ?? ""} placeholder="Confirmed area m²" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white disabled:opacity-50" />
        <input name="confirmed_concrete_m3" type="number" min="0" step="0.01" disabled={locked} defaultValue={latest?.confirmed_concrete_m3 ?? site.confirmed_concrete_m3 ?? ""} placeholder="Confirmed concrete m³" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white disabled:opacity-50" />
        <input name="evidence_ref" disabled={locked} defaultValue={latest?.evidence_ref ?? site.evidence_ref ?? ""} placeholder="Photo / Drawing / Evidence ref" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white disabled:opacity-50" />
        <input name="note" disabled={locked} defaultValue={latest?.note ?? site.readiness_note ?? ""} placeholder="หน้างาน/ข้อจำกัด/หมายเหตุ" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white disabled:opacity-50" />
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-400">รายการที่ครบทุกข้อ + Concrete m³ &gt; 0 ต้องมี Evidence ref ก่อนส่งเป็น Ready Candidate</p>
        <button disabled={locked} className="min-h-11 rounded-xl bg-cyan-300 px-5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">ส่ง Site Readiness</button>
      </div>
    </form>
  );
}

function ReviewPanel({ site, batch }: { site: ReadinessSite; batch: ReadinessBatch }) {
  const submission = site.latest_submission;
  if (!submission || submission.review || !submission.candidate_ready) return null;
  return (
    <form action={reviewReadinessAction} className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 sm:p-5">
      <input type="hidden" name="request_id" value={randomUUID()} />
      <input type="hidden" name="submission_id" value={submission.id} />
      <input type="hidden" name="batch_id" value={batch.id} />
      <p className="text-sm font-semibold text-amber-100">PM Verification Required</p>
      <p className="mt-1 text-xs leading-5 text-amber-50/75">Submitted by {submission.submitted_by_name} ({submission.submitted_by_role}) • {number(submission.confirmed_concrete_m3, 2)} m³ • Evidence: {submission.evidence_ref || "-"}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
        <label className="text-xs text-amber-50">Decision
          <select name="decision" required defaultValue="accepted" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white">
            <option value="accepted">Accept → READY</option>
            <option value="rejected">Reject</option>
          </select>
        </label>
        <label className="text-xs text-amber-50">เหตุผลการตรวจรับ / ปฏิเสธ
          <input name="review_reason" required minLength={8} placeholder="เช่น ตรวจรูป/แบบ/ปริมาณและสภาพทางเข้าหน้างานแล้ว..." className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
        </label>
      </div>
      <label className="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/30 p-3 text-xs leading-5 text-slate-200">
        <input type="checkbox" name="review_confirmation" value="yes" required className="mt-1 h-4 w-4" />
        <span>ยืนยันว่าตรวจหลักฐานของ Submission ล่าสุดแล้ว การ Accept จะเปลี่ยน Site เป็น READY และถูกใช้ใน Batch Release Gate</span>
      </label>
      <button className="mt-3 min-h-11 rounded-xl bg-amber-300 px-5 text-sm font-semibold text-slate-950">บันทึก PM Verification</button>
    </form>
  );
}

export default async function FieldReadinessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireSession();
  const role = session.user.role as ReadinessRole;
  const [params, result] = await Promise.all([
    searchParams,
    getFieldReadinessOverview(role),
  ]);

  if (!result.data) {
    return (
      <section className="space-y-6">
        <Link href="/field-reports" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white">← Field Reports</Link>
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50">
          <h1 className="text-2xl font-semibold">Field Readiness ยังเชื่อมข้อมูลไม่ได้</h1>
          <p className="mt-2 text-sm leading-6 text-amber-50/80">{result.error}</p>
        </div>
      </section>
    );
  }

  const data = result.data;
  const requestedBatch = first(params.batch);
  const selectedBatch = data.batches.find((x) => x.id === requestedBatch) || data.batches.find((x) => x.summary.pending_review > 0) || data.batches[0] || null;
  const error = first(params.error);

  return (
    <section className="space-y-7 pb-12">
      <nav className="flex flex-wrap gap-2" aria-label="Field readiness navigation">
        <Link href="/field-reports" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white">← Field Reports</Link>
        {role !== "FIELD_LEADER" ? <Link href="/pm/batches" className="flex min-h-11 items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 text-sm text-cyan-100">Batch Release</Link> : null}
      </nav>

      <header className="rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-slate-900 via-cyan-950/50 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">FIELD → PM VERIFY</span>
          <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-100">{data.summary.sites} SITES</span>
          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">NO AUTO-READY</span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Field Site Readiness</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">FIELD_LEADER ส่งข้อมูลและหลักฐานได้ แต่ Site จะเป็น READY ต่อเมื่อ ADMIN/EXECUTIVE ตรวจ Submission ล่าสุดและ Accept เท่านั้น การ Release Batch ยังเป็นคนละ approval gate</p>
      </header>

      {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">{decodeURIComponent(error)}</div> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Batches", data.summary.batches, "ทั้งหมด"],
          ["Submitted", data.summary.submitted, "มีข้อมูลหน้างาน"],
          ["Pending Verify", data.summary.pending_review, "รอ PM"],
          ["Verified Ready", data.summary.verified_ready, "ผ่าน PM แล้ว"],
        ].map(([label, value, sub]) => (
          <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      <form method="get" className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs text-slate-300">เลือก Rolling Batch
          <select name="batch" defaultValue={selectedBatch?.id || ""} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white">
            {data.batches.map((batch) => (
              <option key={batch.id} value={batch.id}>{batch.batch_code} • {batch.province} • {batch.summary.verified_ready}/{batch.summary.sites} ready • {batch.summary.pending_review} pending</option>
            ))}
          </select>
        </label>
        <button className="min-h-11 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950">เปิด Batch</button>
      </form>

      {selectedBatch ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">{selectedBatch.batch_code}</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{selectedBatch.province} • {selectedBatch.summary.sites} จุด</h2>
              </div>
              <div className="text-xs text-slate-400 sm:text-right">Verified {selectedBatch.summary.verified_ready}/{selectedBatch.summary.sites} • Pending {selectedBatch.summary.pending_review}</div>
            </div>
          </div>

          {selectedBatch.sites.map((site) => (
            <div key={site.site_id}>
              <SiteSubmissionForm site={site} batch={selectedBatch} />
              {data.can_review ? <ReviewPanel site={site} batch={selectedBatch} /> : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
