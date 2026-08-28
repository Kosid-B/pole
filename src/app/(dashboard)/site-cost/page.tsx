import { KpiCard } from "@/components/dashboard/kpi-card";

const sizePrices = [
  { size: "S", dimensions: "12 × 10 m", area: 120, tierA: 205010.51, tierB: 209470.68, tierC: 216818.26 },
  { size: "M", dimensions: "16 × 12 m", area: 192, tierA: 313277.23, tierB: 320371.26, tierC: 332085.18 },
  { size: "L", dimensions: "18 × 14 m", area: 252, tierA: 402711.15, tierB: 411994.21, tierC: 427340.87 },
] as const;

const money = (value: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(value);

export default function SiteCostPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
          Site Cost WA
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          งานลานตาก 446 จุด
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-300">
          Pricing model: จังหวัด + G63/G64 + Size S/M/L → Cost Base → Gross Margin 25–32% → VAT.
          Backend รองรับ Size แยกตามจังหวัดและหมายเลข G แล้ว
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Sites" value="446" detail="24 provinces / 83 districts" />
        <KpiCard label="G63" value="316" detail="ลานปูน + CCTV Smart System" />
        <KpiCard label="G64" value="130" detail="ลานปูน + CCTV + Speaker Smart System" />
        <KpiCard label="Confirmed Mapping" value="36 / 36" detail="Province + G pairs confirmed" />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-5 py-4">
          <h3 className="font-semibold text-white">ราคาอ้างอิงตาม Size</h3>
          <p className="mt-1 text-sm text-slate-300">
            GM 32%, VAT 7%, freight 1,000 บาท/จุด. ราคาด้านล่างเป็นราคารวม VAT ต่อจุด
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950/40 text-slate-300">
              <tr>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">แบบ</th>
                <th className="px-5 py-3">พื้นที่</th>
                <th className="px-5 py-3">Tier A</th>
                <th className="px-5 py-3">Tier B</th>
                <th className="px-5 py-3">Tier C</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-slate-100">
              {sizePrices.map((row) => (
                <tr key={row.size}>
                  <td className="px-5 py-4 font-semibold">{row.size}</td>
                  <td className="px-5 py-4">{row.dimensions}</td>
                  <td className="px-5 py-4">{row.area.toLocaleString("th-TH")} ตร.ม.</td>
                  <td className="px-5 py-4">{money(row.tierA)}</td>
                  <td className="px-5 py-4">{money(row.tierB)}</td>
                  <td className="px-5 py-4">{money(row.tierC)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-400/10 p-5 text-sm leading-6 text-emerald-50">
        Supabase pricing engine ใช้ Province + installation_type (G63/G64) เพื่อเลือก Size แล้วคำนวณแต่ละ site โดยอัตโนมัติ.
        UI สำหรับแก้ mapping รายคู่ G จะเชื่อมเข้าหน้านี้ในขั้น integration ถัดไป โดยไม่เปลี่ยนสูตรราคาเดิม
      </div>
    </section>
  );
}
