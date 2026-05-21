type KpiCardProps = {
  label: string;
  value: string;
  detail: string;
  signal?: string;
  tone?: "default" | "focus" | "warning";
};

const toneClasses: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "border-white/8 bg-white/[0.04]",
  focus:
    "border-cyan-300/25 bg-[linear-gradient(180deg,rgba(34,211,238,0.12),rgba(255,255,255,0.04))]",
  warning:
    "border-amber-300/25 bg-[linear-gradient(180deg,rgba(251,191,36,0.1),rgba(255,255,255,0.04))]",
};

export function KpiCard({
  label,
  value,
  detail,
  signal,
  tone = "default",
}: KpiCardProps) {
  return (
    <article
      className={`rounded-[1.75rem] border p-5 shadow-[0_20px_40px_rgba(2,6,23,0.18)] ${toneClasses[tone]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
          {label}
        </p>
        {signal ? (
          <span className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">
            {signal}
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{detail}</p>
    </article>
  );
}
