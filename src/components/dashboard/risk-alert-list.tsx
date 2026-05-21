import type { DashboardAlert } from "@/lib/dashboard/get-dashboard-alerts";
import { EmptyState } from "@/components/shared/empty-state";

type RiskAlertListProps = {
  alerts: DashboardAlert[];
};

const severityClasses: Record<DashboardAlert["severity"], string> = {
  high: "border-rose-300/30 bg-rose-300/10 text-rose-100",
  medium: "border-amber-300/30 bg-amber-300/10 text-amber-50",
  info: "border-cyan-300/30 bg-cyan-300/10 text-cyan-50",
};

export function RiskAlertList({ alerts }: RiskAlertListProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/8 bg-slate-950/45 p-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
          Action queue
        </p>
        <h3 className="text-lg font-semibold text-white">Risk alerts and follow-up</h3>
        <p className="text-sm leading-6 text-slate-300">
          Early signals pulled from field reports, finance, and import review.
        </p>
      </div>

      <div className="mt-6 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-white">Active attention items</span>
          <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
            {alerts.length.toLocaleString()} in queue
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
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
              className={`rounded-[1.4rem] border p-4 ${severityClasses[alert.severity]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-white">{alert.title}</p>
                <span className="rounded-full border border-white/10 bg-slate-950/35 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-200">
                  {alert.severity}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-current/90">{alert.description}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
