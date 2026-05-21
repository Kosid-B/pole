import { BillingForm } from "@/components/finance/billing-form";
import { CostEntryForm } from "@/components/finance/cost-entry-form";
import { FinanceSummaryTable } from "@/components/finance/finance-summary-table";
import {
  createBillingRecordFromForm,
  createCostEntryFromForm,
} from "@/server/actions/finance";
import {
  getFinanceProjects,
  listBillingRecords,
  listCostEntries,
} from "@/server/queries/finance";

export default async function FinancePage() {
  const [projects, billingRecords, costEntries] = await Promise.all([
    getFinanceProjects(),
    listBillingRecords(),
    listCostEntries(),
  ]);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
          Finance
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Billing and cost tracking
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">
          Capture the first billing milestones and project cost entries from one
          finance workspace.
        </p>
      </div>

      <FinanceSummaryTable
        billingRecords={billingRecords}
        costEntries={costEntries}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
          <div className="mb-4 space-y-2">
            <h3 className="text-lg font-semibold text-white">New billing record</h3>
            <p className="text-sm text-slate-300">
              Track the first billed work package and its expected payment date.
            </p>
          </div>
          <BillingForm action={createBillingRecordFromForm} projects={projects} />
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
          <div className="mb-4 space-y-2">
            <h3 className="text-lg font-semibold text-white">New cost entry</h3>
            <p className="text-sm text-slate-300">
              Log the first estimated or actual project cost against a category.
            </p>
          </div>
          <CostEntryForm action={createCostEntryFromForm} projects={projects} />
        </div>
      </div>
    </section>
  );
}
