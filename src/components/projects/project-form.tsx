import Link from "next/link";
import { AreaForm } from "@/components/projects/area-form";

type ProjectFormProps = {
  action: (formData: FormData) => Promise<void>;
};

const inputClassName =
  "min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-600 hover:border-white/15 focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-300/20";

function RequiredTag() {
  return (
    <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-500">
      จำเป็น
    </span>
  );
}

export function ProjectForm({ action }: ProjectFormProps) {
  return (
    <form action={action} className="space-y-5">
      <fieldset className="rounded-[1.6rem] border border-cyan-300/12 bg-cyan-300/[0.035] p-4 sm:p-5">
        <legend className="px-1 text-sm font-semibold text-cyan-100">
          ขั้นที่ 1 • ข้อมูลโครงการ
        </legend>

        <p id="project-core-help" className="mt-1 text-sm leading-6 text-slate-400">
          ระบุ baseline ที่ใช้ร่วมกันทุกโมดูล ข้อมูลส่วนนี้ควรตรวจสอบได้จากสัญญาหรือขอบเขตงาน
        </p>

        <div className="mt-4 space-y-4" aria-describedby="project-core-help">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="name" className="text-sm font-medium text-slate-200">
                ชื่อโครงการ
              </label>
              <RequiredTag />
            </div>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              className={inputClassName}
              placeholder="เช่น งานปรับปรุงลานตาก จังหวัดเชียงใหม่"
            />
            <p className="text-xs leading-5 text-slate-500">
              ใช้ชื่อที่ทีมเห็นแล้วระบุโครงการได้ทันที
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="contractValue" className="text-sm font-medium text-slate-200">
                  มูลค่าสัญญา
                </label>
                <RequiredTag />
              </div>
              <div className="relative">
                <input
                  id="contractValue"
                  name="contractValue"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="1"
                  required
                  aria-describedby="contract-value-help"
                  className={`${inputClassName} pr-14`}
                  placeholder="5000000"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-medium text-slate-500"
                >
                  บาท
                </span>
              </div>
              <p id="contract-value-help" className="text-xs leading-5 text-slate-500">
                ใช้เป็น baseline ระดับ Portfolio; ยังไม่ใช่ cash received
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="targetUnits" className="text-sm font-medium text-slate-200">
                  เป้าหมายรวมของโครงการ
                </label>
                <RequiredTag />
              </div>
              <input
                id="targetUnits"
                name="targetUnits"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                required
                aria-describedby="target-units-help"
                className={inputClassName}
                placeholder="1200"
              />
              <p id="target-units-help" className="text-xs leading-5 text-slate-500">
                จำนวนหน่วยงานหลัก เช่น จุด, ชุด, ต้น หรือหน่วยที่ใช้ติดตามความคืบหน้า
              </p>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-4 sm:p-5">
        <legend className="px-1 text-sm font-semibold text-white">
          ขั้นที่ 2 • พื้นที่เริ่มต้น
        </legend>
        <p id="initial-area-help" className="mt-1 text-sm leading-6 text-slate-400">
          ทุกโครงการต้องมีพื้นที่เริ่มต้นอย่างน้อย 1 พื้นที่ เพื่อให้ทีมและรายงานหน้างานมี scope ที่ชัดเจนตั้งแต่วันแรก
        </p>
        <div className="mt-4" aria-describedby="initial-area-help">
          <AreaForm />
        </div>
      </fieldset>

      <div className="flex flex-col-reverse gap-2 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/projects"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
        >
          ยกเลิก
        </Link>
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          บันทึกและเปิดโครงการ
        </button>
      </div>
    </form>
  );
}
