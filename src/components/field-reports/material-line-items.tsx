export function MaterialLineItems() {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-white">Materials used</h3>
        <p className="text-sm text-slate-300">
          Capture the first material line for this report. The array-based field
          names keep the workflow ready for richer multi-line editing later.
        </p>
      </div>

      <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label
            htmlFor="materials.0.name"
            className="text-sm font-medium text-slate-200"
          >
            Material name
          </label>
          <input
            id="materials.0.name"
            name="materials.0.name"
            type="text"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            placeholder="Concrete pole"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="materials.0.quantity"
            className="text-sm font-medium text-slate-200"
          >
            Quantity
          </label>
          <input
            id="materials.0.quantity"
            name="materials.0.quantity"
            type="number"
            min="1"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            placeholder="18"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="materials.0.unit"
            className="text-sm font-medium text-slate-200"
          >
            Unit
          </label>
          <input
            id="materials.0.unit"
            name="materials.0.unit"
            type="text"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            placeholder="pcs"
          />
        </div>
      </div>
    </section>
  );
}
