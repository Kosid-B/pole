import Link from "next/link";
import { listFieldReports } from "@/server/queries/field-reports";

export default async function FieldReportsPage() {
  const reports = await listFieldReports();
  const totalUnits = reports.reduce((sum, report) => sum + report.completedUnits, 0);
  const totalManpower = reports.reduce((sum, report) => sum + report.manpowerCount, 0);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.34em] text-cyan-200/70">
            Field reports
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Daily field reporting
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            Keep the latest field signal visible, then capture the next shift update from
            a workflow that stays readable on desktop and mobile.
          </p>
        </div>
        <Link
          href="/field-reports/new"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
        >
          New field report
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Reports logged</p>
          <p className="mt-2 text-2xl font-semibold text-white">{reports.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Completed units</p>
          <p className="mt-2 text-2xl font-semibold text-white">{totalUnits}</p>
        </div>
        <div className="rounded-[1.5rem] border border-cyan-300/18 bg-cyan-300/[0.06] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/80">Crew effort</p>
          <p className="mt-2 text-2xl font-semibold text-white">{totalManpower}</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-300">
          No field reports yet. Create the first daily report to log progress,
          materials, and equipment usage.
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <article
              key={report.id}
              className="rounded-[1.75rem] border border-white/8 bg-white/[0.04] p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {report.projectName}
                  </h3>
                  <p className="text-sm text-slate-300">
                    {report.areaName} - {report.teamName}
                  </p>
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">
                    {report.reportDate.toLocaleDateString()}
                  </p>
                </div>

                <dl className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2 lg:min-w-[20rem]">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Completed units
                    </dt>
                    <dd>{report.completedUnits}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Manpower
                    </dt>
                    <dd>{report.manpowerCount}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
                  <h4 className="text-sm font-semibold text-white">Materials</h4>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {report.materials.map((item) => (
                      <li key={item.id}>
                        {item.name} - {item.quantity} {item.unitRef?.symbol ?? item.unit}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
                  <h4 className="text-sm font-semibold text-white">Equipment</h4>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {report.equipment.map((item) => (
                      <li key={item.id}>
                        {item.equipmentMaster?.nameTh ?? item.name} - {item.quantity}{" "}
                        {item.unitRef?.symbol ?? item.unit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {report.issues ? (
                <div className="mt-4 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
                  {report.issues}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
