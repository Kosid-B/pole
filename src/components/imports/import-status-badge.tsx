import type { ImportJobStatus } from "@/types/domain";

type ImportStatusBadgeProps = {
  status: ImportJobStatus;
};

const statusClasses: Record<ImportJobStatus, string> = {
  NEEDS_REVIEW: "border-amber-300/30 bg-amber-300/10 text-amber-50",
  APPROVED: "border-emerald-300/30 bg-emerald-300/10 text-emerald-50",
  REJECTED: "border-rose-300/30 bg-rose-300/10 text-rose-50",
};

export function ImportStatusBadge({ status }: ImportStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusClasses[status]}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
