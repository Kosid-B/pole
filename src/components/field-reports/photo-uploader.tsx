export function PhotoUploader() {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-white">Site photos</h3>
        <p className="text-sm text-slate-300">
          Photo capture is staged for the next reporting iteration. This placeholder
          keeps the form structure ready without expanding storage scope in Task 6.
        </p>
      </div>

      <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        <label htmlFor="photos" className="mb-2 block font-medium text-slate-200">
          Photo upload placeholder
        </label>
        <input
          id="photos"
          type="file"
          disabled
          className="block w-full cursor-not-allowed rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-500"
        />
      </div>
    </section>
  );
}
