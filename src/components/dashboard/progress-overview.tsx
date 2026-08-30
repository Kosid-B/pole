import type { DashboardSummary } from "@/lib/dashboard/get-dashboard-summary";

type ProgressOverviewProps = {
  progress: DashboardSummary["progress"];
};

export function ProgressOverview({ progress }: ProgressOverviewProps) {
  const remainingUnits = progress.totalTargetUnits - progress.completedUnits;

  return (
    <section className="rounded-[1.75rem] border border-white/8 bg-slate-950/45 p-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
          Progress
        </p>
        <h3 className="text-xl font-semibold text-white">Portfolio execution status</h3>
        <p className="text-sm leading-6 text-slate-300">
          Keep the full rollout in view while highlighting the remaining delivery load.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
            <span>Completion rate</span>
            <span>{progress.completionRate.toFixed(2)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-cyan-300"
              style={{ width: `${Math.min(progress.completionRate, 100)}%` }}
            />
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-4">
            <dt className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Completed units
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-white">
              {progress.completedUnits.toLocaleString()}
            </dd>
          </div>
          <div className="rounded-[1.4rem] border border-amber-300/18 bg-amber-300/[0.06] p-4">
            <dt className="text-xs uppercase tracking-[0.24em] text-amber-100/75">
              Remaining units
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-white">
              {remainingUnits.toLocaleString()}
            </dd>
          </div>
        </dl>

        <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-white">Scope coverage</span>
            <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Projects / areas / teams
            </span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-2xl font-semibold text-white">
                {progress.totalProjects.toLocaleString()}
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Projects
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">
                {progress.totalAreas.toLocaleString()}
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Areas
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">
                {progress.totalTeams.toLocaleString()}
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Teams
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
