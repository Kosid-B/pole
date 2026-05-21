import type { AppRole } from "@/lib/permissions";

const toneByRole: Record<AppRole, string> = {
  EXECUTIVE:
    "border-cyan-300/35 bg-cyan-300/12 text-cyan-100 shadow-[0_0_24px_rgba(103,232,249,0.08)]",
  ADMIN:
    "border-sky-300/35 bg-sky-300/12 text-sky-100 shadow-[0_0_24px_rgba(56,189,248,0.08)]",
  FIELD_LEADER:
    "border-emerald-300/35 bg-emerald-300/12 text-emerald-100 shadow-[0_0_24px_rgba(52,211,153,0.08)]",
};

type RoleBadgeProps = {
  role: AppRole;
};

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] ${toneByRole[role]}`}
    >
      {role.replace("_", " ")}
    </span>
  );
}
