import type { DashboardSummary } from "@/lib/dashboard/get-dashboard-summary";

type FinanceOverviewProps = {
  finance: DashboardSummary["finance"];
};

export function FinanceOverview({ finance }: FinanceOverviewProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">Finance overview</h3>
        <p className="text-sm text-slate-300">
          Contract, billing, and cost position across the active portfolio.
        </p>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Total billed
          </dt>
          <dd className="mt-2 text-2xl font-semibold text-white">
            {finance.totalBilledValue.toLocaleString()}
          </dd>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Remaining contract
          </dt>
          <dd className="mt-2 text-2xl font-semibold text-white">
            {finance.remainingContractValue.toLocaleString()}
          </dd>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Actual costs
          </dt>
          <dd className="mt-2 text-2xl font-semibold text-white">
            {finance.actualCostValue.toLocaleString()}
          </dd>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">
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
