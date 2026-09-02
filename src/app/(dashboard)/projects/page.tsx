import Link from "next/link";
import { AuthoritativeProjectRegistry } from "@/components/projects/authoritative-project-registry";
import { ProjectTable } from "@/components/projects/project-table";
import { getSiteCostProjectContext } from "@/lib/project-context";
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
  const [projects, projectContext] = await Promise.all([
    listProjects(),
    getSiteCostProjectContext(),
  ]);

  const usesAuthoritativeRegistry = projectContext.configured;
  const registryProjects = projectContext.data?.projects ?? [];
  const registryActiveProjects = registryProjects.filter(
    (project) => project.status.toLowerCase() === "active",
  ).length;
  const selectedRegistryProject = projectContext.selectedProject;
  const selectedModuleCount = selectedRegistryProject?.enabled_modules.length ?? 0;

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
              {usesAuthoritativeRegistry
                ? "แสดงเฉพาะโครงการที่ credential หรือ membership นี้ได้รับสิทธิ์จาก Supabase Core Project Registry เพื่อให้ Project scope ตรงกับ backend จริง"
                : "เห็นโครงการที่ต้องบริหาร สถานะ และ next focus ก่อนรายละเอียดเชิงทะเบียน เพื่อให้ตัดสินใจได้เร็วและลดการเปิดหลายหน้าที่ไม่จำเป็น"}
            </p>
            <p className="sr-only">Project and area management</p>
          </div>

          {usesAuthoritativeRegistry ? (
            <span className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-300/18 bg-emerald-300/[0.07] px-4 py-3 text-sm font-semibold text-emerald-100">
              Source • Supabase Core Registry
            </span>
          ) : (
            <Link
              href="/projects/new"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
            >
              + สร้างโครงการใหม่
            </Link>
          )}
        </div>
      </div>

      {usesAuthoritativeRegistry ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Authorized portfolio health">
            <article className="rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-4">
              <p className="text-xs text-slate-500">โครงการที่เข้าถึงได้</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {projectContext.data ? registryProjects.length.toLocaleString("th-TH") : "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500">authorized scope</p>
            </article>

            <article className="rounded-[1.4rem] border border-emerald-300/15 bg-emerald-300/[0.05] p-4">
              <p className="text-xs text-emerald-100/70">Active</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {projectContext.data ? registryActiveProjects.toLocaleString("th-TH") : "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500">จาก registry ที่บัญชีนี้มองเห็น</p>
            </article>

            <article className="rounded-[1.4rem] border border-cyan-300/15 bg-cyan-300/[0.05] p-4">
              <p className="text-xs text-cyan-100/70">โครงการปัจจุบัน</p>
              <p className="mt-1 truncate text-base font-semibold text-white">
                {selectedRegistryProject?.project_code || "ยังไม่มี"}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">
                {selectedRegistryProject?.project_name || "ไม่มี selected project"}
              </p>
            </article>

            <article className="rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-4">
              <p className="text-xs text-slate-500">Modules ที่เปิด</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {selectedRegistryProject ? selectedModuleCount.toLocaleString("th-TH") : "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500">ของโครงการปัจจุบัน</p>
            </article>
          </div>

          {projectContext.data ? (
            <AuthoritativeProjectRegistry
              projects={registryProjects}
              selectedProjectId={projectContext.data.selected_project_id}
              authMode={projectContext.data.auth_mode}
            />
          ) : (
            <section className="rounded-[1.7rem] border border-rose-300/18 bg-rose-300/[0.055] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-100/70">
                Project Registry unavailable
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                ไม่สามารถยืนยัน Project scope จาก source หลักได้
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                ระบบจงใจไม่แสดงรายการจากฐาน local/demo มาทดแทน เพราะอาจทำให้ผู้ใช้ตัดสินใจบนโครงการคนละ scope กับ backend
              </p>
              <p className="mt-3 break-words text-xs text-rose-100/70">{projectContext.error}</p>
            </section>
          )}

          <section className="rounded-[1.7rem] border border-amber-300/14 bg-amber-300/[0.045] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/70">
              Controlled transition
            </p>
            <h3 className="mt-2 text-base font-semibold text-white">
              การสร้างและสลับโครงการยังถูก gate ไว้
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              ปุ่มสร้างโครงการจาก local Prisma และตัวเลือก switching จะไม่แสดงใน authoritative mode จนกว่าการเขียน core_projects, membership และ selected project_id จะเชื่อมกับทุก module query แบบ end-to-end
            </p>
          </section>
        </>
      ) : (
        <>
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
        </>
      )}
    </section>
  );
}
