import type { DashboardProjectHealth } from "@/lib/dashboard/get-dashboard-summary";

type ProjectHealthTableProps = {
  projects: DashboardProjectHealth[];
};

export function ProjectHealthTable({ projects }: ProjectHealthTableProps) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/8 bg-white/[0.04]">
      <div className="border-b border-white/8 bg-slate-950/45 px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
              Health table
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              Project health and exception watch
            </h3>
          </div>
          <p className="text-sm text-slate-300">
            Scan progress, billing, and the latest blocker in one dense lane.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/8 text-left text-sm text-slate-200">
          <thead className="bg-slate-950/35 text-xs uppercase tracking-[0.22em] text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Progress</th>
            <th className="px-4 py-3 font-medium">Billing</th>
            <th className="px-4 py-3 font-medium">Costs</th>
            <th className="px-4 py-3 font-medium">Latest issue</th>
          </tr>
        </thead>
          <tbody className="divide-y divide-white/8">
          {projects.map((project) => (
            <tr key={project.projectId} className="align-top">
              <td className="px-4 py-4">
                <div className="space-y-1">
                  <p className="font-medium text-white">{project.projectName}</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    {project.status}
                  </p>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="space-y-1">
                  <p>
                    {project.completedUnits.toLocaleString()} /{" "}
                    {project.targetUnits.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">
                    {project.completionRate.toFixed(2)}%
                  </p>
                </div>
              </td>
              <td className="px-4 py-4">{project.billedValue.toLocaleString()}</td>
              <td className="px-4 py-4">
                <div className="space-y-1">
                  <p>Actual {project.actualCostValue.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">
                    Estimated {project.estimatedCostValue.toLocaleString()}
                  </p>
                </div>
              </td>
              <td className="px-4 py-4">
                {project.latestIssue ? (
                  <span className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-50">
                    {project.latestIssue}
                  </span>
                ) : (
                  <span className="text-slate-400">No open issue</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </section>
  );
}
