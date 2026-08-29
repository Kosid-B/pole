import { KpiCard } from "@/components/dashboard/kpi-card";

const areas = [
  { area: 120, dimensions: "12 × 10 ม.", label: "ลาน 120 ตร.ม." },
  { area: 192, dimensions: "16 × 12 ม.", label: "ลาน 192 ตร.ม." },
  { area: 252, dimensions: "18 × 14 ม.", label: "ลาน 252 ตร.ม." },
] as const;

export default function SiteCostPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
            Site Cost WA
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            งานลานตาก 446 จุด
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-300">
            ใช้ G63/G64 เป็นประเภท Package, ใช้พื้นที่จริง 120 / 192 / 252 ตร.ม.
            และใช้ Tier A/B/C เป็นระดับต้นทุนพื้นที่ โดยไม่ใช้ S/M/L ในหน้าจอหรือโมเดลผู้ใช้
          </p>
        </div>

        <a
          href="/site-cost-wa/index.html"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          เปิด Mobile WA
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Sites" value="446" detail="24 จังหวัด / 83 อำเภอ" />
        <KpiCard label="G63" value="316" detail="ลาน + CCTV Smart + Solar + G65" />
        <KpiCard label="G64" value="130" detail="ลาน + CCTV + Speaker + Solar + G69" />
        <KpiCard label="Pricing" value="GM 25–32%" detail="VAT และต้นทุนพื้นที่แยกคำนวณ" />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-5 py-4">
          <h3 className="font-semibold text-white">พื้นที่ลานมาตรฐานที่ยืนยัน</h3>
          <p className="mt-1 text-sm text-slate-300">
            G เป็นประเภทงาน ไม่ใช่ขนาดลาน และ Tier เป็นตัวปรับต้นทุนพื้นที่ ไม่ใช่รหัส G
          </p>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-3">
          {areas.map((row) => (
            <div key={row.area} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <div className="text-lg font-semibold text-white">{row.label}</div>
              <div className="mt-1 text-sm text-slate-300">{row.dimensions}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-sky-300/20 bg-sky-400/10 p-5 text-sm leading-6 text-sky-50">
          <strong className="block text-base">G = Package</strong>
          G63 และ G64 บอกองค์ประกอบงานของแต่ละจุดติดตั้ง
        </div>
        <div className="rounded-[2rem] border border-amber-300/20 bg-amber-400/10 p-5 text-sm leading-6 text-amber-50">
          <strong className="block text-base">Tier = Area Cost</strong>
          A/B/C ใช้กับราคาคอนกรีตและ Logistics ของอำเภอ
        </div>
        <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-400/10 p-5 text-sm leading-6 text-emerald-50">
          <strong className="block text-base">Kamphaeng Phet Base</strong>
          Mobile WA มี Dropdown ค่าแรง วัสดุ และเครื่องจักร โดยใช้ BOQ กำแพงเพชรเป็นฐานและแสดงตัวปรับจังหวัดก่อนคำนวณ
        </div>
      </div>
    </section>
  );
}
