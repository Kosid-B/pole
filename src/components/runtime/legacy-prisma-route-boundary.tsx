import Link from "next/link";
import type { ReactNode } from "react";
import { getSessionAuthProvider } from "@/lib/auth";

type LegacyPrismaRouteBoundaryProps = {
  children: ReactNode;
  moduleLabel: string;
  replacementHref: string;
  replacementLabel: string;
};

export async function LegacyPrismaRouteBoundary({
  children,
  moduleLabel,
  replacementHref,
  replacementLabel,
}: LegacyPrismaRouteBoundaryProps) {
  const provider = await getSessionAuthProvider();

  if (provider === "legacy") {
    return children;
  }

  return (
    <section className="space-y-5" data-runtime-gate="legacy-prisma">
      <div className="rounded-[1.8rem] border border-amber-300/18 bg-amber-300/[0.055] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/70">
          Controlled migration gate
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          {moduleLabel} ยังไม่เปิดใน Supabase runtime
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          โมดูลนี้ยังใช้ legacy Prisma/SQLite data model อยู่ ระบบจึงหยุดก่อน query หรือ write เพื่อไม่สร้างข้อมูลสองแหล่งระหว่างการย้ายไป Supabase Core Registry
        </p>
        <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/35 p-4 text-sm leading-6 text-slate-400">
          <p>สถานะ: fail-closed • ไม่มี fallback ไป local/demo database</p>
          <p>เป้าหมาย: ย้าย read/write contract ให้ project-scoped บน Supabase ก่อนเปิดโมดูลนี้อีกครั้ง</p>
        </div>
        <Link
          href={replacementHref}
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
        >
          {replacementLabel}
        </Link>
      </div>
    </section>
  );
}
