import Link from "next/link";
import { FieldReportForm } from "@/components/field-reports/field-report-form";
import { createFieldReportFromForm } from "@/server/actions/field-reports";
import {
  getFieldReportFormProjects,
  listFieldReportEquipmentMasters,
  listFieldReportUnits,
} from "@/server/queries/field-reports";

export default async function NewFieldReportPage() {
  const [projects, units, equipmentMasters] = await Promise.all([
    getFieldReportFormProjects(),
    listFieldReportUnits(),
    listFieldReportEquipmentMasters(),
  ]);
  const hasProjectSetup = projects.some(
    (project) => project.areas.length > 0 && project.teams.length > 0,
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.34em] text-cyan-200/70">
            Field reports
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Create a field report
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            Capture one complete shift update with progress, manpower, materials,
            equipment, and field issues from a mobile-friendly layout.
          </p>
        </div>
        <Link
          href="/field-reports"
          className="text-sm font-medium text-cyan-200 transition hover:text-white"
        >
          Back to field reports
        </Link>
      </div>

      <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/45 p-4 sm:p-5 lg:p-6">
        {hasProjectSetup ? (
          <FieldReportForm
            action={createFieldReportFromForm}
            equipmentMasters={equipmentMasters}
            projects={projects}
            units={units}
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
