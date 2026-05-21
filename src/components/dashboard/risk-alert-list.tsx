import type { DashboardAlert } from "@/lib/dashboard/get-dashboard-alerts";
import { EmptyState } from "@/components/shared/empty-state";

type RiskAlertListProps = {
  alerts: DashboardAlert[];
};

const severityClasses: Record<DashboardAlert["severity"], string> = {
  high: "border-rose-300/30 bg-rose-300/10",
  medium: "border-amber-300/30 bg-amber-300/10",
  info: "border-sky-300/30 bg-sky-300/10",
};

export function RiskAlertList({ alerts }: RiskAlertListProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">Risk alerts</h3>
        <p className="text-sm text-slate-300">
          Early signals pulled from field reports, finance, and import review.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {alerts.length === 0 ? (
          <EmptyState
            compact
            title="No active alerts"
            description="The current portfolio looks clear from this first dashboard pass."
          />
        ) : (
          alerts.map((alert) => (
            <article
              key={alert.id}
              className={`rounded-3xl border p-4 ${severityClasses[alert.severity]}`}
            >
              <p className="text-sm font-semibold text-white">{alert.title}</p>
              <p className="mt-2 text-sm text-slate-200">{alert.description}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
