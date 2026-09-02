import Link from "next/link";
import { ProjectTable } from "@/components/projects/project-table";
import { SITECOST_PROJECT_TEMPLATES } from "@/lib/sitecost-saas";
import { listProjects } from "@/server/queries/projects";

function formatBaht(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function ProjectsPage() {
  const projects = await listProjects();
  const totalAreas = projects.reduce((sum, project) => sum + project.areas.length, 0);
  const activeProjects = projects.filter((project) => project.status === "ACTIVE").length;
  const holdProjects = projects.filter((project) => project.status === "ON_HOLD").length;
  const portfolioValue = projects.reduce((sum, project) => sum + project.contractValue, 0);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(8,47,73,0.28),rgba(8,15,28,0.9)_55%,rgba(30,41,59,0.8))] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
              Project Portfolio
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              พอร์ตโครงการ
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              เห็นโครงการที่ต้องบริหาร สถานะ และ next focus ก่อนรายละเอียดเชิงทะเบียน เพื่อให้ตัดสินใจได้เร็วและลดการเปิดหลายหน้าที่ไม่จำเป็น
            </p>
            <p className="sr-only">Project and area management</p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
          >
            + สร้างโครงการใหม่
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Portfolio health">
        <article className="rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-4">
          <p className="text-xs text-slate-500">โครงการทั้งหมด</p>
          <p className="mt-1 text-2xl font-semibold text-white">{projects.length.toLocaleString("th-TH")}</p>
          <p className="mt-1 text-xs text-slate-500">{activeProjects.toLocaleString("th-TH")} active</p>
        </article>
        <article className={`rounded-[1.4rem] border p-4 ${holdProjects > 0 ? "border-amber-300/20 bg-amber-300/[0.06]" : "border-emerald-300/15 bg-emerald-300/[0.05]"}`}>
          <p className={`text-xs ${holdProjects > 0 ? "text-amber-100/70" : "text-emerald-100/70"}`}>ต้องตรวจสอบ</p>
          <p className="mt-1 text-2xl font-semibold text-white">{holdProjects.toLocaleString("th-TH")}</p>
          <p className="mt-1 text-xs text-slate-500">โครงการสถานะ HOLD</p>
        </article>
        <article className="rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-4">
          <p className="text-xs text-slate-500">พื้นที่ในขอบเขต</p>
          <p className="mt-1 text-2xl font-semibold text-white">{totalAreas.toLocaleString("th-TH")}</p>
          <p className="mt-1 text-xs text-slate-500">across portfolio</p>
        </article>
        <article className="rounded-[1.4rem] border border-cyan-300/15 bg-cyan-300/[0.05] p-4">
          <p className="text-xs text-cyan-100/70">มูลค่าสัญญารวม</p>
          <p className="mt-1 text-xl font-semibold text-white">{formatBaht(portfolioValue)}</p>
          <p className="mt-1 text-xs text-slate-500">portfolio contract value</p>
        </article>
      </div>

      <ProjectTable projects={projects} />

      <details className="group rounded-[1.7rem] border border-white/8 bg-white/[0.035]">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300/70 sm:px-6">
          <span>
            <span className="block text-sm font-semibold text-white">Project templates</span>
            <span className="mt-0.5 block text-xs text-slate-500">เปิดเมื่อจะสร้างโครงการใหม่จาก operating model ที่กำหนดไว้</span>
          </span>
          <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-slate-400">
            {SITECOST_PROJECT_TEMPLATES.length} templates
          </span>
        </summary>

        <div className="border-t border-white/8 p-5 sm:p-6">
          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            Template กำหนด modules และ default operating model เท่านั้น ราคา Supplier, Contract, Financial Forecast และสิทธิ์ผู้ใช้ยังเป็นข้อมูลเฉพาะของแต่ละโครงการ
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {SITECOST_PROJECT_TEMPLATES.map((template) => (
              <article key={template.code} className="rounded-[1.4rem] border border-white/8 bg-slate-950/30 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/70">{template.code}</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{template.name}</h3>
                  </div>
                  {template.defaultBatchSize ? (
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                      Batch {template.defaultBatchSize}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{template.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {template.enabledModules.map((module) => (
                    <span key={module} className="rounded-full border border-white/8 bg-white/[0.05] px-2.5 py-1 text-xs text-slate-300">
                      {module}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </details>
    </section>
  );
}
