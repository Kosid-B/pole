import type { ProjectSummary } from "@/types/domain";

type TeamFormProps = {
  action: (formData: FormData) => Promise<void>;
  projects: ProjectSummary[];
};

export function TeamForm({ action, projects }: TeamFormProps) {
  return (
    <form action={action} className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
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
          <label htmlFor="name" className="text-sm font-medium text-slate-200">
            Team name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            placeholder="Tower Crew Alpha"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="leaderName"
            className="text-sm font-medium text-slate-200"
          >
            Leader name
          </label>
          <input
            id="leaderName"
            name="leaderName"
            type="text"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            placeholder="Anan S."
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="crewSize"
            className="text-sm font-medium text-slate-200"
          >
            Crew size
          </label>
          <input
            id="crewSize"
            name="crewSize"
            type="number"
            min="1"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            placeholder="8"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="specialization"
            className="text-sm font-medium text-slate-200"
          >
            Specialization
          </label>
          <input
            id="specialization"
            name="specialization"
            type="text"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            placeholder="Pole installation"
          />
        </div>
      </section>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
        >
          Save team
        </button>
      </div>
    </form>
  );
}
