import type { ProjectSummary } from "@/types/domain";

type CostEntryFormProps = {
  action: (formData: FormData) => Promise<void>;
  projects: ProjectSummary[];
};

export function CostEntryForm({ action, projects }: CostEntryFormProps) {
  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="cost-projectId" className="text-sm font-medium text-slate-200">
          Project
        </label>
        <select
          id="cost-projectId"
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium text-slate-200">
            Category
          </label>
          <input
            id="category"
            name="category"
            type="text"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            placeholder="Materials"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="amount" className="text-sm font-medium text-slate-200">
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="1"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            placeholder="845000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-slate-200">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
          placeholder="Concrete and rebar purchase"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="entryDate" className="text-sm font-medium text-slate-200">
            Entry date
          </label>
          <input
            id="entryDate"
            name="entryDate"
            type="date"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="valueType" className="text-sm font-medium text-slate-200">
            Value type
          </label>
          <select
            id="valueType"
            name="valueType"
            required
            defaultValue="ACTUAL"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
          >
            <option value="ACTUAL">Actual</option>
            <option value="ESTIMATED">Estimated</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
        >
          Save cost entry
        </button>
      </div>
    </form>
  );
}
