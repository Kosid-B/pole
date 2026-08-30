import { EquipmentLineItems } from "@/components/field-reports/equipment-line-items";
import { MaterialLineItems } from "@/components/field-reports/material-line-items";
import { PhotoUploader } from "@/components/field-reports/photo-uploader";
import type { FieldReportFormProject } from "@/server/queries/field-reports";
import type { EquipmentMasterSummary, UnitOfMeasureSummary } from "@/types/domain";

type FieldReportFormProps = {
  action: (formData: FormData) => Promise<void>;
  equipmentMasters: EquipmentMasterSummary[];
  projects: FieldReportFormProject[];
  units: UnitOfMeasureSummary[];
};

export function FieldReportForm({
  action,
  equipmentMasters,
  projects,
  units,
}: FieldReportFormProps) {
  const areaOptions = projects.flatMap((project) =>
    project.areas.map((area) => ({
      id: area.id,
      label: `${project.name} - ${area.name} (${area.province})`,
    })),
  );

  const teamOptions = projects.flatMap((project) =>
    project.teams.map((team) => ({
      id: team.id,
      label: `${project.name} - ${team.name} (${team.leaderName})`,
    })),
  );
  const defaultMachineUnitId =
    units.find((unit) => unit.code === "MACHINE")?.id ?? units[0]?.id;

  return (
    <form action={action} className="space-y-8">
      <section className="space-y-4 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">Core shift details</h3>
          <p className="text-sm leading-6 text-slate-300">
            Start with the project lane, date, and the team responsible for this shift.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="projectId"
              className="text-sm font-medium text-slate-200"
            >
              Project
            </label>
            <select
              id="projectId"
              name="projectId"
              required
              defaultValue=""
              className="min-h-12 w-full rounded-[1.25rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
            >
              <option value="" disabled>
                Select a project
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="reportDate"
              className="text-sm font-medium text-slate-200"
            >
              Report date
            </label>
            <input
              id="reportDate"
              name="reportDate"
              type="date"
              required
              className="min-h-12 w-full rounded-[1.25rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="areaId"
              className="text-sm font-medium text-slate-200"
            >
              Area
            </label>
            <select
              id="areaId"
              name="areaId"
              required
              defaultValue=""
              className="min-h-12 w-full rounded-[1.25rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
            >
              <option value="" disabled>
                Select an area
              </option>
              {areaOptions.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="teamId"
              className="text-sm font-medium text-slate-200"
            >
              Team
            </label>
            <select
              id="teamId"
              name="teamId"
              required
              defaultValue=""
              className="min-h-12 w-full rounded-[1.25rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
            >
              <option value="" disabled>
                Select a team
              </option>
              {teamOptions.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">Delivery counts</h3>
          <p className="text-sm leading-6 text-slate-300">
            Record the output and crew size first so the shift result is clear at a glance.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="completedUnits"
              className="text-sm font-medium text-slate-200"
            >
              Completed units
            </label>
            <input
              id="completedUnits"
              name="completedUnits"
              type="number"
              min="0"
              required
              className="min-h-12 w-full rounded-[1.25rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
              placeholder="18"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="manpowerCount"
              className="text-sm font-medium text-slate-200"
            >
              Manpower count
            </label>
            <input
              id="manpowerCount"
              name="manpowerCount"
              type="number"
              min="0"
              required
              className="min-h-12 w-full rounded-[1.25rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
              placeholder="9"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">Issues and blockers</h3>
          <p className="text-sm leading-6 text-slate-300">
            Record only the field conditions that need follow-through or explain delivery risk.
          </p>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="issues"
            className="text-sm font-medium text-slate-200"
          >
            Issues and blockers
          </label>
          <textarea
            id="issues"
            name="issues"
            rows={4}
            className="w-full rounded-[1.25rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
            placeholder="Soft ground near access road."
          />
        </div>
      </section>

      <MaterialLineItems units={units} />
      <EquipmentLineItems
        defaultUnitId={defaultMachineUnitId}
        equipmentMasters={equipmentMasters}
        units={units}
      />
      <PhotoUploader />

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="submit"
          className="min-h-12 w-full rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 sm:w-auto sm:min-w-52"
        >
          Save field report
        </button>
      </div>
    </form>
  );
}
