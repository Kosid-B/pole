export function EquipmentLineItems() {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-white">Equipment used</h3>
        <p className="text-sm text-slate-300">
          Record the first equipment line used by the crew on this reporting
          date.
        </p>
      </div>

      <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label
            htmlFor="equipment.0.name"
            className="text-sm font-medium text-slate-200"
          >
            Equipment name
          </label>
          <input
            id="equipment.0.name"
            name="equipment.0.name"
            type="text"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            placeholder="Boom truck"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="equipment.0.quantity"
            className="text-sm font-medium text-slate-200"
          >
            Quantity
          </label>
          <input
            id="equipment.0.quantity"
            name="equipment.0.quantity"
            type="number"
            min="1"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            placeholder="1"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="equipment.0.unit"
            className="text-sm font-medium text-slate-200"
          >
            Unit
          </label>
          <input
            id="equipment.0.unit"
            name="equipment.0.unit"
            type="text"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            placeholder="unit"
          />
        </div>
      </div>
    </section>
  );
}
