import Link from "next/link";
import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth";

const items = [
  { href: "/drying-yard", label: "ภาพรวม", roles: ["EXECUTIVE", "ADMIN", "FIELD_LEADER"] },
  { href: "/drying-yard/sites", label: "จุดติดตั้ง", roles: ["EXECUTIVE", "ADMIN", "FIELD_LEADER"] },
  { href: "/drying-yard/pricing", label: "ราคา & GM", roles: ["EXECUTIVE", "ADMIN"] },
  { href: "/drying-yard/boq", label: "BOQ", roles: ["EXECUTIVE", "ADMIN", "FIELD_LEADER"] },
  { href: "/drying-yard/bookings", label: "การจอง", roles: ["EXECUTIVE", "ADMIN", "FIELD_LEADER"] },
] as const;

export default async function DryingYardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const nav = items.filter((item) => item.roles.includes(session.user.role));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-sky-300/40 hover:bg-sky-400/10 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
