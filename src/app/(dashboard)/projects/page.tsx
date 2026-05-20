import Link from "next/link";
import { ProjectTable } from "@/components/projects/project-table";
import { listProjects } from "@/server/queries/projects";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
            Projects
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Project and area management
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">
            Review the current rollout portfolio and create the next project
            with its first area from one place.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center justify-center rounded-2xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
        >
          New project
        </Link>
      </div>

      <ProjectTable projects={projects} />
    </section>
  );
}
