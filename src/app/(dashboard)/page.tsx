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

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
          Executive overview
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Executive portfolio dashboard
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">
          Review rollout progress, financial position, and the first cross-module
          operational risks from one summary surface.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Projects"
          value={summary.progress.totalProjects.toLocaleString()}
          detail={`${summary.progress.totalAreas.toLocaleString()} areas and ${summary.progress.totalTeams.toLocaleString()} teams in scope`}
        />
        <KpiCard
          label="Completion"
          value={`${summary.progress.completionRate.toFixed(2)}%`}
          detail={`${summary.progress.completedUnits.toLocaleString()} of ${summary.progress.totalTargetUnits.toLocaleString()} target units`}
        />
        <KpiCard
          label="Billed"
          value={summary.finance.totalBilledValue.toLocaleString()}
          detail={`Against ${summary.finance.totalContractValue.toLocaleString()} in total contract value`}
        />
        <KpiCard
          label="Actual Cost"
          value={summary.finance.actualCostValue.toLocaleString()}
          detail={`Estimated costs currently ${summary.finance.estimatedCostValue.toLocaleString()}`}
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
