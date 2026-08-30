import { randomUUID } from "node:crypto";
import Link from "next/link";
import {
  getAwardApprovalOverview,
  getClusterApprovalState,
  type AwardApprovalBid,
} from "@/lib/award-approval";
import { requireSession } from "@/lib/auth";
import { activateFrameworkAction, approveAwardAction } from "./actions";

function baht(value: number | null | undefined) {
  if (value == null) return "-";
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

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function tone(pass: boolean) {
  return pass
    ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
    : "border-rose-300/20 bg-rose-400/10 text-rose-100";
}

function Candidate({ label, bid }: { label: string; bid: AwardApprovalBid | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      {bid ? (
        <>
          <p className="mt-2 text-lg font-semibold text-white">{bid.supplier_name || `Supplier ${bid.supplier_slot}`}</p>
          <p className="mt-1 text-xl font-semibold text-emerald-200">{baht(bid.effective_delivered_cost)} / m³</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
            <p>Slot <strong className="text-slate-200">{bid.supplier_slot}</strong></p>
            <p>Capacity <strong className="text-slate-200">{number(Number(bid.capacity_m3_day || 0), 1)} m³/day</strong></p>
            <p>Lead <strong className="text-slate-200">{bid.lead_time_days ?? "-"} days</strong></p>
            <p>Valid <strong className="text-slate-200">{bid.valid_until || "-"}</strong></p>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-400">Quote: {bid.quotation_ref || "-"}</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Payment: {bid.payment_terms || "-"}</p>
        </>
      ) : (
        <p className="mt-3 text-sm text-rose-200">ยังไม่มี Award-ready candidate</p>
      )}
    </div>
  );
}

export default async function AwardApprovalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, params, result] = await Promise.all([
    requireSession(),
    searchParams,
    getAwardApprovalOverview(),
  ]);

  if (!result.data) {
    return (
      <section className="space-y-6">
        <Link href="/pm/suppliers/award-precheck" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white">
          ← Award Pre-check
        </Link>
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50">
          <h1 className="text-2xl font-semibold">Manual Award Approval ยังเชื่อมข้อมูลไม่ได้</h1>
          <p className="mt-2 text-sm leading-6 text-amber-50/80">{result.error}</p>
        </div>
      </section>
    );
  }

  const data = result.data;
  const gm = data.financial.gm_gate;
  const cash = data.financial.cash_gate;
  const error = first(params.error);
  const awardSuccess = first(params.award) === "success";
  const frameworkSuccess = first(params.framework) === "success";
  const successCluster = first(params.cluster);

  return (
    <section className="space-y-7 pb-12">
      <nav aria-label="Manual award navigation" className="flex flex-wrap gap-2">
        <Link href="/pm/suppliers/award-precheck" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white">
          ← Award Pre-check
        </Link>
        <Link href="/pm/suppliers/rfq" className="flex min-h-11 items-center rounded-xl border border-sky-300/20 bg-sky-400/10 px-4 text-sm font-medium text-sky-100">
          RFQ Console
        </Link>
        <Link href="/procurement" className="flex min-h-11 items-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 text-sm font-medium text-emerald-100">
          Procurement Control
        </Link>
      </nav>

      <header className="rounded-[2rem] border border-amber-300/15 bg-gradient-to-br from-slate-900 via-amber-950/50 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">MANUAL APPROVAL</span>
          <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-100">APPEND-ONLY AUDIT</span>
          <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-100">NO AUTO AWARD</span>
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Manual Award Approval / Framework Activation</h1>
        <p className="mt-3 max-w-5xl text-sm leading-7 text-slate-300 sm:text-base">
          อนุมัติเป็นราย Cluster สำหรับ Rolling Batch: backend จะอ่าน RFQ, TDC, GM, Rolling Cash และ Customer Funding ใหม่ทุกครั้งก่อนเขียน Award จากนั้น Framework Agreement ต้อง Activate แยกอีกขั้นเมื่อมีเลขข้อตกลงและวันมีผลจริง
        </p>
        <p className="mt-3 text-xs leading-6 text-amber-100/70">{data.rule}</p>
        <p className="mt-3 text-xs text-slate-400">Signed approver: <strong className="text-white">{session.user.name}</strong> • {session.user.email} • {session.user.role}</p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm leading-6 text-rose-50">
          <strong>Action blocked:</strong> {decodeURIComponent(error)}
        </div>
      ) : null}
      {awardSuccess ? (
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
          Award approval ถูกบันทึกพร้อม audit snapshot แล้ว{successCluster ? ` • Cluster ${successCluster}` : ""}
        </div>
      ) : null}
      {frameworkSuccess ? (
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
          Framework Agreement ถูก Activate และบันทึก audit snapshot แล้ว{successCluster ? ` • Cluster ${successCluster}` : ""}
        </div>
      ) : null}

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 xl:grid-cols-8">
        {[
          ["Clusters", data.summary.clusters],
          ["Supplier pair ready", data.summary.supplier_pair_ready],
          ["Funding ready", data.summary.cluster_funding_ready],
          ["Award approved", data.summary.award_approved],
          ["Framework active", data.summary.framework_active],
          ["Forecast GM", pct(gm.forecast_gm)],
          ["Min cash", baht(cash.min_cash)],
          ["Safety reserve", baht(cash.safety_reserve)],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">{label}</p>
            <p className="mt-2 text-lg font-semibold text-white">{String(value)}</p>
          </article>
        ))}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`rounded-2xl border p-4 ${tone(data.gates.gm)}`}>
          <p className="text-xs font-semibold">GM GATE</p>
          <p className="mt-2 text-xl font-semibold text-white">{pct(gm.forecast_gm)}</p>
          <p className="mt-1 text-xs opacity-75">Hard floor {pct(Math.max(0.32, gm.target_gm))}</p>
        </div>
        <div className={`rounded-2xl border p-4 ${tone(data.gates.rolling_cash)}`}>
          <p className="text-xs font-semibold">ROLLING CASH</p>
          <p className="mt-2 text-xl font-semibold text-white">{baht(cash.min_cash)}</p>
          <p className="mt-1 text-xs opacity-75">Reserve {baht(cash.safety_reserve)}</p>
        </div>
        <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 p-4 text-sky-50">
          <p className="text-xs font-semibold">APPROVAL SCOPE</p>
          <p className="mt-2 text-xl font-semibold text-white">Per Cluster</p>
          <p className="mt-1 text-xs text-sky-100/70">รองรับ Customer-funded rolling batch</p>
        </div>
        <div className="rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4 text-violet-50">
          <p className="text-xs font-semibold">AUDIT CONTROL</p>
          <p className="mt-2 text-xl font-semibold text-white">Immutable</p>
          <p className="mt-1 text-xs text-violet-100/70">Approver + reason + TDC/GM/Cash snapshot</p>
        </div>
      </section>

      <div className="space-y-4">
        {data.clusters.map((cluster) => {
          const state = getClusterApprovalState(cluster, data.gates);
          const readyForAward = state === "READY_FOR_AWARD";
          const awardApproved = state === "AWARD_APPROVED";
          const active = state === "FRAMEWORK_ACTIVE";
          const primary = cluster.primary_candidate;
          const backup = cluster.backup_candidate;

          return (
            <article key={cluster.id} className="rounded-[1.7rem] border border-white/10 bg-white/5 p-5 sm:p-6">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-slate-950">{cluster.province}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone(cluster.supplier_pair_pass)}`}>PAIR {cluster.supplier_pair_pass ? "PASS" : "BLOCK"}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone(cluster.funding_gate_pass)}`}>FUNDING {cluster.funding_gate_pass ? "PASS" : "BLOCK"}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${active ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100" : awardApproved ? "border-sky-300/20 bg-sky-400/10 text-sky-100" : readyForAward ? "border-amber-300/20 bg-amber-400/10 text-amber-100" : "border-rose-300/20 bg-rose-400/10 text-rose-100"}`}>{state}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-white">{cluster.cluster_name}</h2>
                  <p className="mt-1 text-xs text-slate-400">{cluster.forecast_sites} จุด • {number(cluster.forecast_volume_m3, 2)} m³ • Funding confirmed {number(cluster.confirmed_funding_pct, 1)}%</p>
                </div>
                <div className="text-sm text-slate-300 xl:text-right">
                  <p>{cluster.award_ready_count} award-ready bids</p>
                  <p className="mt-1 text-xs text-slate-500">RFQ: {cluster.rfq_status} • Framework: {cluster.framework?.status || "missing"}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Candidate label="Primary candidate by TDC" bid={primary} />
                <Candidate label="Backup candidate by TDC" bid={backup} />
              </div>

              {readyForAward && primary && backup ? (
                <form action={approveAwardAction} className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 sm:p-5">
                  <input type="hidden" name="request_id" value={randomUUID()} />
                  <input type="hidden" name="cluster_id" value={cluster.id} />
                  <input type="hidden" name="primary_bid_id" value={primary.id} />
                  <input type="hidden" name="backup_bid_id" value={backup.id} />
                  <p className="text-sm font-semibold text-amber-100">Approve Primary / Backup Award</p>
                  <p className="mt-1 text-xs leading-5 text-amber-50/70">การกดอนุมัติจะเขียน Award ลง Cluster และเปลี่ยน Framework เป็น `award_approved` แต่ยังไม่ Active</p>
                  <label className="mt-4 block text-xs text-slate-300">
                    เหตุผลอนุมัติ / Decision rationale
                    <textarea name="approval_reason" minLength={8} required rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-white outline-none focus:border-amber-300/40" placeholder="เช่น TDC ต่ำสุด ข้อมูล capacity/lead time ครบ และมี Backup รองรับ..." />
                  </label>
                  <label className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/30 p-3 text-xs leading-5 text-slate-300">
                    <input type="checkbox" name="approval_confirmation" value="yes" required className="mt-1 h-4 w-4" />
                    <span>ยืนยันว่าได้ตรวจ Primary/Backup, TDC, Capacity, Lead Time, Payment Terms, GM, Cash และ Customer Funding แล้ว</span>
                  </label>
                  <button className="mt-4 min-h-11 w-full rounded-xl bg-amber-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-200">อนุมัติ Award ด้วยผู้ใช้นี้</button>
                </form>
              ) : null}

              {awardApproved ? (
                <form action={activateFrameworkAction} className="mt-5 rounded-2xl border border-sky-300/20 bg-sky-400/10 p-4 sm:p-5">
                  <input type="hidden" name="request_id" value={randomUUID()} />
                  <input type="hidden" name="cluster_id" value={cluster.id} />
                  <p className="text-sm font-semibold text-sky-100">Activate Framework Agreement</p>
                  <p className="mt-1 text-xs leading-5 text-sky-50/70">ต้องใช้เลขข้อตกลงจริงและวันมีผลจริง ระบบจะ re-check GM, Cash, Funding และสถานะ RFQ ก่อน Activate</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <label className="text-xs text-slate-300">Agreement No<input name="agreement_no" required defaultValue={cluster.framework?.agreement_no || ""} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" /></label>
                    <label className="text-xs text-slate-300">Effective from<input name="effective_from" type="date" required defaultValue={cluster.framework?.effective_from || ""} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" /></label>
                    <label className="text-xs text-slate-300">Effective to<input name="effective_to" type="date" defaultValue={cluster.framework?.effective_to || ""} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white" /></label>
                  </div>
                  <label className="mt-4 block text-xs text-slate-300">เหตุผล Activate / Contract control note<textarea name="approval_reason" minLength={8} required rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-white" placeholder="เช่น ตรวจเลขข้อตกลงและเงื่อนไข call-off แล้ว พร้อมเปิดใช้ Framework..." /></label>
                  <label className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/30 p-3 text-xs leading-5 text-slate-300">
                    <input type="checkbox" name="activation_confirmation" value="yes" required className="mt-1 h-4 w-4" />
                    <span>ยืนยันเลขข้อตกลง วันมีผล Primary/Backup 70/30 และเงื่อนไข Framework ก่อน Activate</span>
                  </label>
                  <button className="mt-4 min-h-11 w-full rounded-xl bg-sky-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-200">Activate Framework Agreement</button>
                </form>
              ) : null}

              {active && cluster.framework ? (
                <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
                  <p className="font-semibold">Framework ACTIVE • {cluster.framework.agreement_no}</p>
                  <p className="mt-2 text-xs leading-5 text-emerald-50/75">Effective {cluster.framework.effective_from || "-"} → {cluster.framework.effective_to || "open-ended"} • Primary {cluster.framework.primary_share_pct}% / Backup {cluster.framework.backup_share_pct}% • Call-off {cluster.framework.calloff_notice_hours}h</p>
                </div>
              ) : null}

              {cluster.latest_audit ? (
                <details className="mt-4 rounded-xl border border-violet-300/15 bg-violet-400/10 p-3 text-xs text-violet-50/85">
                  <summary className="cursor-pointer font-semibold text-violet-100">Latest immutable audit • {cluster.latest_audit.action}</summary>
                  <div className="mt-3 space-y-1 leading-5">
                    <p>{cluster.latest_audit.approved_by_name} • {cluster.latest_audit.approved_by_role} • {cluster.latest_audit.approved_by_email}</p>
                    <p>{cluster.latest_audit.created_at}</p>
                    <p>Reason: {cluster.latest_audit.approval_reason}</p>
                    <p>GM {pct(cluster.latest_audit.forecast_gm)} • Min Cash {baht(cluster.latest_audit.min_rolling_cash)} • Reserve {baht(cluster.latest_audit.safety_reserve)}</p>
                  </div>
                </details>
              ) : null}

              {!readyForAward && !awardApproved && !active ? (
                <div className="mt-4 rounded-xl border border-rose-300/15 bg-rose-400/10 p-3 text-xs leading-5 text-rose-50/85">
                  BLOCKED — ต้องมี Primary + Backup award-ready, Funding ของ Cluster ยืนยันแล้ว, GM ≥ 32% และ Rolling Cash ≥ Safety Reserve พร้อมกัน
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
