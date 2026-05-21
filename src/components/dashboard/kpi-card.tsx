type KpiCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function KpiCard({ label, value, detail }: KpiCardProps) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-sky-200/70">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-300">{detail}</p>
    </article>
  );
}
