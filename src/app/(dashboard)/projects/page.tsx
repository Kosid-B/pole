import Link from "next/link";
import { ProjectTable } from "@/components/projects/project-table";
import { SITECOST_PROJECT_TEMPLATES } from "@/lib/sitecost-saas";
import { listProjects } from "@/server/queries/projects";

export default async function ProjectsPage() {
  const projects = await listProjects();
  const totalAreas = projects.reduce((sum, project) => sum + project.areas.length, 0);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.34em] text-cyan-200/70">
            Project Portfolio
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Multi-project management
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            ใช้ SiteCost เป็น SaaS กลางสำหรับหลายโครงการ แต่ละ Project แยกพื้นที่ ทีม
            Commercial, PM, Procurement, Field และ Finance ได้โดยไม่ผูกกับงานลานตากเพียงโครงการเดียว
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
        >
          New project
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Projects</p>
          <p className="mt-2 text-2xl font-semibold text-white">{projects.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Areas in scope</p>
          <p className="mt-2 text-2xl font-semibold text-white">{totalAreas}</p>
        </div>
        <div className="rounded-[1.5rem] border border-cyan-300/18 bg-cyan-300/[0.06] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/80">SaaS model</p>
          <p className="mt-2 text-sm leading-6 text-cyan-50/90">
            Portfolio → Project → Module → Workflow → Audit trail
          </p>
        </div>
      </div>

      <article className="rounded-[1.7rem] border border-white/8 bg-white/[0.04] p-5 sm:p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Project templates</p>
          <h3 className="mt-2 text-xl font-semibold text-white">เริ่มโครงการใหม่จาก operating model ที่กำหนดไว้</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Template กำหนด module และ default operating model ส่วนข้อมูลราคา Supplier, Contract และ Financial Forecast ยังคงเป็นข้อมูลเฉพาะแต่ละ Project
          </p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {SITECOST_PROJECT_TEMPLATES.map((template) => (
            <div key={template.code} className="rounded-[1.4rem] border border-white/8 bg-slate-950/30 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">{template.code}</p>
                  <h4 className="mt-2 text-lg font-semibold text-white">{template.name}</h4>
                </div>
                {template.defaultBatchSize ? (
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                    Batch {template.defaultBatchSize}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{template.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {template.enabledModules.map((module) => (
                  <span key={module} className="rounded-full border border-white/8 bg-white/[0.05] px-2.5 py-1 text-xs text-slate-300">
                    {module}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </article>

      <ProjectTable projects={projects} />
    </section>
  );
}
