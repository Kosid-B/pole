const profiles = [
  { area: 120, dim: "12 × 10 ม.", geotextile: 120, rock: 18, sand: 6, shoulder: 4.4, concrete: 18.35, mesh: 120, rb19: 102.77, form: 6.6, asphalt: 15.7, joint: 40.9 },
  { area: 192, dim: "16 × 12 ม.", geotextile: 192, rock: 28.8, sand: 9.6, shoulder: 5.6, concrete: 29.36, mesh: 192, rb19: 130.8, form: 8.4, asphalt: 20, joint: 52 },
  { area: 252, dim: "18 × 14 ม.", geotextile: 252, rock: 37.8, sand: 12.6, shoulder: 6.4, concrete: 38.535, mesh: 252, rb19: 149.49, form: 9.6, asphalt: 22.9, joint: 59.4 },
];

export default function DryingYardBoqPage() {
  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-medium text-sky-300">BOQ planning profile</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">BOQ งานลานตาก</h1>
        <p className="mt-2 text-sm text-slate-400">G63 และ G64 รองรับพื้นที่ 120 / 192 / 252 ตร.ม. • ปริมาณนี้ใช้สำหรับวางแผนและตรวจสอบก่อน PO</p>
      </header>

      <div className="grid gap-5 xl:grid-cols-3">
        {profiles.map((p) => (
          <article key={p.area} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-semibold text-white">{p.area} ตร.ม.</h2><p className="mt-1 text-sm text-sky-200">{p.dim}</p></div><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">1 จุด</span></div>
            <dl className="mt-5 space-y-2 text-sm">
              {[
                ["Geotextile", `${p.geotextile} ม²`],
                ["หินคลุก 3/4", `${p.rock} ม³`],
                ["ทรายหยาบ", `${p.sand} ม³`],
                ["หินคลุกไหล่ทาง", `${p.shoulder} ม³`],
                ["คอนกรีต ST240", `${p.concrete} ม³`],
                ["Wiremesh SR24 4 mm @0.20m", `${p.mesh} ม²`],
                ["RB19", `≈ ${p.rb19} กก.`],
                ["แบบคอนกรีต", `${p.form} ม²`],
                ["Asphalt", `${p.asphalt} ลิตร`],
                ["Joint cut / seal", `${p.joint} ม.`],
                ["ป้ายโครงการ", "1 ป้าย"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 border-b border-white/5 py-2"><dt className="text-slate-400">{label}</dt><dd className="text-right font-medium text-white">{value}</dd></div>
              ))}
            </dl>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-sky-300/10 bg-sky-400/10 p-5"><h2 className="text-lg font-semibold text-sky-100">G63 Package</h2><p className="mt-2 text-sm leading-7 text-slate-300">ลานปูนตากผลผลิต + CCTV Smart System 1 ชุด + Solar 1 ชุด + เสา G65 1 ต้น + mounting/cable/connectors 1 ชุด</p></article>
        <article className="rounded-3xl border border-emerald-300/10 bg-emerald-400/10 p-5"><h2 className="text-lg font-semibold text-emerald-100">G64 Package</h2><p className="mt-2 text-sm leading-7 text-slate-300">ลานปูนตากผลผลิต + CCTV Smart System 1 ชุด + Speaker Smart System 1 ชุด + Solar 1 ชุด + เสา G69 1 ต้น + mounting/cable/connectors 1 ชุด</p></article>
      </div>

      <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-7 text-amber-50/90">BOQ นี้เป็น planning/checklist profile ไม่ใช่ Final PO โดยเฉพาะ RB19 และราคา Package hardware ต้องตรวจแบบ/BOQ/ใบเสนอราคาล่าสุดก่อนสั่งซื้อจริง</div>
    </section>
  );
}
