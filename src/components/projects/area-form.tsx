const inputClassName =
  "min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-600 hover:border-white/15 focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-300/20";

function RequiredTag() {
  return (
    <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-500">
      จำเป็น
    </span>
  );
}

export function AreaForm() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="initialArea.name" className="text-sm font-medium text-slate-200">
            ชื่อพื้นที่เริ่มต้น
          </label>
          <RequiredTag />
        </div>
        <input
          id="initialArea.name"
          name="initialArea.name"
          type="text"
          required
          className={inputClassName}
          placeholder="เช่น Cluster เชียงใหม่ A"
        />
        <p className="text-xs leading-5 text-slate-500">
          ใช้ชื่อที่ทีมหน้างานและ PM เข้าใจตรงกัน
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="initialArea.province" className="text-sm font-medium text-slate-200">
            จังหวัด
          </label>
          <RequiredTag />
        </div>
        <input
          id="initialArea.province"
          name="initialArea.province"
          type="text"
          autoComplete="address-level1"
          required
          className={inputClassName}
          placeholder="เช่น เชียงใหม่"
        />
        <p className="text-xs leading-5 text-slate-500">
          ใช้สำหรับจัดกลุ่มพื้นที่ Supplier และการรายงานระดับจังหวัด
        </p>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="initialArea.targetUnits" className="text-sm font-medium text-slate-200">
            เป้าหมายของพื้นที่เริ่มต้น
          </label>
          <RequiredTag />
        </div>
        <input
          id="initialArea.targetUnits"
          name="initialArea.targetUnits"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          required
          aria-describedby="initial-area-target-help"
          className={inputClassName}
          placeholder="600"
        />
        <p id="initial-area-target-help" className="text-xs leading-5 text-slate-500">
          สามารถเพิ่มพื้นที่อื่นภายหลังได้ โดยเป้าหมายรวมของโครงการยังคงเป็น baseline หลัก
        </p>
      </div>
    </div>
  );
}
