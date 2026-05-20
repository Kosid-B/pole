import Link from "next/link";
import { ProjectForm } from "@/components/projects/project-form";
import { createProjectFromForm } from "@/server/actions/projects";

export default function NewProjectPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
            Projects
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Create a project
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">
            Capture the contract target and the first reporting area so the
            operations team can begin organizing rollout work.
          </p>
        </div>
        <Link
          href="/projects"
          className="text-sm font-medium text-sky-200 transition hover:text-white"
        >
          Back to projects
        </Link>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
        <ProjectForm action={createProjectFromForm} />
      </div>
    </section>
  );
}
