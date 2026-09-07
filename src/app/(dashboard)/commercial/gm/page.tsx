import Link from "next/link";
import { getGmSensitivity, getSiteCostOverview } from "@/lib/site-cost-rfq";
import { getKalasinGmPilot } from "@/lib/kalasin-gm-pilot";

function baht(value: number | null | undefined) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(Number(value));
}

function pct(value: number | null | undefined) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return `${(Number(value) * 100).toFixed(0)}%`;
}

export default async function DynamicGmPage() {
  const [overviewResult, sensitivityResult, pilotResult] = await Promise.all([
    getSiteCostOverview(),
    getGmSensitivity(),
    getKalasinGmPilot(),
  ]);
  if (!overviewResult.data || !sensitivityResult.data) {
    return <section className="space-y-5"><Link href="/commercial" className="text-sm text-sky-200">← Commercial</Link><div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-5 text-amber-50">{overviewResult.error || sensitivityResult.error}</div></section>;
  }

  const overview = overviewResult.data;
  const scenarios = sensitivityResult.data.scenarios;
  const kalasin = scenarios.filter((r) => r.scope_name === "กาฬสินธุ์");
  const project = scenarios.filter((r) => r.scope_name === "446 จุด");
  const critical = overview.sites.filter((s) => s.dynamic_gm?.financial_risk_tier === "CRITICAL").length;
  const eligible = overview.summary.dynamic_review_eligible || 0;
  const pilot = pilotResult.data;
  const pendingReview = pilot?.reviews.find((r) => r.review_status === "pending");

  return (
    <section className="space-y-7 pb-12">
      <nav className="flex flex-wrap gap-2">
        <Link href="/commercial" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white">← Commercial</Link>
        <Link href="/pm/suppliers/rfq/sites" className="flex min-h-11 items-center rounded-xl border border-sky-300/20 bg-sky-400/10 px-4 text-sm text-sky-100">Site RFQ</Link>
        <Link href="/procurement" className="flex min-h-11 items-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 text-sm text-emerald-100">Procurement</Link>
      </nav>

      <header className="rounded-[2rem] border border-violet-300/15 bg-gradient-to-br from-slate-900 via-violet-950 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-wrap gap-2"><span className="rounded-full bg-violet-300 px-3 py-1 text-xs font-bold text-slate-950">DYNAMIC GM</span><span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">FAIL-CLOSED</span></div>
        <h1 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">GM Decision Console</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">แนะนำ GM จาก Cost Evidence, RFQ Coverage และ Cash Terms โดยไม่ลด Approved GM อัตโนมัติ หากหลักฐานยังไม่ครบระบบจะ HOLD และยก Recommended GM ตามความเสี่ยง</p>
      </header>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[["Sites", overview.summary.sites], ["Critical risk", critical], ["Eligible for review", eligible], ["Current GO", overview.summary.go]].map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[10px] uppercase tracking-[.14em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{String(value)}</p></article>)}
      </div>

      <section className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-5">
        <h2 className="text-lg font-semibold text-amber-100">Current financial gate</h2>
        <p className="mt-2 text-sm leading-6 text-amber-50/80">ปัจจุบัน Cost Confirmation และ RFQ Evidence ยังไม่ครบ จึงไม่อนุมัติ GM 25–26% อัตโนมัติ แม้กาฬสินธุ์มี competitive floor 25% ระบบยังคงแนะนำ 32% / HOLD จน evidence gate ผ่าน</p>
      </section>

      {pilot ? (
        <section className="space-y-5 rounded-[2rem] border border-cyan-300/20 bg-cyan-950/20 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-sm font-medium text-cyan-300">KALASIN PILOT · 120 SITES</p><h2 className="mt-1 text-2xl font-semibold text-white">Pricing Readiness / RFQ Evidence</h2></div>
            <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-100">{Object.keys(pilot.summary.gate_counts)[0] || "HOLD"}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Active quote groups", `${pilot.summary.active_quote_groups_min} / site`],
              ["Market refs", `${pilot.summary.market_reference_lines_min} lines / site`],
              ["Spec review HOLD", `${pilot.summary.spec_review_required_sites} sites`],
              ["Evidence-backed saving", baht(pilot.summary.evidence_backed_saving_pre_vat)],
              ["Candidate saving", baht(pilot.summary.candidate_saving_pre_vat)],
            ].map(([label, value]) => <article key={String(label)} className="rounded-xl border border-white/10 bg-slate-950/35 p-3"><p className="text-[10px] uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-2 font-semibold text-white">{String(value)}</p></article>)}
          </div>

          {pendingReview ? (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-amber-100">Concrete Spec Review · PENDING</strong><span className="text-xs text-amber-50/70">{pendingReview.quotation_ref}</span></div>
              <p className="mt-2 text-sm leading-6 text-amber-50/80">Required: {pendingReview.required_spec}</p>
              <p className="mt-1 text-sm leading-6 text-amber-50/80">Offered: {pendingReview.offered_spec}</p>
              <p className="mt-2 text-xs text-amber-100">ต้องมี Engineer/QA evidence ก่อนเปลี่ยน Concrete เป็น market reference; approval นี้ยังไม่ทำให้ Award Gate ผ่าน</p>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <h3 className="font-semibold text-white">Procurement savings scenario · ก่อน VAT</h3>
            <table className="mt-3 min-w-[760px] w-full text-sm">
              <thead><tr className="border-b border-white/10 text-left text-xs text-slate-400"><th className="py-3">Item</th><th>Qty</th><th>Baseline</th><th>Quoted ref</th><th>Potential saving</th><th>Evidence</th></tr></thead>
              <tbody>{pilot.savings.map((r) => <tr key={r.item_code} className="border-b border-white/5 text-slate-200"><td className="py-3 font-medium text-white">{r.item_code}</td><td>{Number(r.qty).toLocaleString("th-TH")} {r.unit}</td><td>{baht(r.baseline_unit_cost_pre_vat)}</td><td>{baht(r.quoted_unit_cost_pre_vat)}</td><td className="font-semibold text-emerald-300">{baht(r.potential_saving_pre_vat)}</td><td><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${r.evidence_status === "candidate_spec_review" ? "bg-amber-400/10 text-amber-100" : "bg-emerald-400/10 text-emerald-200"}`}>{r.evidence_status}</span></td></tr>)}</tbody>
            </table>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pilot.clusters.map((c) => {
              const bids = pilot.bids.filter((b) => b.cluster_id === c.id);
              const quoted = bids.filter((b) => b.bid_status === "quoted" || b.bid_status === "confirmed").length;
              return <article key={c.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between gap-2"><strong className="text-white">{c.material_group}</strong><span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] text-slate-300">GM {pct(c.target_gm)}</span></div><p className="mt-2 text-xs text-slate-400">{c.forecast_sites} sites · RFQ {c.rfq_status}</p><p className="mt-3 text-sm text-slate-200">Quoted/confirmed: <strong>{quoted}/{bids.length}</strong></p><div className="mt-3 space-y-1">{bids.map((b) => <p key={b.id} className="text-xs text-slate-500">Slot {b.supplier_slot}: {b.supplier_name || "Independent supplier required"} · {b.bid_status}</p>)}</div></article>;
            })}
          </div>

          <p className="text-xs leading-6 text-slate-500">{pilot.rule}</p>
        </section>
      ) : (
        <section className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-50">Kalasin Pilot backend: {pilotResult.error}</section>
      )}

      {[{ title: "กาฬสินธุ์ · 120 จุด", rows: kalasin }, { title: "ทั้งโครงการ · 446 จุด", rows: project }].map((group) => (
        <section key={group.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 overflow-x-auto">
          <h2 className="text-xl font-semibold text-white">Sensitivity · {group.title}</h2>
          <p className="mt-2 text-xs text-slate-500">Scenario only — implied cost from current customer quote + current 32% system target; ไม่ใช่ Actual Cost</p>
          <table className="mt-4 min-w-[920px] w-full text-sm">
            <thead><tr className="border-b border-white/10 text-left text-xs text-slate-400"><th className="py-3">GM</th><th>ราคาขายรวม VAT</th><th>Gross Profit ก่อน VAT</th><th>Cost overrun buffer</th><th>Advance 25%</th><th>Safety reserve</th><th>Funding gap</th></tr></thead>
            <tbody>{group.rows.map((r) => <tr key={`${r.scope_name}-${r.gm}`} className="border-b border-white/5 text-slate-200"><td className="py-3 font-semibold text-white">{pct(r.gm)}</td><td>{baht(r.selling_price_vat)}</td><td>{baht(r.gross_profit_pre_vat)}</td><td>{Number(r.cost_overrun_buffer_pct_of_cost).toFixed(2)}%</td><td>{baht(r.modeled_advance_cash_vat)}</td><td>{baht(r.modeled_safety_reserve)}</td><td>{r.modeled_funding_gap_days} วัน</td></tr>)}</tbody>
          </table>
        </section>
      ))}

      <section className="rounded-2xl border border-white/10 bg-slate-950/45 p-5">
        <h2 className="text-lg font-semibold text-white">A* decision rule</h2>
        <p className="mt-2 text-sm leading-7 text-slate-300">กาฬสินธุ์: 25% เป็น floor เฉพาะเมื่อ Site Cost Confirmed + independent Confirmed Quote Groups ≥ 2 + Cash Terms ชัดเจน; หาก RFQ, Spec, Freight/TDC หรือ Cash Gap ยังเสี่ยง ระบบคง Working GM 32%. จังหวัดอื่นใช้ Project Default: floor 28%, standard 30%, high-risk 32%.</p>
      </section>
    </section>
  );
}
