import { EquipmentLineItems } from "@/components/field-reports/equipment-line-items";
import { MaterialLineItems } from "@/components/field-reports/material-line-items";
import { PhotoUploader } from "@/components/field-reports/photo-uploader";
import type { FieldReportFormProject } from "@/server/queries/field-reports";

type FieldReportFormProps = {
  action: (formData: FormData) => Promise<void>;
  projects: FieldReportFormProject[];
};

export function FieldReportForm({ action, projects }: FieldReportFormProps) {
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

  return (
    <form action={action} className="space-y-6">
      <section className="space-y-4">
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
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
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
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
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
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
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
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
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
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
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
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
              placeholder="9"
            />
          </div>
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
            className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            placeholder="Soft ground near access road."
          />
        </div>
      </section>

      <MaterialLineItems />
      <EquipmentLineItems />
      <PhotoUploader />

      <div className="flex items-center justify-end">
        <button
          type="submit"
          className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
        >
          Save field report
        </button>
      </div>
    </form>
  );
}
