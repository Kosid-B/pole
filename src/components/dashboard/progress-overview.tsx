import type { DashboardSummary } from "@/lib/dashboard/get-dashboard-summary";

type ProgressOverviewProps = {
  progress: DashboardSummary["progress"];
};

export function ProgressOverview({ progress }: ProgressOverviewProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">Progress overview</h3>
        <p className="text-sm text-slate-300">
          Portfolio execution against total rollout targets.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
            <span>Completion rate</span>
            <span>{progress.completionRate.toFixed(2)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-sky-300"
              style={{ width: `${Math.min(progress.completionRate, 100)}%` }}
            />
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Completed units
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-white">
              {progress.completedUnits.toLocaleString()}
            </dd>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Remaining units
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-white">
              {(progress.totalTargetUnits - progress.completedUnits).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
