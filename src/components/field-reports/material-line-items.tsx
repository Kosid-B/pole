import type { UnitOfMeasureSummary } from "@/types/domain";

type MaterialLineItemsProps = {
  units: UnitOfMeasureSummary[];
};

export function MaterialLineItems({ units }: MaterialLineItemsProps) {
  return (
    <section className="space-y-4 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">Materials used</h3>
        <p className="text-sm leading-6 text-slate-300">
          Capture the first material line for this shift. The structure stays ready for
          richer multi-line editing later.
        </p>
      </div>

      <div className="grid gap-4 rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-4 sm:grid-cols-3">
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
            className="min-h-12 w-full rounded-[1.25rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
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
            className="min-h-12 w-full rounded-[1.25rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
            placeholder="18"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="materials.0.unitId" className="text-sm font-medium text-slate-200">
            Unit
          </label>
          <select
            id="materials.0.unitId"
            name="materials.0.unitId"
            required
            defaultValue=""
            className="min-h-12 w-full rounded-[1.25rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
          >
            <option value="" disabled>
              Select a unit
            </option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.nameTh} ({unit.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
