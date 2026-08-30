import type { EquipmentMasterSummary, UnitOfMeasureSummary } from "@/types/domain";

type EquipmentLineItemsProps = {
  equipmentMasters: EquipmentMasterSummary[];
  units: UnitOfMeasureSummary[];
  defaultUnitId?: string;
};

export function EquipmentLineItems({
  equipmentMasters,
  units,
  defaultUnitId,
}: EquipmentLineItemsProps) {
  return (
    <section className="space-y-4 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">Equipment used</h3>
        <p className="text-sm leading-6 text-slate-300">
          Pick one of the standard machines when it fits, or enter a custom machine name
          for unusual field usage.
        </p>
      </div>

      <div className="grid gap-4 rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <label
            htmlFor="equipment.0.equipmentMasterId"
            className="text-sm font-medium text-slate-200"
          >
            Suggested machine
          </label>
          <select
            id="equipment.0.equipmentMasterId"
            name="equipment.0.equipmentMasterId"
            defaultValue=""
            className="min-h-12 w-full rounded-[1.25rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
          >
            <option value="">Custom machine</option>
            {equipmentMasters.map((equipment) => (
              <option key={equipment.id} value={equipment.id}>
                {equipment.nameTh}
              </option>
            ))}
          </select>
        </div>

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
            className="min-h-12 w-full rounded-[1.25rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
            placeholder="เครื่องเจาะ หรือชื่อเฉพาะหน้างาน"
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
            className="min-h-12 w-full rounded-[1.25rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
            placeholder="1"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="equipment.0.unitId" className="text-sm font-medium text-slate-200">
            Unit
          </label>
          <select
            id="equipment.0.unitId"
            name="equipment.0.unitId"
            required
            defaultValue={defaultUnitId ?? ""}
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
