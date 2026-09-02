import Link from "next/link";
import { ProjectForm } from "@/components/projects/project-form";
import { createProjectFromForm } from "@/server/actions/projects";

export default function NewProjectPage() {
  return (
    <section className="space-y-6">
      <header className="rounded-[2rem] border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(8,47,73,0.28),rgba(8,15,28,0.92)_58%,rgba(30,41,59,0.78))] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
              Project Setup
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              สร้างโครงการใหม่
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
              เริ่มจากข้อมูลขั้นต่ำที่จำเป็นต่อการเปิดโครงการ แล้วค่อยตั้งทีม Supplier,
              Financial Forecast และ workflow อื่นหลังจากมี Project context แล้ว
            </p>
          </div>

          <Link
            href="/projects"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          >
            ← กลับพอร์ตโครงการ
          </Link>
        </div>

        <ol
          aria-label="ขั้นตอนสร้างโครงการ"
          className="mt-5 grid gap-2 text-sm sm:grid-cols-3"
        >
          <li className="rounded-2xl border border-cyan-300/18 bg-cyan-300/[0.07] px-4 py-3 text-cyan-50">
            <span className="mr-2 font-semibold text-cyan-200">1</span>
            ข้อมูลโครงการ
          </li>
          <li className="rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3 text-slate-300">
            <span className="mr-2 font-semibold text-slate-400">2</span>
            พื้นที่เริ่มต้น
          </li>
          <li className="rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3 text-slate-300">
            <span className="mr-2 font-semibold text-slate-400">3</span>
            บันทึกและเริ่มบริหาร
          </li>
        </ol>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-5 sm:p-6">
          <ProjectForm action={createProjectFromForm} />
        </div>

        <aside className="h-fit rounded-[1.7rem] border border-emerald-300/12 bg-emerald-300/[0.045] p-5 xl:sticky xl:top-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/70">
            Minimum setup
          </p>
          <h3 className="mt-2 text-base font-semibold text-white">
            กรอกเฉพาะสิ่งที่ต้องใช้ตอนเปิดโครงการ
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            <li>• ชื่อและเป้าหมายของโครงการ</li>
            <li>• มูลค่าสัญญาเพื่อใช้เป็น financial baseline</li>
            <li>• พื้นที่แรกเพื่อให้ workflow มี scope ตั้งต้น</li>
          </ul>
          <p className="mt-4 border-t border-white/8 pt-4 text-xs leading-5 text-slate-500">
            ยังไม่ต้องกำหนด Supplier, ทีม, Batch, RFQ หรือ Cash Forecast ในขั้นตอนนี้
          </p>
        </aside>
      </div>
    </section>
  );
}
