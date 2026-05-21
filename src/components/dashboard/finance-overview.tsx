import type { DashboardSummary } from "@/lib/dashboard/get-dashboard-summary";

type FinanceOverviewProps = {
  finance: DashboardSummary["finance"];
};

export function FinanceOverview({ finance }: FinanceOverviewProps) {
  const collectionRate =
    finance.totalContractValue === 0
      ? 0
      : (finance.totalBilledValue / finance.totalContractValue) * 100;

  return (
    <section className="rounded-[1.75rem] border border-white/8 bg-slate-950/45 p-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
          Finance
        </p>
        <h3 className="text-xl font-semibold text-white">Cash and billing posture</h3>
        <p className="text-sm leading-6 text-slate-300">
          Watch billing momentum, remaining contract value, and how hard actual costs are
          closing in.
        </p>
      </div>

      <div className="mt-6 rounded-[1.4rem] border border-cyan-300/15 bg-cyan-300/[0.06] p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-white">Contract coverage</span>
          <span className="text-sm text-cyan-100">{collectionRate.toFixed(1)}%</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-300"
            style={{ width: `${Math.min(collectionRate, 100)}%` }}
          />
        </div>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-4">
          <dt className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Total billed
          </dt>
          <dd className="mt-2 text-2xl font-semibold text-white">
            {finance.totalBilledValue.toLocaleString()}
          </dd>
        </div>
        <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-4">
          <dt className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Remaining contract
          </dt>
          <dd className="mt-2 text-2xl font-semibold text-white">
            {finance.remainingContractValue.toLocaleString()}
          </dd>
        </div>
        <div className="rounded-[1.4rem] border border-rose-300/18 bg-rose-300/[0.06] p-4">
          <dt className="text-xs uppercase tracking-[0.24em] text-rose-100/75">
            Actual costs
          </dt>
          <dd className="mt-2 text-2xl font-semibold text-white">
            {finance.actualCostValue.toLocaleString()}
          </dd>
        </div>
        <div className="rounded-[1.4rem] border border-amber-300/18 bg-amber-300/[0.06] p-4">
          <dt className="text-xs uppercase tracking-[0.24em] text-amber-100/75">
            Estimated costs
          </dt>
          <dd className="mt-2 text-2xl font-semibold text-white">
            {finance.estimatedCostValue.toLocaleString()}
          </dd>
        </div>
      </dl>
    </section>
  );
}
