import type { AppRole } from "@/lib/permissions";

const toneByRole: Record<AppRole, string> = {
  EXECUTIVE: "border-amber-400/40 bg-amber-400/15 text-amber-100",
  ADMIN: "border-sky-400/40 bg-sky-400/15 text-sky-100",
  FIELD_LEADER: "border-emerald-400/40 bg-emerald-400/15 text-emerald-100",
};

type RoleBadgeProps = {
  role: AppRole;
};

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${toneByRole[role]}`}
    >
      {role.replace("_", " ")}
    </span>
  );
}
