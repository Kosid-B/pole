import Link from "next/link";
import { FieldReportForm } from "@/components/field-reports/field-report-form";
import { createFieldReportFromForm } from "@/server/actions/field-reports";
import { getFieldReportFormProjects } from "@/server/queries/field-reports";

export default async function NewFieldReportPage() {
  const projects = await getFieldReportFormProjects();
  const hasProjectSetup = projects.some(
    (project) => project.areas.length > 0 && project.teams.length > 0,
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
            Field reports
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Create a field report
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">
            Log one day of execution details for a project area and team,
            including the first material and equipment usage rows.
          </p>
        </div>
        <Link
          href="/field-reports"
          className="text-sm font-medium text-sky-200 transition hover:text-white"
        >
          Back to field reports
        </Link>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
        {hasProjectSetup ? (
          <FieldReportForm
            action={createFieldReportFromForm}
            projects={projects}
          />
        ) : (
          <div className="space-y-3 text-sm text-slate-300">
            <h3 className="text-lg font-semibold text-white">
              Add a project, area, and team first
            </h3>
            <p>
              Field reports depend on existing project setup. Create at least one
              project with an area and a team before submitting daily reports.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
