import { BillingForm } from "@/components/finance/billing-form";
import { CostEntryForm } from "@/components/finance/cost-entry-form";
import { FinanceSummaryTable } from "@/components/finance/finance-summary-table";
import {
  createBillingRecordFromForm,
  createCostEntryFromForm,
} from "@/server/actions/finance";
import {
  getFinanceProjects,
  listCostCategories,
  listBillingRecords,
  listCostEntries,
} from "@/server/queries/finance";

export default async function FinancePage() {
  const [projects, billingRecords, costEntries, costCategories] = await Promise.all([
    getFinanceProjects(),
    listBillingRecords(),
    listCostEntries(),
    listCostCategories(),
  ]);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.34em] text-cyan-200/70">
          Finance
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Billing and cost tracking
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-300">
          Review cash movement first, then add the next billing or cost entry from the
          same workspace without hiding operational risk.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Projects</p>
          <p className="mt-2 text-2xl font-semibold text-white">{projects.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Billing records</p>
          <p className="mt-2 text-2xl font-semibold text-white">{billingRecords.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-amber-300/18 bg-amber-300/[0.06] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-100/80">Cost entries</p>
          <p className="mt-2 text-2xl font-semibold text-white">{costEntries.length}</p>
        </div>
      </div>

      <FinanceSummaryTable
        billingRecords={billingRecords}
        costEntries={costEntries}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/45 p-6">
          <div className="mb-4 space-y-2">
            <h3 className="text-lg font-semibold text-white">New billing record</h3>
            <p className="text-sm text-slate-300">
              Track the first billed work package and its expected payment date.
            </p>
          </div>
          <BillingForm action={createBillingRecordFromForm} projects={projects} />
        </div>

        <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/45 p-6">
          <div className="mb-4 space-y-2">
            <h3 className="text-lg font-semibold text-white">New cost entry</h3>
            <p className="text-sm text-slate-300">
              Log the first estimated or actual project cost against a category.
            </p>
          </div>
          <CostEntryForm
            action={createCostEntryFromForm}
            projects={projects}
            costCategories={costCategories}
          />
        </div>
      </div>
    </section>
  );
}
