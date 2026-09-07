import Link from "next/link";
import { getSiteCostDetail, getSiteCostOverview, type SiteMaterialCost, type SiteRateCost } from "@/lib/site-cost-rfq";
import { importSiteMaterialCsvAction, saveSiteMaterialQuoteAction, saveSiteRateBatchAction } from "./actions";

function baht(value: number | null | undefined) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(Number(value));
}

function pct(value: number | null | undefined) {
  if (value == null || !Number.isFinite(Number(value))) return "HOLD";
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function gateTone(gate: string) {
  return gate === "GO"
    ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
    : "border-amber-300/20 bg-amber-400/10 text-amber-100";
}

function MaterialRow({ row }: { row: SiteMaterialCost }) {
  return (
    <div className="grid gap-2 rounded-xl border border-white/10 bg-slate-950/45 p-3 sm:grid-cols-[1.5fr_.55fr_.65fr_.65fr_.65fr] sm:items-end">
      <div>
        <p className="text-sm font-medium text-white">{row.item_code} · {row.item_name}</p>
        <p className="mt-1 text-xs text-slate-500">{row.qty} {row.unit} · {row.pricing_status}</p>
      </div>
      <label className="block text-[11px] text-slate-400">Unit price
        <input name={`unit_price__${row.id}`} type="number" min="0" step="0.01" defaultValue={row.unit_price ?? ""} className="mt-1 min-h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-2 text-sm text-white" />
      </label>
      <label className="block text-[11px] text-slate-400">Surcharge
        <input name={`surcharge__${row.id}`} type="number" min="0" step="0.01" defaultValue={row.surcharge_amount ?? 0} className="mt-1 min-h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-2 text-sm text-white" />
      </label>
      <label className="block text-[11px] text-slate-400">Discount
        <input name={`discount__${row.id}`} type="number" min="0" step="0.01" defaultValue={row.discount_amount ?? 0} className="mt-1 min-h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-2 text-sm text-white" />
      </label>
      <div className="text-right text-xs text-slate-400">Current<br /><strong className="text-slate-200">{row.unit_price == null ? "UNCONFIRMED" : baht(row.unit_price)}</strong></div>
    </div>
  );
}

function RateRow({ row, type }: { row: SiteRateCost; type: "labor" | "equipment" }) {
  const name = type === "labor" ? row.labor_name : row.equipment_name;
  const code = type === "labor" ? row.labor_code : row.equipment_code;
  return (
    <div className={`grid gap-2 rounded-xl border border-white/10 bg-slate-950/45 p-3 ${type === "equipment" ? "sm:grid-cols-[1.5fr_.7fr_.7fr_.7fr]" : "sm:grid-cols-[1.5fr_.7fr]"} sm:items-end`}>
      <div>
        <p className="text-sm font-medium text-white">{code || "—"} · {name}</p>
        <p className="mt-1 text-xs text-slate-500">{row.qty} {row.unit} · {row.pricing_status}</p>
      </div>
      <label className="block text-[11px] text-slate-400">Unit rate
        <input name={`unit_rate__${row.id}`} type="number" min="0" step="0.01" defaultValue={row.unit_rate ?? ""} className="mt-1 min-h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-2 text-sm text-white" />
      </label>
      {type === "equipment" ? <>
        <label className="block text-[11px] text-slate-400">Mobilization
          <input name={`mobilization__${row.id}`} type="number" min="0" step="0.01" defaultValue={row.mobilization_amount ?? 0} className="mt-1 min-h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-2 text-sm text-white" />
        </label>
        <label className="block text-[11px] text-slate-400">Demobilization
          <input name={`demobilization__${row.id}`} type="number" min="0" step="0.01" defaultValue={row.demobilization_amount ?? 0} className="mt-1 min-h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-2 text-sm text-white" />
        </label>
      </> : null}
    </div>
  );
}

export default async function SiteCostRfqPage({ searchParams }: { searchParams: Promise<{ site_id?: string }> }) {
  const params = await searchParams;
  const overviewResult = await getSiteCostOverview();
  if (!overviewResult.data) {
    return <section className="space-y-5"><Link href="/pm/suppliers/rfq" className="text-sm text-sky-200">← RFQ Console</Link><div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-5 text-amber-50">{overviewResult.error}</div></section>;
  }

  const overview = overviewResult.data;
  const selectedId = params.site_id || overview.sites.find((x) => x.commercial_gate !== "GO")?.site_id || overview.sites[0]?.site_id;
  const detailResult = selectedId ? await getSiteCostDetail(selectedId) : null;
  const detail = detailResult?.data ?? null;
  const materialGroups = new Map<string, SiteMaterialCost[]>();
  for (const row of detail?.materials || []) {
    const list = materialGroups.get(row.material_group) || [];
    list.push(row);
    materialGroups.set(row.material_group, list);
  }

  return (
    <section className="space-y-7 pb-12">
      <nav className="flex flex-wrap gap-2">
        <Link href="/pm/suppliers/rfq" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white">← Cluster RFQ</Link>
        <Link href="/pm/suppliers" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white">Supplier Sourcing</Link>
        <Link href="/procurement" className="flex min-h-11 items-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 text-sm text-emerald-100">Procurement Control</Link>
      </nav>

      <header className="rounded-[2rem] border border-emerald-300/15 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-wrap gap-2"><span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-slate-950">SITE-LEVEL COST</span><span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">NO AVERAGE PRICE</span></div>
        <h1 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">RFQ Price Entry / Bottom-up Cost Control</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">เลือกจุดจริง แล้วบันทึกราคาวัสดุ ขนส่ง ค่าแรง และเครื่องจักรจากหลักฐาน RFQ ระบบคำนวณ Site Cost และ GM หลัง Evidence Gate เท่านั้น</p>
      </header>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        {[["Sites", overview.summary.sites], ["GO", overview.summary.go], ["HOLD", overview.summary.hold], ["Confirmed", overview.summary.confirmed], ["Unconfirmed", overview.summary.unconfirmed]].map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[10px] uppercase tracking-[.14em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{String(value)}</p></article>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 xl:max-h-[78vh] xl:overflow-auto">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">446 Site Cost Sheets</p>
          <div className="mt-3 space-y-2">
            {overview.sites.map((site) => (
              <Link key={site.site_id} href={`/pm/suppliers/rfq/sites?site_id=${site.site_id}`} className={`block rounded-xl border p-3 transition ${site.site_id === selectedId ? "border-emerald-300/30 bg-emerald-400/10" : "border-white/10 bg-slate-950/30 hover:bg-white/5"}`}>
                <div className="flex items-center justify-between gap-2"><strong className="text-sm text-white">{site.site_code}</strong><span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${gateTone(site.commercial_gate)}`}>{site.commercial_gate}</span></div>
                <p className="mt-1 text-xs text-slate-500">{site.province} · {site.installation_type} · {site.unconfirmed_cost_lines} unconfirmed</p>
              </Link>
            ))}
          </div>
        </aside>

        {!detail ? (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-5 text-amber-50">{detailResult?.error || "No site selected"}</div>
        ) : (
          <div className="space-y-5">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs text-slate-500">Selected site</p><h2 className="mt-1 text-2xl font-semibold text-white">{detail.summary.site_code} · {detail.summary.province}</h2><p className="mt-1 text-sm text-slate-400">{detail.summary.district} / {detail.summary.subdistrict} · {detail.summary.installation_type}</p></div><span className={`rounded-full border px-4 py-2 text-sm font-bold ${gateTone(detail.summary.commercial_gate)}`}>{detail.summary.commercial_gate}</span></div>
              <div className="mt-5 grid gap-3 grid-cols-2 md:grid-cols-4">
                {[["Material", baht(detail.summary.material_cost)], ["Freight", baht(detail.summary.freight_cost)], ["Equipment", baht(detail.summary.equipment_cost)], ["Labor", baht(detail.summary.labor_cost)], ["Total Site Cost", baht(detail.summary.total_site_cost)], ["Sell pre-VAT", baht(detail.summary.selling_price_pre_vat)], ["GM", pct(detail.summary.gross_margin)], ["Missing lines", detail.summary.unconfirmed_cost_lines]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-white/10 bg-slate-950/35 p-3"><p className="text-[10px] uppercase text-slate-500">{label}</p><p className="mt-1 font-semibold text-white">{String(value)}</p></div>)}
              </div>
            </section>

            {[...materialGroups.entries()].map(([group, rows]) => {
              const suppliers = detail.suppliers.filter((s) => s.material_group === group);
              return (
                <section key={group} className="rounded-2xl border border-sky-300/15 bg-sky-950/20 p-5">
                  <h3 className="text-lg font-semibold text-white">Material RFQ · {group}</h3>
                  <form action={saveSiteMaterialQuoteAction} className="mt-4 space-y-4">
                    <input type="hidden" name="site_id" value={detail.summary.site_id} /><input type="hidden" name="material_group" value={group} />
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="text-xs text-slate-400">Supplier<select name="supplier_id" required className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white"><option value="">Select supplier</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.supplier_name} · {s.procurement_zone_code}</option>)}</select></label>
                      <label className="text-xs text-slate-400">Quotation ref<input name="quotation_ref" required className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" /></label>
                      <label className="text-xs text-slate-400">Valid until<input name="valid_until" type="date" required className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" /></label>
                      <label className="text-xs text-slate-400">Quoted at<input name="quoted_at" type="date" className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" /></label>
                      <label className="text-xs text-slate-400">Payment terms<input name="payment_terms" className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" /></label>
                      <label className="text-xs text-slate-400">Evidence ref<input name="evidence_ref" placeholder="RFQ/PDF/Drive ref" className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" /></label>
                    </div>
                    <div className="space-y-2">{rows.map((row) => <MaterialRow key={row.id} row={row} />)}</div>
                    <div className="grid gap-3 md:grid-cols-4"><label className="text-xs text-slate-400">Freight amount<input name="freight_amount" type="number" min="0" step="0.01" className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" /></label><label className="text-xs text-slate-400">Origin<input name="freight_origin" className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" /></label><label className="text-xs text-slate-400">Distance km<input name="freight_distance_km" type="number" min="0" step="0.01" className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" /></label><label className="text-xs text-slate-400">Vehicle<input name="freight_vehicle_type" className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" /></label></div>
                    <div className="flex justify-end"><button className="min-h-11 rounded-xl bg-sky-400 px-5 text-sm font-semibold text-slate-950">Confirm Quote + Apply Site Cost</button></div>
                  </form>

                  <details className="mt-4 rounded-xl border border-white/10 bg-slate-950/30 p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-200">CSV Import สำหรับวัสดุกลุ่มนี้</summary><form action={importSiteMaterialCsvAction} className="mt-4 space-y-3"><input type="hidden" name="site_id" value={detail.summary.site_id} /><input type="hidden" name="material_group" value={group} /><div className="grid gap-3 md:grid-cols-3"><label className="text-xs text-slate-400">Supplier<select name="supplier_id" required className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white"><option value="">Select supplier</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}</select></label><label className="text-xs text-slate-400">Quotation ref<input name="quotation_ref" required className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white" /></label><label className="text-xs text-slate-400">Valid until<input name="valid_until" type="date" required className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white" /></label></div><textarea name="csv_text" required rows={6} placeholder={'material_cost_id,unit_price,surcharge_amount,discount_amount\n...'} className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 font-mono text-xs text-white" /><div className="flex justify-end"><button className="min-h-11 rounded-xl border border-sky-300/30 bg-sky-400/10 px-5 text-sm font-semibold text-sky-100">Import CSV + Evidence Gate</button></div></form></details>
                </section>
              );
            })}

            {(["labor", "equipment"] as const).map((type) => {
              const rows = type === "labor" ? detail.labor : detail.equipment;
              if (!rows.length) return null;
              return <section key={type} className="rounded-2xl border border-white/10 bg-white/5 p-5"><h3 className="text-lg font-semibold capitalize text-white">{type} rate confirmation</h3><form action={saveSiteRateBatchAction} className="mt-4 space-y-3"><input type="hidden" name="site_id" value={detail.summary.site_id} /><input type="hidden" name="rate_type" value={type} /><div className="grid gap-3 md:grid-cols-2"><label className="text-xs text-slate-400">Evidence ref<input name="evidence_ref" required className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white" /></label><label className="text-xs text-slate-400">Valid until<input name="valid_until" type="date" required className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white" /></label></div><div className="space-y-2">{rows.map((row) => <RateRow key={row.id} row={row} type={type} />)}</div><div className="flex justify-end"><button className="min-h-11 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950">Confirm {type} rates</button></div></form></section>;
            })}
          </div>
        )}
      </div>
    </section>
  );
}
