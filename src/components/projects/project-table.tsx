import Link from "next/link";
import type { ProjectSummary } from "@/types/domain";

type ProjectTableProps = {
  projects: ProjectSummary[];
};

export function ProjectTable({ projects }: ProjectTableProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-300">
        No projects yet. Create the first project to start tracking rollout
        areas.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/8 bg-white/[0.04]">
      <div className="border-b border-white/8 bg-slate-950/40 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
          Project table
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/8 text-left text-sm text-slate-200">
        <thead className="bg-slate-950/50 text-xs uppercase tracking-[0.2em] text-sky-200/70">
          <tr>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Contract value</th>
            <th className="px-4 py-3 font-medium">Target units</th>
            <th className="px-4 py-3 font-medium">Initial area</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {projects.map((project) => (
            <tr key={project.id} className="align-top">
              <td className="px-4 py-4">
                <div className="space-y-1">
                  <p className="font-medium text-white">{project.name}</p>
                  <p className="text-xs text-slate-400">{project.status}</p>
                </div>
              </td>
              <td className="px-4 py-4">
                {project.contractValue.toLocaleString()}
              </td>
              <td className="px-4 py-4">{project.targetUnits.toLocaleString()}</td>
              <td className="px-4 py-4">
                {project.areas[0] ? (
                  <div className="space-y-1">
                    <p>{project.areas[0].name}</p>
                    <p className="text-xs text-slate-400">
                      {project.areas[0].province}
                    </p>
                  </div>
                ) : (
                  <span className="text-slate-400">No areas yet</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      <div className="border-t border-white/8 bg-slate-950/30 px-4 py-3 text-right">
        <Link
          href="/projects/new"
          className="text-sm font-medium text-cyan-200 transition hover:text-white"
        >
          Add another project
        </Link>
      </div>
    </div>
  );
}
