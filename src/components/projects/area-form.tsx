export function AreaForm() {
  return (
    <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2">
      <div className="space-y-2">
        <label
          htmlFor="initialArea.name"
          className="text-sm font-medium text-slate-200"
        >
          Initial area name
        </label>
        <input
          id="initialArea.name"
          name="initialArea.name"
          type="text"
          required
          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
          placeholder="Zone A"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="initialArea.province"
          className="text-sm font-medium text-slate-200"
        >
          Province
        </label>
        <input
          id="initialArea.province"
          name="initialArea.province"
          type="text"
          required
          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
          placeholder="Ubon Ratchathani"
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <label
          htmlFor="initialArea.targetUnits"
          className="text-sm font-medium text-slate-200"
        >
          Initial area target units
        </label>
        <input
          id="initialArea.targetUnits"
          name="initialArea.targetUnits"
          type="number"
          min="0"
          required
          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
          placeholder="600"
        />
      </div>
    </div>
  );
}
