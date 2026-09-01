import Link from "next/link";
import { FinanceOverview } from "@/components/dashboard/finance-overview";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ProgressOverview } from "@/components/dashboard/progress-overview";
import { ProjectHealthTable } from "@/components/dashboard/project-health-table";
import { RiskAlertList } from "@/components/dashboard/risk-alert-list";
import { SaasCommandLanes } from "@/components/dashboard/saas-command-lanes";
import { getDashboardAlerts } from "@/lib/dashboard/get-dashboard-alerts";
import { getDashboardSummary } from "@/lib/dashboard/get-dashboard-summary";

export default async function DashboardHomePage() {
  const [summary, alerts] = await Promise.all([
    getDashboardSummary(),
    getDashboardAlerts(),
  ]);

  return (
    <section className="space-y-6">
      <SaasCommandLanes />

      <section className="rounded-[1.9rem] border border-[var(--panel-border)] bg-[linear-gradient(180deg,rgba(7,17,31,0.94),rgba(11,24,42,0.84))] p-5 shadow-[0_24px_80px_rgba(2,6,23,0.28)] sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
              Executive overview
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              ภาพรวมผู้บริหาร
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              ดูเฉพาะสถานะที่เปลี่ยนการตัดสินใจก่อน หากทุกอย่างอยู่ในกรอบจึงค่อย drill down ไปยังรายโครงการและ workflow
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          >
            ดู Project Portfolio
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
            <p className="text-xs text-slate-500">ความคืบหน้า</p>
            <p className="mt-1 text-xl font-semibold text-white">{summary.progress.completionRate.toFixed(2)}%</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {summary.progress.completedUnits.toLocaleString()} / {summary.progress.totalTargetUnits.toLocaleString()} target units
            </p>
          </article>
          <article className={`rounded-2xl border p-4 ${alerts.length > 0 ? "border-amber-300/20 bg-amber-300/[0.06]" : "border-emerald-300/20 bg-emerald-300/[0.06]"}`}>
            <p className={`text-xs ${alerts.length > 0 ? "text-amber-100/70" : "text-emerald-100/70"}`}>Exception queue</p>
            <p className="mt-1 text-xl font-semibold text-white">{alerts.length.toLocaleString()} รายการ</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {alerts.length > 0 ? "ตรวจรายการที่มีผลต่อแผน ต้นทุน หรือ cash ก่อน" : "ยังไม่มี exception ที่ต้องเร่งจัดการ"}
            </p>
          </article>
          <article className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] p-4">
            <p className="text-xs text-cyan-100/70">ขอบเขตข้อมูล</p>
            <p className="mt-1 text-xl font-semibold text-white">{summary.progress.totalProjects.toLocaleString()} โครงการ</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {summary.progress.totalTeams.toLocaleString()} teams • {summary.progress.totalAreas.toLocaleString()} areas
            </p>
          </article>
        </div>
      </section>

      <div>
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Evidence</p>
          <h3 className="mt-1 text-lg font-semibold text-white">KPI ที่ใช้ยืนยันสถานะ</h3>
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
