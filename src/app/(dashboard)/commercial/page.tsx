import { getCommercialOverview } from "@/lib/drying-yard-modules";

function baht(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function million(value: number) {
  return `${new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 2,
  }).format(value / 1_000_000)} ลบ.`;
}

function Kpi({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
      {detail ? <p className="mt-2 text-sm text-slate-400">{detail}</p> : null}
    </article>
  );
}

const tierClass: Record<string, string> = {
  A: "text-sky-300",
  B: "text-emerald-300",
  C: "text-cyan-300",
};

export default async function CommercialPage() {
  const result = await getCommercialOverview();

  if (!result.data) {
    return (
      <section className="space-y-6">
        <div>
          <p className="text-sm font-medium text-sky-300">Commercial / Pricing</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            สรุปราคาขายงานลานตาก
          </h1>
        </div>
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50">
          <p className="font-semibold">Commercial module ยังเชื่อมข้อมูลไม่ได้</p>
          <p className="mt-2 text-sm text-amber-50/80">{result.error}</p>
          <p className="mt-4 rounded-2xl bg-slate-950/40 p-4 font-mono text-xs text-slate-300">
            DRYING_YARD_ADMIN_ACCESS_CODE=...
          </p>
        </div>
      </section>
    );
  }

  const data = result.data;
  const g63 = data.g_summary.find((row) => row.installation_type === "G63");
  const g64 = data.g_summary.find((row) => row.installation_type === "G64");
  const referenceRows = data.reference_catalog.rows;
  const sizes = [120, 192, 252] as const;
  const tiers = ["A", "B", "C"] as const;

  return (
    <section className="space-y-8">
      <header className="rounded-[2rem] border border-sky-300/10 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950 p-6 shadow-xl shadow-slate-950/20 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200">
            COMMERCIAL / PRICING
          </span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            Live Project Baseline
          </span>
          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">
            Reference Catalog {data.reference_catalog.catalog_version || "-"}
          </span>
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          สรุปราคาขายงานลานตาก
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          หน้าขายแยกจาก PM อย่างชัดเจน: ราคา, Tier, G63/G64, ขนาดลาน,
          จังหวัด และ Quote อยู่ที่นี่ ส่วนต้นทุนภายใน, Supplier, Cash Flow และ
          Procurement อยู่ใน PM Module
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi
          label="จุดติดตั้ง"
          value={data.summary.site_count.toLocaleString("th-TH")}
          detail={`${data.summary.published_quotes} published quotes`}
        />
        <Kpi
          label="ราคาขายรวม VAT"
          value={million(data.summary.total_quote_vat)}
          detail={`VAT ${(data.summary.vat_rate * 100).toFixed(0)}%`}
        />
        <Kpi
          label="G63"
          value={`${g63?.site_count || 0} จุด`}
          detail={g63 ? million(Number(g63.total_price_vat)) : "-"}
        />
        <Kpi
          label="G64"
          value={`${g64?.site_count || 0} จุด`}
          detail={g64 ? million(Number(g64.total_price_vat)) : "-"}
        />
        <Kpi
          label="Gross Margin"
          value={`${(data.summary.gross_margin * 100).toFixed(0)}%`}
          detail="Live Pricing Engine"
        />
      </div>

      <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-7 text-amber-50/90">
        <strong className="text-amber-100">Source-of-truth guardrail:</strong>{" "}
        Live Project Baseline เป็นฐานการเงินจริงของ 446 จุด ส่วนตัวเลขใน Price
        Catalog จากภาพถูกเก็บเป็น Reference เท่านั้น และยังไม่อนุมัติให้สร้าง Quote
        อัตโนมัติ เพื่อไม่ให้ตัวเลขหน้าขายทับงบ PM โดยไม่ตั้งใจ
      </div>

      <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-300">1. PRICE CATALOG</p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              ราคาขายต่อจุด แยกตาม G / ขนาด / Tier
            </h2>
          </div>
          <p className="text-xs text-slate-400">รวม VAT 7%</p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.12em] text-slate-400">
              <tr className="border-b border-white/10">
                <th className="px-3 py-3">Package</th>
                <th className="px-3 py-3">ขนาด</th>
                <th className="px-3 py-3 text-right text-sky-300">Tier A</th>
                <th className="px-3 py-3 text-right text-emerald-300">Tier B</th>
                <th className="px-3 py-3 text-right text-cyan-300">Tier C</th>
              </tr>
            </thead>
            <tbody>
              {(["G63", "G64"] as const).flatMap((g) =>
                sizes.map((area) => (
                  <tr key={`${g}-${area}`} className="border-b border-white/5">
                    <td className="px-3 py-3 font-semibold text-white">{g}</td>
                    <td className="px-3 py-3 text-slate-300">
                      {area.toLocaleString("th-TH")} ตร.ม.
                    </td>
                    {tiers.map((tier) => {
                      const price = referenceRows.find(
                        (row) =>
                          row.installation_type === g &&
                          Number(row.area_m2) === area &&
                          row.tier === tier,
                      );
                      return (
                        <td
                          key={tier}
                          className={`px-3 py-3 text-right font-semibold ${tierClass[tier]}`}
                        >
                          {price ? baht(Number(price.reference_price_vat)) : "-"}
                        </td>
                      );
                    })}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </article>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-medium text-sky-300">2. PROVINCE VIEW</p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            ราคาขายรวมแยกตามจังหวัด
          </h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead className="text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="px-3 py-3">จังหวัด</th>
                  <th className="px-3 py-3 text-right">จุด</th>
                  <th className="px-3 py-3 text-right">อำเภอ</th>
                  <th className="px-3 py-3 text-right">Concrete</th>
                  <th className="px-3 py-3 text-right">รวม VAT</th>
                </tr>
              </thead>
              <tbody>
                {data.province_summary.slice(0, 15).map((row) => (
                  <tr key={row.province} className="border-b border-white/5 text-slate-300">
                    <td className="px-3 py-3 font-medium text-white">{row.province}</td>
                    <td className="px-3 py-3 text-right">{row.site_count}</td>
                    <td className="px-3 py-3 text-right">{row.district_count}</td>
                    <td className="px-3 py-3 text-right">
                      {Number(row.avg_concrete_unit_cost).toLocaleString("th-TH", {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-sky-200">
                      {baht(Number(row.total_price_vat))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-medium text-sky-300">3. TIER</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Tier คืออะไร?</h2>
            <div className="mt-5 space-y-4">
              {data.tier_summary.map((row) => (
                <div key={row.tier} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <p className={`text-lg font-semibold ${tierClass[row.tier]}`}>
                    Tier {row.tier}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {row.site_count} จุด • Concrete {Number(row.concrete_unit_cost).toLocaleString("th-TH")} บาท/ลบ.ม.
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Live avg {baht(Number(row.avg_price_vat))}/จุด
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-medium text-sky-300">4. PACKAGE</p>
            <h2 className="mt-1 text-xl font-semibold text-white">G63 / G64</h2>
            <div className="mt-5 space-y-4">
              {data.package_catalog.map((pkg) => (
                <div key={pkg.installation_type} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <p className="text-lg font-semibold text-white">{pkg.installation_type}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    เสา {pkg.pole_type || "-"} • {pkg.pole_qty} ต้น/จุด
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pkg.components.map((component) => (
                      <span
                        key={component}
                        className="rounded-full border border-sky-300/10 bg-sky-400/10 px-3 py-1 text-xs text-sky-100"
                      >
                        {component}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
