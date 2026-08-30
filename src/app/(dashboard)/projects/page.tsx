import Link from "next/link";
import { ProjectTable } from "@/components/projects/project-table";
import { listProjects } from "@/server/queries/projects";

export default async function ProjectsPage() {
  const projects = await listProjects();
  const totalAreas = projects.reduce((sum, project) => sum + project.areas.length, 0);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.34em] text-cyan-200/70">
            Projects
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Project and area management
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            Review the rollout portfolio first, then add the next project or area without
            burying the current scope.
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
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/80">Focus</p>
          <p className="mt-2 text-sm leading-6 text-cyan-50/90">
            Keep inactive projects visible so new areas are added to the right lane.
          </p>
        </div>
      </div>

      <ProjectTable projects={projects} />
    </section>
  );
}
