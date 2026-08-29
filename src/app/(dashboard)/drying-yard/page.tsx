import Link from "next/link";
import { requireSession } from "@/lib/auth";
import {
  getDryingYardOverview,
  getProvinceRollup,
  summarizeDryingYard,
} from "@/lib/drying-yard";

const TEAM_PORTAL_URL =
  process.env.NEXT_PUBLIC_DRYING_YARD_TEAM_URL ||
  "https://raw.githack.com/Kosid-B/pole/lantak-public/public/lantak-team-loader.html";
const ADMIN_PORTAL_URL =
  process.env.NEXT_PUBLIC_DRYING_YARD_ADMIN_URL ||
  "https://raw.githack.com/Kosid-B/pole/admin-public/public/lantak-admin.html";

function baht(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function million(value: number) {
  return `${new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 2,
  }).format(value / 1_000_000)} ลบ.`;
}

function KpiCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
      {detail ? <p className="mt-2 text-sm text-slate-400">{detail}</p> : null}
    </article>
  );
}

export default async function DryingYardPage() {
  const session = await requireSession();
  const result = await getDryingYardOverview();
  const isFieldLeader = session.user.role === "FIELD_LEADER";

  if (!result.data) {
    return (
      <section className="space-y-6">
        <div>
          <p className="text-sm font-medium text-sky-300">งานลานตาก</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Drying Yard 446 จุด
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            โมดูลถูกเพิ่มเข้า SaaS งานเสาแล้ว แต่ยังต้องตั้งค่า Server Environment
            เพื่อเชื่อมข้อมูล Supabase แบบไม่เปิดเผยรหัส Admin ใน Browser
          </p>
        </div>

        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6">
          <h2 className="text-lg font-semibold text-amber-100">Integration setup</h2>
          <p className="mt-2 text-sm text-amber-50/80">{result.error}</p>
          <div className="mt-4 space-y-1 rounded-2xl bg-slate-950/60 p-4 font-mono text-xs text-slate-300">
            <p>DRYING_YARD_ADMIN_USERNAME=...</p>
            <p>DRYING_YARD_ADMIN_PASSWORD=...</p>
            <p>DRYING_YARD_ADMIN_API_URL=https://.../drying-yard-admin-api</p>
          </div>
        </div>
      </section>
    );
  }

  const summary = summarizeDryingYard(result.data.sites);
  const provinces = getProvinceRollup(result.data.sites);
  const gm = Number(result.data.pricing_settings?.gross_margin || 0.32);
  const vat = Number(result.data.pricing_settings?.vat_rate || 0.07);
  const g63Percent = summary.siteCount ? (summary.g63 / summary.siteCount) * 100 : 0;
  const topSiteCount = Math.max(...provinces.map((row) => row.sites), 1);

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
              DRYING-YARD-446
            </span>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
              Supabase connected
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            งานลานตาก 446 จุด
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            G63 / G64 • BOQ • ต้นทุน • ราคา • ทีมติดตั้ง • การจองจุด
            รวมอยู่ใน SaaS งานเสาเดียวกัน
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={TEAM_PORTAL_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            เปิดระบบทีมติดตั้ง ↗
          </a>
          {!isFieldLeader ? (
            <a
              href={ADMIN_PORTAL_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              เปิด Admin Pricing ↗
            </a>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="จุดติดตั้ง"
          value={summary.siteCount.toLocaleString("th-TH")}
          detail={`${summary.provinceCount} จังหวัด • ${summary.districtCount} อำเภอ`}
        />
        <KpiCard
          label="G63"
          value={summary.g63.toLocaleString("th-TH")}
          detail={`${g63Percent.toFixed(1)}% ของโครงการ`}
        />
        <KpiCard
          label="G64"
          value={summary.g64.toLocaleString("th-TH")}
          detail={`${(100 - g63Percent).toFixed(1)}% ของโครงการ`}
        />
        <KpiCard
          label="สถานะจอง"
          value={`${summary.approved} อนุมัติ`}
          detail={`${summary.pending} รอ Admin • ${summary.free} ว่าง`}
        />
      </div>

      {!isFieldLeader ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="ต้นทุนรวม" value={million(summary.cost)} />
          <KpiCard label="ขายก่อน VAT" value={million(summary.salePreVat)} />
          <KpiCard label="กำไรรวม" value={million(summary.profit)} />
          <KpiCard
            label="Pricing control"
            value={`GM ${(gm * 100).toFixed(1)}%`}
            detail={`VAT ${(vat * 100).toFixed(1)}% • ราคาขายรวม ${million(summary.finalPrice)}`}
          />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">จังหวัดติดตั้ง</h2>
              <p className="mt-1 text-sm text-slate-400">
                จำนวนจุดสูงสุด 12 จังหวัดแรก
              </p>
            </div>
            <span className="text-sm text-slate-400">24 จังหวัด / 446 จุด</span>
          </div>

          <div className="mt-6 space-y-4">
            {provinces.slice(0, 12).map((row) => (
              <div key={row.province} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3">
                <span className="truncate text-sm text-slate-200">{row.province}</span>
                <div className="h-3 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                    style={{ width: `${Math.max((row.sites / topSiteCount) * 100, 2)}%` }}
                  />
                </div>
                <span className="text-right text-sm font-semibold text-white">
                  {row.sites}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Package structure</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-sky-300/10 bg-sky-400/10 p-4">
              <p className="text-lg font-semibold text-sky-100">G63</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                ลานปูนตากผลผลิต + CCTV Smart + Solar + เสา G65 จำนวน 1 ต้น/จุด
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-300/10 bg-emerald-400/10 p-4">
              <p className="text-lg font-semibold text-emerald-100">G64</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                ลานปูนตากผลผลิต + CCTV Smart + Speaker Smart + Solar + เสา G69 จำนวน 1 ต้น/จุด
              </p>
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">ขนาดลานและ BOQ planning profile</h2>
            <p className="mt-1 text-sm text-slate-400">
              G63 และ G64 รองรับทั้ง 3 ขนาด • ตรวจ BOQ/แบบล่าสุดก่อนออก PO
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { area: "120 ตร.ม.", dim: "12 × 10 ม.", concrete: "18.35 m³", rb19: "≈ 102.77 kg" },
            { area: "192 ตร.ม.", dim: "16 × 12 ม.", concrete: "29.36 m³", rb19: "≈ 130.80 kg" },
            { area: "252 ตร.ม.", dim: "18 × 14 ม.", concrete: "38.535 m³", rb19: "≈ 149.49 kg" },
          ].map((profile) => (
            <div key={profile.area} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
              <p className="text-lg font-semibold text-white">{profile.area}</p>
              <p className="mt-1 text-sm text-sky-200">{profile.dim}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-slate-400">Concrete ST240</dt><dd>{profile.concrete}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-400">RB19</dt><dd>{profile.rb19}</dd></div>
              </dl>
            </div>
          ))}
        </div>
      </article>

      {!isFieldLeader ? (
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Top provinces by project value</h2>
              <p className="mt-1 text-sm text-slate-400">
                ข้อมูลต้นทุนและกำไรแสดงเฉพาะ Executive / Admin
              </p>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="text-left text-xs uppercase tracking-[0.14em] text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="px-3 py-3">จังหวัด</th>
                  <th className="px-3 py-3 text-right">จุด</th>
                  <th className="px-3 py-3 text-right">G63</th>
                  <th className="px-3 py-3 text-right">G64</th>
                  <th className="px-3 py-3 text-right">ต้นทุน</th>
                  <th className="px-3 py-3 text-right">ขายรวม VAT</th>
                  <th className="px-3 py-3 text-right">กำไร</th>
                </tr>
              </thead>
              <tbody>
                {provinces.slice(0, 12).map((row) => (
                  <tr key={row.province} className="border-b border-white/5 text-slate-200">
                    <td className="px-3 py-3 font-medium text-white">{row.province}</td>
                    <td className="px-3 py-3 text-right">{row.sites}</td>
                    <td className="px-3 py-3 text-right">{row.g63}</td>
                    <td className="px-3 py-3 text-right">{row.g64}</td>
                    <td className="px-3 py-3 text-right">{baht(row.cost)}</td>
                    <td className="px-3 py-3 text-right">{baht(row.finalPrice)}</td>
                    <td className="px-3 py-3 text-right text-emerald-300">{baht(row.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : (
        <article className="rounded-3xl border border-sky-300/20 bg-sky-400/10 p-6">
          <h2 className="text-xl font-semibold text-sky-100">Field Leader workspace</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
            บทบาท Field Leader จะเห็นจำนวนจุด สถานะการจอง Package และ BOQ planning
            แต่ระบบจะไม่ส่งต้นทุน กำไร หรือ Gross Margin มายัง UI นี้
          </p>
          <Link
            href={TEAM_PORTAL_URL}
            className="mt-4 inline-flex rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            ไปยังระบบทีมติดตั้ง
          </Link>
        </article>
      )}
    </section>
  );
}
