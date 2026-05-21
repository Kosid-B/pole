type UploadDropzoneProps = {
  action: (formData: FormData) => Promise<void>;
};

export function UploadDropzone({ action }: UploadDropzoneProps) {
  return (
    <form action={action} className="space-y-5">
      <div className="rounded-[2rem] border border-dashed border-sky-300/30 bg-sky-300/5 p-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">
            Upload for review
          </h3>
          <p className="text-sm text-slate-300">
            Task 8 focuses on the first review workflow, so this captures upload
            metadata and queues the job without implementing storage yet.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 lg:col-span-2">
            <label
              htmlFor="fileName"
              className="text-sm font-medium text-slate-200"
            >
              File name
            </label>
            <input
              id="fileName"
              name="fileName"
              type="text"
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
              placeholder="daily-progress.xlsx"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="sourceType"
              className="text-sm font-medium text-slate-200"
            >
              Source type
            </label>
            <select
              id="sourceType"
              name="sourceType"
              required
              defaultValue="SPREADSHEET"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            >
              <option value="SPREADSHEET">Spreadsheet</option>
              <option value="PDF">PDF</option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="uploadedByRole"
              className="text-sm font-medium text-slate-200"
            >
              Uploaded by role
            </label>
            <select
              id="uploadedByRole"
              name="uploadedByRole"
              required
              defaultValue="ADMIN"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
            >
              <option value="ADMIN">Admin</option>
              <option value="EXECUTIVE">Executive</option>
              <option value="FIELD_LEADER">Field leader</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
        >
          Mark for review
        </button>
      </div>
    </form>
  );
}
