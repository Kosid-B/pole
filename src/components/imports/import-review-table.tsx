import { ImportStatusBadge } from "@/components/imports/import-status-badge";
import type { ImportJobSummary } from "@/types/domain";

type ImportReviewTableProps = {
  importJobs: ImportJobSummary[];
};

export function ImportReviewTable({ importJobs }: ImportReviewTableProps) {
  if (importJobs.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-300">
        No import jobs yet. Upload the first spreadsheet or PDF to send it into
        the review queue.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/8 bg-white/[0.04]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/8 text-left text-sm text-slate-200">
        <thead className="bg-slate-950/50 text-xs uppercase tracking-[0.2em] text-sky-200/70">
          <tr>
            <th className="px-4 py-3 font-medium">File</th>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Uploaded by</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {importJobs.map((job) => (
            <tr key={job.id}>
              <td className="px-4 py-4">
                <div className="space-y-1">
                  <p className="font-medium text-white">{job.fileName}</p>
                  <p className="text-xs text-slate-400">
                    {job.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </td>
              <td className="px-4 py-4">{job.sourceType}</td>
              <td className="px-4 py-4">{job.uploadedByRole}</td>
              <td className="px-4 py-4">
                <ImportStatusBadge status={job.status} />
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}
