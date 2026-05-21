import type { ProjectSummary } from "@/types/domain";

type BillingFormProps = {
  action: (formData: FormData) => Promise<void>;
  projects: ProjectSummary[];
};

export function BillingForm({ action, projects }: BillingFormProps) {
  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="billing-projectId" className="text-sm font-medium text-slate-200">
          Project
        </label>
        <select
          id="billing-projectId"
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
        <label htmlFor="workPackage" className="text-sm font-medium text-slate-200">
          Work package
        </label>
        <input
          id="workPackage"
          name="workPackage"
          type="text"
          required
          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
          placeholder="Milestone 1 foundation package"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="billedValue" className="text-sm font-medium text-slate-200">
            Billed value
          </label>
          <input
            id="billedValue"
            name="billedValue"
            type="number"
            min="1"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            placeholder="3250000"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="billingDate" className="text-sm font-medium text-slate-200">
            Billing date
          </label>
          <input
            id="billingDate"
            name="billingDate"
            type="date"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="expectedPaymentDate"
            className="text-sm font-medium text-slate-200"
          >
            Expected payment date
          </label>
          <input
            id="expectedPaymentDate"
            name="expectedPaymentDate"
            type="date"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
          />
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
          <input
            type="checkbox"
            name="isDocumentComplete"
            className="h-4 w-4 rounded border-white/10 bg-slate-950 text-sky-300"
          />
          Documents complete
        </label>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
        >
          Save billing record
        </button>
      </div>
    </form>
  );
}
