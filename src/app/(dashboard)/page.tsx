import Link from "next/link";
import { FinanceOverview } from "@/components/dashboard/finance-overview";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ProgressOverview } from "@/components/dashboard/progress-overview";
import { ProjectHealthTable } from "@/components/dashboard/project-health-table";
import { RiskAlertList } from "@/components/dashboard/risk-alert-list";
import { SaasCommandLanes } from "@/components/dashboard/saas-command-lanes";
import { getSessionAuthProvider } from "@/lib/auth";
import { getSiteCostProjectContext } from "@/lib/project-context";

const decisionModules = [
  {
    code: "commercial",
    label: "Commercial / Pricing",
    href: "/commercial",
    description: "ราคา • G63/G64 • Tier • Quote",
  },
  {
    code: "pm",
    label: "PM Control",
    href: "/pm",
    description: "BAC • GM • Cash guardrail • Supplier commitment",
  },
  {
    code: "procurement",
    label: "Procurement",
    href: "/procurement",
    description: "Cluster • RFQ • Framework • Funding gate",
  },
] as const;

async function SupabaseExecutiveShell() {
  const projectContext = await getSiteCostProjectContext();
  const selectedProject = projectContext.selectedProject;
  const authorizedProjects = projectContext.data?.projects ?? [];
  const enabledModules = new Set(selectedProject?.enabled_modules ?? []);

  return (
    <section className="space-y-6">
      <SaasCommandLanes />

      <section className="rounded-[1.9rem] border border-emerald-300/15 bg-[linear-gradient(135deg,rgba(6,78,59,0.18),rgba(7,17,31,0.94)_48%,rgba(8,47,73,0.25))] p-5 shadow-[0_24px_80px_rgba(2,6,23,0.28)] sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/70">
              Supabase-ready command shell
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              ภาพรวมผู้บริหารจาก Authoritative Project Scope
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Runtime นี้ใช้ Supabase Auth + Core Project Registry เป็น source หลัก และจงใจไม่ query legacy Prisma/SQLite เพื่อป้องกัน split-brain ระหว่างช่วง migration
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          >
            ดู Project Portfolio
          </Link>
        </div>

        {projectContext.data ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
              <p className="text-xs text-slate-500">Authorized projects</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {authorizedProjects.length.toLocaleString("th-TH")}
              </p>
              <p className="mt-1 text-xs text-slate-500">จาก Supabase membership</p>
            </article>
            <article className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] p-4">
              <p className="text-xs text-cyan-100/70">Selected project</p>
              <p className="mt-1 truncate text-base font-semibold text-white">
                {selectedProject?.project_code ?? "ยังไม่มี"}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">
                {selectedProject?.project_name ?? "ไม่มี selected project"}
              </p>
            </article>
            <article className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
              <p className="text-xs text-slate-500">Enabled modules</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {selectedProject?.enabled_modules.length.toLocaleString("th-TH") ?? "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500">project-scoped entitlement</p>
            </article>
            <article className="rounded-2xl border border-emerald-300/18 bg-emerald-300/[0.06] p-4">
              <p className="text-xs text-emerald-100/70">Data runtime</p>
              <p className="mt-1 text-lg font-semibold text-white">Supabase Core</p>
              <p className="mt-1 text-xs text-emerald-100/65">Legacy Prisma bypassed</p>
            </article>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-rose-300/18 bg-rose-300/[0.055] p-5">
            <p className="text-sm font-semibold text-rose-50">Project Context unavailable</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              ระบบหยุดที่ authoritative source และไม่ fallback ไป local/demo database
            </p>
            <p className="mt-2 break-words text-xs text-rose-100/70">{projectContext.error}</p>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Decision lanes
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            โมดูลที่ใช้ตัดสินใจในโครงการปัจจุบัน
          </h3>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {decisionModules.map((module) => {
            const enabled = enabledModules.has(module.code);
            return (
              <article
                key={module.code}
                className={`rounded-[1.5rem] border p-5 ${
                  enabled
                    ? "border-cyan-300/16 bg-cyan-300/[0.05]"
                    : "border-white/8 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-white">{module.label}</h4>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {module.description}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      enabled
                        ? "bg-emerald-300/10 text-emerald-100"
                        : "bg-white/[0.05] text-slate-500"
                    }`}
                  >
                    {enabled ? "Enabled" : "Not entitled"}
                  </span>
                </div>
                {enabled ? (
                  <Link
                    href={module.href}
                    className="mt-4 inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                  >
                    เปิด {module.label}
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-amber-300/14 bg-amber-300/[0.04] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/70">
          Migration control
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          Teams, legacy Field Reports, Finance และ Imports ถูกปิดใน Supabase runtime จนกว่า read/write contract จะย้ายเข้า project-scoped Supabase schema ครบ ไม่สร้างตาราง Project/User ชุดซ้ำเพื่อเร่ง deployment
        </p>
      </section>
    </section>
  );
}

async function LegacyExecutiveDashboard() {
  const [{ getDashboardSummary }, { getDashboardAlerts }] = await Promise.all([
    import("@/lib/dashboard/get-dashboard-summary"),
    import("@/lib/dashboard/get-dashboard-alerts"),
  ]);
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

export default async function DashboardHomePage() {
  const provider = await getSessionAuthProvider();

  if (provider === "supabase") {
    return <SupabaseExecutiveShell />;
  }

  return <LegacyExecutiveDashboard />;
}
