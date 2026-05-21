import { ImportReviewTable } from "@/components/imports/import-review-table";
import { UploadDropzone } from "@/components/imports/upload-dropzone";
import { markImportForReviewFromForm } from "@/server/actions/imports";
import { listImportJobs } from "@/server/queries/imports";

export default async function ImportsPage() {
  const importJobs = await listImportJobs();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
          Imports
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Import review center
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">
          Queue spreadsheets and PDFs for review so incoming operational files
          land in one visible approval workflow.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ImportReviewTable importJobs={importJobs} />

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
          <UploadDropzone action={markImportForReviewFromForm} />
        </div>
      </div>
    </section>
  );
}
