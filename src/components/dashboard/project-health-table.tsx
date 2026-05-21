import type { DashboardProjectHealth } from "@/lib/dashboard/get-dashboard-summary";

type ProjectHealthTableProps = {
  projects: DashboardProjectHealth[];
};

export function ProjectHealthTable({ projects }: ProjectHealthTableProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
      <div className="border-b border-white/10 bg-slate-950/40 px-5 py-4">
        <h3 className="text-lg font-semibold text-white">Project health</h3>
      </div>

      <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-200">
        <thead className="bg-slate-950/30 text-xs uppercase tracking-[0.2em] text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Progress</th>
            <th className="px-4 py-3 font-medium">Billing</th>
            <th className="px-4 py-3 font-medium">Costs</th>
            <th className="px-4 py-3 font-medium">Latest issue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {projects.map((project) => (
            <tr key={project.projectId}>
              <td className="px-4 py-4">
                <div className="space-y-1">
                  <p className="font-medium text-white">{project.projectName}</p>
                  <p className="text-xs text-slate-400">{project.status}</p>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="space-y-1">
                  <p>{project.completedUnits.toLocaleString()} / {project.targetUnits.toLocaleString()}</p>
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
                {project.latestIssue ?? (
                  <span className="text-slate-400">No open issue</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
