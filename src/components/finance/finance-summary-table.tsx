import type {
  BillingRecordSummary,
  CostEntrySummary,
} from "@/types/domain";

type FinanceSummaryTableProps = {
  billingRecords: BillingRecordSummary[];
  costEntries: CostEntrySummary[];
};

export function FinanceSummaryTable({
  billingRecords,
  costEntries,
}: FinanceSummaryTableProps) {
  if (billingRecords.length === 0 && costEntries.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-300">
        No billing or cost records yet. Add the first finance entries to start
        tracking project cash flow.
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 bg-slate-950/40 px-4 py-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-200/70">
            Billing records
          </h3>
        </div>
        <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-200">
          <thead className="bg-slate-950/30 text-xs uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Package</th>
              <th className="px-4 py-3 font-medium">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {billingRecords.map((record) => (
              <tr key={record.id}>
                <td className="px-4 py-4">{record.projectName}</td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p>{record.workPackage}</p>
                    <p className="text-xs text-slate-400">
                      Due {record.expectedPaymentDate.toLocaleDateString()}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p>{record.billedValue.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">
                      {record.isDocumentComplete ? "Complete" : "Pending docs"}
                    </p>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 bg-slate-950/40 px-4 py-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-200/70">
            Cost entries
          </h3>
        </div>
        <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-200">
          <thead className="bg-slate-950/30 text-xs uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {costEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-4">{entry.projectName}</td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p>{entry.description}</p>
                    <p className="text-xs text-slate-400">{entry.category}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p>{entry.amount.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">{entry.valueType}</p>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
