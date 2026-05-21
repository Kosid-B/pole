import { ImportReviewTable } from "@/components/imports/import-review-table";
import { UploadDropzone } from "@/components/imports/upload-dropzone";
import { markImportForReviewFromForm } from "@/server/actions/imports";
import { listImportJobs } from "@/server/queries/imports";

export default async function ImportsPage() {
  const importJobs = await listImportJobs();
  const reviewQueue = importJobs.filter(
    (job) => job.status === "NEEDS_REVIEW",
  ).length;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.34em] text-cyan-200/70">
          Imports
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Import review center
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-300">
          Keep incoming files in one visible queue so spreadsheets and PDFs are reviewed
          before they disturb the operating picture.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Jobs logged</p>
          <p className="mt-2 text-2xl font-semibold text-white">{importJobs.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-amber-300/18 bg-amber-300/[0.06] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-100/80">Awaiting review</p>
          <p className="mt-2 text-2xl font-semibold text-white">{reviewQueue}</p>
        </div>
        <div className="rounded-[1.5rem] border border-cyan-300/18 bg-cyan-300/[0.06] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/80">Operator note</p>
          <p className="mt-2 text-sm leading-6 text-cyan-50/90">
            Upload new files only after the review lane is visible and current.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ImportReviewTable importJobs={importJobs} />

        <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/45 p-6">
          <UploadDropzone action={markImportForReviewFromForm} />
        </div>
      </div>
    </section>
  );
}
