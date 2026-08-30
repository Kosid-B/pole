import Link from "next/link";
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
  emphasis = false,
}: {
  label: string;
  value: string;
  detail?: string;
  emphasis?: boolean;
}) {
  return (
    <article
      className={`rounded-3xl border p-5 ${
        emphasis
          ? "border-sky-300/30 bg-sky-400/10 shadow-[0_18px_50px_rgba(14,165,233,0.12)]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
      {detail ? <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p> : null}
    </article>
  );
}

const tierText: Record<string, string> = {
  A: "text-sky-300",
  B: "text-emerald-300",
  C: "text-cyan-300",
};

const tierBar: Record<string, string> = {
  A: "bg-sky-400",
  B: "bg-emerald-400",
  C: "bg-cyan-400",
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
  const referencePrice = (
    installationType: "G63" | "G64",
    area: (typeof sizes)[number],
    tier: (typeof tiers)[number],
  ) =>
    referenceRows.find(
      (row) =>
        row.installation_type === installationType &&
        Number(row.area_m2) === area &&
        row.tier === tier,
    )?.reference_price_vat ?? null;

  const maxReferencePrice = Math.max(
    ...referenceRows.map((row) => Number(row.reference_price_vat) || 0),
    1,
  );

  return (
    <section className="space-y-8 pb-8">
      <nav
        aria-label="SiteCost module switcher"
        className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-slate-950/60 p-1.5 sm:w-fit"
      >
        <Link
          href="/commercial"
          aria-current="page"
          className="flex min-h-12 items-center justify-center rounded-xl bg-sky-400 px-5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/20"
        >
          Commercial / Pricing
        </Link>
        <Link
          href="/pm"
          className="flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          PM Control
        </Link>
      </nav>

      <header className="overflow-hidden rounded-[2rem] border border-sky-300/10 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950 p-6 shadow-xl shadow-slate-950/20 sm:p-8">
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

        <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              สรุปราคาขายงานลานตาก
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              เริ่มจากราคาที่ต้องใช้ตัดสินใจจริงก่อน แล้วค่อยเปิดรายละเอียด Tier,
              Package และจังหวัดเมื่อจำเป็น เพื่อให้ทีมขายใช้ข้อมูลชุดเดียวกับ PM
              โดยไม่เห็นข้อมูลจัดซื้อภายใน
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:w-[360px]">
            <a
              href="#price-guide"
              className="flex min-h-12 items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              ดูราคาแนะนำ
            </a>
            <a
              href="#province-view"
              className="flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
            >
              ดูราคาตามจังหวัด
            </a>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="ราคาขายรวม VAT"
          value={million(data.summary.total_quote_vat)}
          detail={`VAT ${(data.summary.vat_rate * 100).toFixed(0)}% • ${data.summary.published_quotes} published quotes`}
          emphasis
        />
        <Kpi
          label="จุดติดตั้ง"
          value={`${data.summary.site_count.toLocaleString("th-TH")} จุด`}
          detail="Live baseline ของโครงการ"
        />
        <Kpi
          label="Package mix"
          value={`G63 ${g63?.site_count || 0} / G64 ${g64?.site_count || 0}`}
          detail={`${g63 ? million(Number(g63.total_price_vat)) : "-"} / ${g64 ? million(Number(g64.total_price_vat)) : "-"}`}
        />
        <Kpi
          label="Gross Margin"
          value={`${(data.summary.gross_margin * 100).toFixed(0)}%`}
          detail="Live Pricing Engine"
        />
      </div>

      <section id="price-guide" className="scroll-mt-8 space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-300">QUICK DECISION</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              ราคาอ้างอิงที่ใช้คุยกับลูกค้าได้เร็ว
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
              แสดง Tier B เป็นราคากลางก่อน ลดจำนวนตัวเลือกที่ต้องประมวลผล แล้วเปิด
              Tier A/C เมื่อจำเป็น
            </p>
          </div>
          <span className="w-fit rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
            Default decision price = Tier B
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {sizes.map((area) => {
            const tierA = Number(referencePrice("G63", area, "A") || 0);
            const tierB = Number(referencePrice("G63", area, "B") || 0);
            const tierC = Number(referencePrice("G63", area, "C") || 0);

            return (
              <article
                key={area}
                className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 transition hover:border-sky-300/25 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-400">G63 • Tier B</p>
                    <h3 className="mt-1 text-xl font-semibold text-white">
                      {area.toLocaleString("th-TH")} ตร.ม.
                    </h3>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                    ราคากลาง
                  </span>
                </div>
                <p className="mt-6 text-3xl font-semibold tracking-tight text-emerald-300">
                  {tierB ? baht(tierB) : "-"}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  ช่วง Tier A–C: {tierA ? baht(tierA) : "-"} – {tierC ? baht(tierC) : "-"}
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                  {tiers.map((tier) => {
                    const value = Number(referencePrice("G63", area, tier) || 0);
                    return (
                      <div key={tier} className="rounded-xl border border-white/8 bg-slate-950/30 p-2.5">
                        <p className={`font-semibold ${tierText[tier]}`}>Tier {tier}</p>
                        <p className="mt-1 text-slate-300">
                          {value ? new Intl.NumberFormat("th-TH").format(value) : "-"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-300">VISUAL COMPARISON</p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              G63 • ราคาเทียบตามขนาดและ Tier
            </h2>
          </div>
          <p className="text-xs text-slate-400">Reference Catalog • รวม VAT 7%</p>
        </div>

        <div className="mt-7 grid min-h-[250px] grid-cols-3 items-end gap-4 sm:gap-8">
          {sizes.map((area) => (
            <div key={area} className="space-y-3">
              <div className="flex h-[190px] items-end justify-center gap-1.5 sm:gap-3">
                {tiers.map((tier) => {
                  const price = Number(referencePrice("G63", area, tier) || 0);
                  const height = Math.max(28, Math.round((price / maxReferencePrice) * 180));
                  return (
                    <div key={tier} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                      <span className="mb-2 hidden text-[10px] font-medium text-slate-400 sm:block">
                        {price ? new Intl.NumberFormat("th-TH").format(price) : "-"}
                      </span>
                      <div
                        className={`w-full max-w-12 rounded-t-lg ${tierBar[tier]}`}
                        style={{ height: `${height}px` }}
                        title={`Tier ${tier}: ${price ? baht(price) : "-"}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="text-center">
                <p className="font-semibold text-white">{area.toLocaleString("th-TH")} ตร.ม.</p>
                <p className="mt-1 text-xs text-slate-500">
                  {area === 120 ? "12 × 10 ม." : area === 192 ? "16 × 12 ม." : "18 × 14 ม."}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-4 text-xs text-slate-300">
          {tiers.map((tier) => (
            <span key={tier} className="inline-flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${tierBar[tier]}`} /> Tier {tier}
            </span>
          ))}
        </div>
      </article>

      <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-7 text-amber-50/90">
        <strong className="text-amber-100">Source-of-truth guardrail:</strong>{" "}
        Live Project Baseline เป็นฐานการเงินจริงของ 446 จุด ส่วนตัวเลขจากภาพถูกเก็บ
        เป็น Reference Catalog เท่านั้น และยังไม่อนุมัติให้สร้าง Quote อัตโนมัติ
        เพื่อไม่ให้ตัวเลขหน้าขายทับงบ PM โดยไม่ตั้งใจ
      </div>

      <details className="group rounded-3xl border border-white/10 bg-white/5">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-white sm:px-6">
          <span>
            ดู Price Matrix เต็ม • G63 / G64 / 120 / 192 / 252 ตร.ม. / Tier A–C
          </span>
          <span className="text-xl text-slate-400 transition group-open:rotate-45">+</span>
        </summary>
        <div className="border-t border-white/10 px-5 pb-6 pt-4 sm:px-6">
          <div className="overflow-x-auto">
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
                        const price = referencePrice(g, area, tier);
                        return (
                          <td
                            key={tier}
                            className={`px-3 py-3 text-right font-semibold ${tierText[tier]}`}
                          >
                            {price ? baht(Number(price)) : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </details>

      <div id="province-view" className="grid scroll-mt-8 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p className="text-sm font-medium text-sky-300">PROVINCE VIEW</p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            ราคาขายรวมแยกตามจังหวัด
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            แสดง 10 จังหวัดแรกเพื่อสแกนเร็ว แล้วใช้ข้อมูลชุดเดียวกับ PM สำหรับการวาง Cluster
          </p>
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
                {data.province_summary.slice(0, 10).map((row) => (
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
          <article className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="text-sm font-medium text-sky-300">TIER</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Tier คืออะไร?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              ใช้ Tier เป็นตัวสะท้อนต้นทุนพื้นที่ โดยให้ Tier B เป็นจุดอ้างอิงกลาง
            </p>
            <div className="mt-5 space-y-3">
              {data.tier_summary.map((row) => (
                <div key={row.tier} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-lg font-semibold ${tierText[row.tier]}`}>
                      Tier {row.tier}
                    </p>
                    {row.tier === "B" ? (
                      <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                        DEFAULT
                      </span>
                    ) : null}
                  </div>
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

          <article className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="text-sm font-medium text-sky-300">PACKAGE</p>
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

      <section className="rounded-[2rem] border border-emerald-300/15 bg-gradient-to-r from-emerald-950/80 to-slate-950 p-6 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-300">NEXT DECISION</p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              ราคาพร้อมแล้ว → ไปดูความพร้อมด้านเงินสดและ Procurement
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              PM Module จะใช้ราคาและ Scope ชุดเดียวกัน แต่เพิ่ม BAC, Advance,
              Supplier/PO, Framework Agreement และ Cash Flow
            </p>
          </div>
          <Link
            href="/pm"
            className="flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 px-6 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            เปิด PM Control →
          </Link>
        </div>
      </section>
    </section>
  );
}
