import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getDryingYardOverview, summarizeDryingYard } from "@/lib/drying-yard";

function million(value: number) {
  return `${new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(value / 1_000_000)} ลบ.`;
}

export default async function DryingYardPricingPage() {
  const session = await requireSession();
  if (session.user.role === "FIELD_LEADER") redirect("/drying-yard");

  const result = await getDryingYardOverview();
  if (!result.data) {
    return <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-100">{result.error}</div>;
  }

  const summary = summarizeDryingYard(result.data.sites);
  const gm = Number(result.data.pricing_settings?.gross_margin || 0.32);
  const vat = Number(result.data.pricing_settings?.vat_rate || 0.07);
  const groups = ["G63", "G64"].map((g) => {
    const rows = result.data!.sites.filter((site) => site.installation_type === g);
    const s = summarizeDryingYard(rows);
    return { g, ...s };
  });
  const max = Math.max(...groups.flatMap((g) => [g.cost, g.salePreVat, g.profit]), 1);

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-medium text-sky-300">Admin / Executive</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">ราคา • ต้นทุน • กำไร • GM</h1>
        <p className="mt-2 text-sm text-slate-400">สูตรราคาขายก่อน VAT = ต้นทุน ÷ (1 − GM) • VAT ไม่ใช่กำไร</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["ต้นทุนรวม", million(summary.cost)],
          ["ขายก่อน VAT", million(summary.salePreVat)],
          ["VAT", million(summary.vat)],
          ["ขายรวม VAT", million(summary.finalPrice)],
          ["กำไรรวม", million(summary.profit)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{value}</p></article>
        ))}
      </div>

      <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-xl font-semibold text-white">Gross Margin Control</h2><p className="mt-1 text-sm text-slate-400">ค่าปัจจุบันจาก Supabase pricing settings</p></div>
          <div className="text-right"><p className="text-3xl font-semibold text-sky-300">{(gm * 100).toFixed(1)}%</p><p className="text-xs text-slate-400">VAT {(vat * 100).toFixed(1)}%</p></div>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400" style={{ width: `${((gm * 100 - 25) / 7) * 100}%` }} /></div>
        <div className="mt-2 flex justify-between text-xs text-slate-500"><span>25%</span><span>32%</span></div>
        <p className="mt-4 text-sm text-slate-300">การแก้ค่า GM/VAT ใช้ Admin PWA เพื่อยืนยันและบันทึกลงฐานข้อมูล ส่วนหน้านี้อ่านค่ากลางเดียวกันใน SaaS</p>
      </article>

      <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Cost / Sales / Profit แยก G</h2>
        <div className="mt-8 grid h-72 grid-cols-2 gap-10 border-b border-white/10 px-6">
          {groups.map((row) => (
            <div key={row.g} className="flex h-full items-end justify-center gap-3">
              {[
                ["ต้นทุน", row.cost, "bg-sky-500"],
                ["ขาย", row.salePreVat, "bg-emerald-500"],
                ["กำไร", row.profit, "bg-cyan-400"],
              ].map(([label, value, color]) => (
                <div key={String(label)} className="flex h-full flex-1 flex-col justify-end">
                  <span className="mb-2 text-center text-xs text-slate-300">{million(Number(value))}</span>
                  <div className={`rounded-t-lg ${color}`} style={{ height: `${Math.max((Number(value) / max) * 88, 1)}%` }} />
                  <span className="mt-2 text-center text-xs text-slate-500">{label}</span>
                </div>
              ))}
              <span className="absolute" />
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 text-center text-sm font-medium text-white"><span>G63</span><span>G64</span></div>
      </article>
    </section>
  );
}
