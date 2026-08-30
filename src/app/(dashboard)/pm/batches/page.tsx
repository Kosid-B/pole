import { randomUUID } from "node:crypto";
import Link from "next/link";
import { getBatchReleaseOverview, type BatchRelease } from "@/lib/batch-release";
import { requireSession } from "@/lib/auth";
import {
  releaseBatchAction,
  setBatchScheduleAction,
  setBatchSiteReadinessAction,
} from "./actions";

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

function pct(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function tone(pass: boolean) {
  return pass
    ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
    : "border-rose-300/20 bg-rose-400/10 text-rose-100";
}

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const bangkok = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return bangkok.toISOString().slice(0, 16);
}

function Gate({ label, pass, value }: { label: string; pass: boolean; value: string }) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${tone(pass)}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-70">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function BatchCard({ batch }: { batch: BatchRelease }) {
  const released = ["released", "in_progress", "completed"].includes(batch.status);
  return (
    <article className="rounded-[1.7rem] border border-white/10 bg-white/5 p-5 sm:p-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-sky-400 px-2.5 py-1 text-[11px] font-bold text-slate-950">{batch.batch_code}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white">{batch.province}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${batch.release_ready ? tone(true) : tone(false)}`}>
              {batch.release_ready ? "READY FOR MANUAL RELEASE" : "HOLD"}
            </span>
            <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-2.5 py-1 text-[11px] font-semibold text-violet-100">{batch.status.toUpperCase()}</span>
          </div>
          <h2 className="mt-3 text-xl font-semibold text-white">Rolling Batch #{batch.batch_no}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {batch.planned_site_count} จุด • Planned {number(batch.planned_volume_m3, 2)} m³ • Confirmed {number(batch.site_gate.confirmed_volume_m3, 2)} m³
          </p>
        </div>
        <div className="text-sm text-slate-300 xl:text-right">
          <p>Start: <strong className="text-white">{batch.planned_start_at ? new Date(batch.planned_start_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) : "ยังไม่กำหนด"}</strong></p>
          <p className="mt-1 text-xs text-slate-500">Latest audit: {batch.latest_audit ? String(batch.latest_audit.action || "-") : "-"}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Gate label="Site" pass={batch.site_gate.pass} value={`${batch.site_gate.ready_sites}/${batch.site_gate.total_sites}`} />
        <Gate label="Framework" pass={batch.procurement_gate.pass} value={batch.procurement_gate.pass ? "ACTIVE" : "BLOCK"} />
        <Gate label="Capacity" pass={batch.capacity_gate.pass} value={`${number(batch.capacity_gate.weighted_capacity_m3_day, 1)} / ${number(batch.capacity_gate.required_daily_m3, 1)} m³/d`} />
        <Gate label="Funding" pass={batch.funding_gate.pass} value={`${number(batch.funding_gate.confirmed_funding_pct, 1)}%`} />
        <Gate label="GM" pass={batch.financial_gate.gm_pass} value={pct(batch.financial_gate.forecast_gm)} />
        <Gate label="4W Cover" pass={batch.financial_gate.commitment_pass} value={baht(batch.financial_gate.four_week_coverage_after_reserve)} />
        <Gate label="Schedule" pass={batch.schedule_gate.pass} value={`${batch.schedule_gate.calloff_notice_hours}h / ${batch.schedule_gate.rolling_forecast_days}d`} />
      </div>

      {batch.blockers.length ? (
        <div className="mt-4 rounded-xl border border-rose-300/15 bg-rose-400/10 p-3 text-xs leading-5 text-rose-50/90">
          {batch.blockers.map((x) => <p key={x}>• {x}</p>)}
        </div>
      ) : null}

      {!released ? (
        <form action={setBatchScheduleAction} className="mt-5 grid gap-3 rounded-2xl border border-sky-300/15 bg-sky-400/10 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] md:items-end">
          <input type="hidden" name="request_id" value={randomUUID()} />
          <input type="hidden" name="batch_id" value={batch.id} />
          <label className="text-xs text-sky-50">Planned start (Bangkok)
            <input name="planned_start_at" type="datetime-local" required defaultValue={localDateTime(batch.planned_start_at)} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </label>
          <label className="text-xs text-sky-50">เหตุผลการกำหนด/ปรับ Schedule
            <input name="reason" minLength={8} required placeholder="เช่น จัดเข้า rolling forecast 14 วันตามแผนพื้นที่..." className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
          </label>
          <button className="min-h-11 rounded-xl bg-sky-300 px-4 text-sm font-semibold text-slate-950">Save schedule</button>
        </form>
      ) : null}

      <details className="mt-5 rounded-2xl border border-white/10 bg-slate-950/35">
        <summary className="cursor-pointer list-none px-4 py-4 text-sm font-semibold text-white">
          Site Readiness • {batch.site_gate.ready_sites}/{batch.site_gate.total_sites} ready
        </summary>
        <div className="space-y-3 border-t border-white/10 p-4">
          {batch.sites.map((site) => (
            <form key={site.site_id} action={setBatchSiteReadinessAction} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <input type="hidden" name="request_id" value={randomUUID()} />
              <input type="hidden" name="batch_id" value={batch.id} />
              <input type="hidden" name="site_id" value={site.site_id} />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-white">{site.site_code}</p>
                  <p className="mt-1 text-xs text-slate-400">{site.location?.district || "-"} • {site.location?.province || batch.province}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone(site.ready)}`}>{site.ready ? "READY" : site.readiness_status.toUpperCase()}</span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4 text-xs text-slate-300">
                {[
                  ["quantity_confirmed", "Quantity confirmed", site.quantity_confirmed],
                  ["drawing_confirmed", "Drawing confirmed", site.drawing_confirmed],
                  ["site_condition_confirmed", "Site condition", site.site_condition_confirmed],
                  ["access_ready", "Access ready", site.access_ready],
                ].map(([name, label, value]) => (
                  <label key={String(name)} className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3">
                    <input type="checkbox" name={String(name)} defaultChecked={Boolean(value)} className="h-4 w-4" /> {String(label)}
                  </label>
                ))}
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <input name="confirmed_area_m2" type="number" min="0" step="0.01" defaultValue={site.confirmed_area_m2 ?? ""} placeholder="Confirmed area m²" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
                <input name="confirmed_concrete_m3" type="number" min="0" step="0.01" defaultValue={site.confirmed_concrete_m3 ?? ""} placeholder="Confirmed concrete m³" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
                <input name="evidence_ref" defaultValue={site.evidence_ref ?? ""} placeholder="Evidence / Drawing / Photo ref" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
                <input name="readiness_note" defaultValue={site.readiness_note ?? ""} placeholder="Readiness note" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input name="reason" minLength={8} required placeholder="เหตุผล/หลักฐานการอัปเดต readiness..." className="min-h-11 flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" />
                <button disabled={released} className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">Save readiness</button>
              </div>
            </form>
          ))}
        </div>
      </details>

      {batch.release_ready && !released ? (
        <form action={releaseBatchAction} className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 sm:p-5">
          <input type="hidden" name="request_id" value={randomUUID()} />
          <input type="hidden" name="batch_id" value={batch.id} />
          <p className="text-sm font-semibold text-emerald-100">Manual Batch Release</p>
          <p className="mt-1 text-xs leading-5 text-emerald-50/75">ระบบจะ re-check ทุก gate จาก backend อีกครั้งก่อนบันทึก Release และจะไม่สร้าง PO/DO อัตโนมัติ</p>
          <textarea name="reason" minLength={8} required rows={3} placeholder="เหตุผลอนุมัติปล่อย Batch..." className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-white" />
          <label className="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/30 p-3 text-xs leading-5 text-slate-200">
            <input type="checkbox" name="release_confirmation" value="yes" required className="mt-1 h-4 w-4" />
            <span>ยืนยันว่าได้ตรวจ Site Readiness, Framework, Supplier Capacity/Lead Time, Customer Funding, GM, Rolling Cash, 4-week Commitment และ Schedule แล้ว</span>
          </label>
          <button className="mt-4 min-h-11 rounded-xl bg-emerald-300 px-5 text-sm font-semibold text-slate-950">Approve Batch Release</button>
        </form>
      ) : null}
    </article>
  );
}

export default async function BatchReleasePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [session, params, result] = await Promise.all([
    requireSession(),
    searchParams,
    getBatchReleaseOverview(),
  ]);

  if (!result.data) {
    return (
      <section className="space-y-6">
        <Link href="/pm" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white">← PM Control</Link>
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50">
          <h1 className="text-2xl font-semibold">Rolling Batch Release ยังเชื่อมข้อมูลไม่ได้</h1>
          <p className="mt-2 text-sm leading-6 text-amber-50/80">{result.error}</p>
        </div>
      </section>
    );
  }

  const data = result.data;
  const error = first(params.error);
  return (
    <section className="space-y-7 pb-12">
      <nav className="flex flex-wrap gap-2" aria-label="Rolling batch navigation">
        <Link href="/pm" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white">← PM Control</Link>
        <Link href="/pm/suppliers/award-approval" className="flex min-h-11 items-center rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 text-sm text-amber-100">Award / Framework</Link>
        <Link href="/pm/financial" className="flex min-h-11 items-center rounded-xl border border-sky-300/20 bg-sky-400/10 px-4 text-sm text-sky-100">Financial Guardrail</Link>
        <Link href="/procurement" className="flex min-h-11 items-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 text-sm text-emerald-100">Procurement</Link>
      </nav>

      <header className="rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-slate-900 via-cyan-950/50 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">35 ROLLING BATCHES</span>
          <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-100">14-DAY FORECAST</span>
          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">72H CALL-OFF TARGET</span>
          <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-100">NO AUTO RELEASE / NO AUTO PO</span>
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Rolling Batch Release Control</h1>
        <p className="mt-3 max-w-5xl text-sm leading-7 text-slate-300 sm:text-base">เปิดงานเป็น Batch ตาม Cluster จังหวัด ไม่เปิด 446 จุดพร้อมกัน ปริมาณต้อง reconfirm จากพื้นที่จริง/แบบ/สภาพหน้างานก่อน Call-off และ backend จะ re-check Procurement, Capacity, Funding, GM, Cash และ 4-week commitment ทุกครั้งก่อน Release</p>
        <p className="mt-3 text-xs leading-6 text-cyan-100/70">{data.rule}</p>
        <p className="mt-3 text-xs text-slate-400">Controller: <strong className="text-white">{session.user.name}</strong> • {session.user.role}</p>
      </header>

      {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-50"><strong>Action blocked:</strong> {decodeURIComponent(error)}</div> : null}
      {first(params.schedule) === "success" ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">Batch schedule updated with audit trail.</div> : null}
      {first(params.readiness) === "success" ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">Site readiness updated with audit trail.</div> : null}
      {first(params.release) === "success" ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">Batch released after live gate re-check.</div> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {[
          ["Batches", data.summary.batches], ["Sites", data.summary.total_sites], ["Release ready", data.summary.release_ready], ["Released", data.summary.released],
          ["Site ready", data.summary.site_ready], ["Procurement ready", data.summary.procurement_ready], ["Funding ready", data.summary.funding_ready], ["Forecast GM", pct(data.financial_gate.forecast_gm)],
        ].map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">{label}</p><p className="mt-2 text-lg font-semibold text-white">{String(value)}</p></article>)}
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <Gate label="GM Gate" pass={data.financial_gate.gm_pass} value={`${pct(data.financial_gate.forecast_gm)} ≥ 32.00%`} />
        <Gate label="Rolling Cash" pass={data.financial_gate.cash_pass} value={`${baht(data.financial_gate.min_cash)} / Reserve ${baht(data.financial_gate.safety_reserve)}`} />
        <Gate label="4-week Commitment" pass={data.financial_gate.commitment_pass} value={`Coverage ${baht(data.financial_gate.four_week_coverage_after_reserve)}`} />
      </section>

      <div className="space-y-4">{data.batches.map((batch) => <BatchCard key={batch.id} batch={batch} />)}</div>
    </section>
  );
}
