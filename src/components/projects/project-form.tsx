import { AreaForm } from "@/components/projects/area-form";

type ProjectFormProps = {
  action: (formData: FormData) => Promise<void>;
};

export function ProjectForm({ action }: ProjectFormProps) {
  return (
    <form action={action} className="space-y-6">
      <section className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-200">
            Project name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            placeholder="Project East"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="contractValue"
              className="text-sm font-medium text-slate-200"
            >
              Contract value
            </label>
            <input
              id="contractValue"
              name="contractValue"
              type="number"
              min="1"
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
              placeholder="5000000"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="targetUnits"
              className="text-sm font-medium text-slate-200"
            >
              Target units
            </label>
            <input
              id="targetUnits"
              name="targetUnits"
              type="number"
              min="0"
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
              placeholder="1200"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Initial area</h3>
          <p className="text-sm text-slate-300">
            Start each project with its first reporting area so later tasks have
            a concrete location to build on.
          </p>
        </div>
        <AreaForm />
      </section>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
        >
          Save project
        </button>
      </div>
    </form>
  );
}
