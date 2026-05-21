import Link from "next/link";
import { listFieldReports } from "@/server/queries/field-reports";

export default async function FieldReportsPage() {
  const reports = await listFieldReports();

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
            Field reports
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Daily field reporting
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">
            Capture executed units, crew effort, and the first material and
            equipment usage details for each reporting day.
          </p>
        </div>
        <Link
          href="/field-reports/new"
          className="inline-flex items-center justify-center rounded-2xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
        >
          New field report
        </Link>
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
              className="rounded-[2rem] border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {report.projectName}
                  </h3>
                  <p className="text-sm text-slate-300">
                    {report.areaName} - {report.teamName}
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-200/70">
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
                        {item.name} - {item.quantity} {item.unit}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
                  <h4 className="text-sm font-semibold text-white">Equipment</h4>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {report.equipment.map((item) => (
                      <li key={item.id}>
                        {item.name} - {item.quantity} {item.unit}
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
