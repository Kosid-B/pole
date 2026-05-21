import { FinanceOverview } from "@/components/dashboard/finance-overview";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ProgressOverview } from "@/components/dashboard/progress-overview";
import { ProjectHealthTable } from "@/components/dashboard/project-health-table";
import { RiskAlertList } from "@/components/dashboard/risk-alert-list";
import { getDashboardAlerts } from "@/lib/dashboard/get-dashboard-alerts";
import { getDashboardSummary } from "@/lib/dashboard/get-dashboard-summary";

export default async function DashboardHomePage() {
  const [summary, alerts] = await Promise.all([
    getDashboardSummary(),
    getDashboardAlerts(),
  ]);
  const focusItems = [
    `${summary.progress.totalProjects.toLocaleString()} active project lanes`,
    `${summary.progress.totalTeams.toLocaleString()} teams contributing data`,
    `${alerts.length.toLocaleString()} alerts waiting for follow-up`,
  ];

  return (
    <section className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="rounded-[1.9rem] border border-[var(--panel-border)] bg-[linear-gradient(180deg,rgba(7,17,31,0.94),rgba(11,24,42,0.84))] p-6 shadow-[0_24px_80px_rgba(2,6,23,0.28)]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.34em] text-cyan-200/70">
              Executive overview
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.35rem]">
              Executive portfolio dashboard
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-slate-300">
              Review rollout progress, financial position, and the first cross-module
              operational risks from one command surface.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {focusItems.map((item) => (
              <div
                key={item}
                className="rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-4"
              >
                <p className="text-sm leading-6 text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[1.9rem] border border-cyan-300/18 bg-cyan-300/[0.08] p-6">
          <p className="text-xs uppercase tracking-[0.34em] text-cyan-100/80">
            Today&apos;s focus
          </p>
          <h3 className="mt-3 text-xl font-semibold text-white">
            Keep summary first, action second
          </h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-cyan-50/90">
            <li>Check progress against the portfolio target before drilling into modules.</li>
            <li>Review billing and actual cost movement together, not in isolation.</li>
            <li>Work the alert queue after confirming what is already on-track.</li>
          </ul>
        </aside>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Projects"
          value={summary.progress.totalProjects.toLocaleString()}
          detail={`${summary.progress.totalAreas.toLocaleString()} areas and ${summary.progress.totalTeams.toLocaleString()} teams in scope`}
          signal="Portfolio"
          tone="focus"
        />
        <KpiCard
          label="Completion"
          value={`${summary.progress.completionRate.toFixed(2)}%`}
          detail={`${summary.progress.completedUnits.toLocaleString()} of ${summary.progress.totalTargetUnits.toLocaleString()} target units`}
          signal="Progress"
          tone="focus"
        />
        <KpiCard
          label="Billed"
          value={summary.finance.totalBilledValue.toLocaleString()}
          detail={`Against ${summary.finance.totalContractValue.toLocaleString()} in total contract value`}
          signal="Cash in"
        />
        <KpiCard
          label="Actual Cost"
          value={summary.finance.actualCostValue.toLocaleString()}
          detail={`Estimated costs currently ${summary.finance.estimatedCostValue.toLocaleString()}`}
          signal="Watch"
          tone="warning"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ProgressOverview progress={summary.progress} />
            <FinanceOverview finance={summary.finance} />
          </div>
          <ProjectHealthTable projects={summary.projectHealth} />
        </div>

        <RiskAlertList alerts={alerts} />
      </div>
    </section>
  );
}
