import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
};

export function EmptyState({
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-3xl border border-dashed border-white/10 bg-white/5 text-slate-300 ${
        compact ? "p-4 text-sm" : "p-8 text-sm"
      }`}
    >
      <div className="space-y-2">
        <h3 className="font-medium text-white">{title}</h3>
        <p>{description}</p>
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
