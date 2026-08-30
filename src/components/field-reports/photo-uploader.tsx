export function PhotoUploader() {
  return (
    <section className="space-y-4 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">Site photos</h3>
        <p className="text-sm leading-6 text-slate-300">
          Photo capture is staged for the next reporting iteration. This keeps the flow
          ready without expanding storage scope in this UX pass.
        </p>
      </div>

      <div className="rounded-[1.4rem] border border-dashed border-white/12 bg-white/[0.04] p-4 text-sm text-slate-300">
        <label htmlFor="photos" className="mb-2 block font-medium text-slate-200">
          Photo upload placeholder
        </label>
        <input
          id="photos"
          type="file"
          disabled
          className="block min-h-12 w-full cursor-not-allowed rounded-[1.25rem] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-500"
        />
      </div>
    </section>
  );
}
