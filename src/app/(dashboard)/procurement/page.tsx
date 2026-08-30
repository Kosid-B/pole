import Link from "next/link";
import { getProcurementOverview } from "@/lib/drying-yard-modules";

function baht(value: number) {
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

function Kpi({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
      {detail ? <p className="mt-2 text-sm text-slate-400">{detail}</p> : null}
    </article>
  );
}

function statusClass(status: string | null) {
  if (status === "awarded" || status === "active") return "text-emerald-300";
  if (status === "rfq" || status === "quoted") return "text-amber-200";
  return "text-slate-300";
}

export default async function ProcurementPage() {
  const result = await getProcurementOverview();

  if (!result.data) {
    return (
      <section className="space-y-6">
        <div>
          <p className="text-sm font-medium text-emerald-300">Procurement</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Cluster Procurement Control</h1>
        </div>
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50">
          <p className="font-semibold">Procurement module ยังเชื่อมข้อมูลไม่ได้</p>
          <p className="mt-2 text-sm text-amber-50/80">{result.error}</p>
        </div>
      </section>
    );
  }

  const data = result.data;
  const summary = data.summary;

  return (
    <section className="space-y-8">
      <header className="rounded-[2rem] border border-emerald-300/10 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 p-6 shadow-xl shadow-slate-950/20 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            PROCUREMENT MODULE
          </span>
          <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200">
            Framework Agreement by Cluster
          </span>
        </div>
        <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Procurement Control
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
              รวม Volume ระดับจังหวัด/Cluster เพื่อเปิด RFQ Supplier A/B/C, เปรียบเทียบ Total Delivered Cost,
              ทำ Primary/Backup Award และผูก Customer Direct Pay กับ Framework Agreement ชุดเดียวกับ PM
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/pm" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">
              PM Control
            </Link>
            <Link href="/commercial" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">
              Commercial / Pricing
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Clusters" value={number(summary.clusters)} detail={`${number(summary.sites)} จุด`} />
        <Kpi label="Concrete Volume" value={`${number(summary.volume, 2)} m³`} detail="240 ksc forecast" />
        <Kpi label="Saving Target" value={baht(summary.target_saving)} detail="Weighted target ≈ 100 บาท/m³" />
        <Kpi label="Award Coverage" value={`${number(summary.coverage_pct, 1)}%`} detail={`${number(summary.awarded_clusters)} clusters awarded`} />
        <Kpi label="Awarded Saving" value={baht(summary.awarded_saving)} detail={`${number(summary.weighted_awarded_saving_per_m3, 1)} บาท/m³ weighted`} />
      </div>

      <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-300">CLUSTER REGISTER</p>
            <h2 className="mt-1 text-xl font-semibold text-white">จังหวัด / RFQ / Award / Customer Funding</h2>
          </div>
          <p className="text-xs text-slate-400">เรียงตาม Forecast Volume สูงสุด</p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.1em] text-slate-400">
              <tr className="border-b border-white/10">
                <th className="px-3 py-3">Cluster</th>
                <th className="px-3 py-3 text-right">Sites</th>
                <th className="px-3 py-3 text-right">Volume</th>
                <th className="px-3 py-3 text-right">Benchmark</th>
                <th className="px-3 py-3 text-right">Target</th>
                <th className="px-3 py-3">RFQ</th>
                <th className="px-3 py-3">Supplier A / B / C</th>
                <th className="px-3 py-3">Award</th>
                <th className="px-3 py-3 text-right">Saving</th>
                <th className="px-3 py-3">Customer funding</th>
              </tr>
            </thead>
            <tbody>
              {data.clusters.map((cluster) => (
                <tr key={cluster.id} className="border-b border-white/5 align-top text-slate-300">
                  <td className="px-3 py-4">
                    <p className="font-semibold text-white">{cluster.province}</p>
                    <p className="mt-1 text-xs text-slate-500">{cluster.cluster_name}</p>
                  </td>
                  <td className="px-3 py-4 text-right">{number(cluster.forecast_sites)}</td>
                  <td className="px-3 py-4 text-right">{number(cluster.forecast_volume_m3, 2)} m³</td>
                  <td className="px-3 py-4 text-right">{baht(cluster.benchmark_delivered_rate)}</td>
                  <td className="px-3 py-4 text-right text-emerald-300">
                    {baht(cluster.target_rate)}
                    <span className="mt-1 block text-xs text-slate-500">-{number(cluster.target_saving_per_m3)} /m³</span>
                  </td>
                  <td className={`px-3 py-4 font-medium ${statusClass(cluster.rfq_status)}`}>
                    {cluster.rfq_status || "planning"}
                  </td>
                  <td className="px-3 py-4">
                    <div className="space-y-2">
                      {cluster.bids.map((bid) => (
                        <div key={bid.id} className="rounded-xl border border-white/5 bg-slate-950/30 px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-white">{bid.supplier_slot}: {bid.supplier_name || "ยังไม่กรอก"}</span>
                            <span className="text-xs text-slate-400">
                              {bid.base_rate ? baht(bid.effective_delivered_cost) : "-"}
                            </span>
                          </div>
                          {bid.payment_terms ? <p className="mt-1 text-xs text-slate-500">{bid.payment_terms}</p> : null}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-medium text-white">{cluster.awarded_supplier_name || "ยังไม่ Award"}</p>
                    {cluster.awarded_effective_rate != null ? (
                      <p className="mt-1 text-xs text-slate-400">{baht(cluster.awarded_effective_rate)}/m³</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-4 text-right text-emerald-300">
                    {cluster.awarded_effective_rate == null ? "-" : baht(cluster.awarded_saving_total)}
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-medium text-white">{cluster.funding?.funding_mode || cluster.customer_payment_mode || "ยังไม่กำหนด"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {cluster.funding?.funded_pct ?? cluster.customer_funded_pct ?? 0}% • {cluster.funding?.payment_trigger || "payment trigger pending"}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div className="rounded-3xl border border-sky-300/20 bg-sky-400/10 p-5 text-sm leading-7 text-sky-50/90">
        <strong className="text-sky-100">PM guardrail:</strong> Award ควรใช้ Total Delivered Cost ไม่ใช่ Base Rate อย่างเดียว และ Customer Direct Pay / Material Advance ต้องถูกหักจากงวดสัญญา ไม่ใช่คิดเพิ่มจาก Contract Value
      </div>
    </section>
  );
}
