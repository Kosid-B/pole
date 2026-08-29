import { getDryingYardOverview } from "@/lib/drying-yard";

function baht(value: number | null) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default async function DryingYardBookingsPage() {
  const result = await getDryingYardOverview();
  if (!result.data) {
    return <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-100">{result.error}</div>;
  }

  const reservations = result.data.reservations;
  const siteMap = new Map(result.data.sites.map((site) => [site.id, site]));
  const pending = reservations.filter((r) => r.status === "pending");
  const approved = reservations.filter((r) => r.status === "approved");
  const rejected = reservations.filter((r) => r.status === "rejected");

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-medium text-sky-300">Installation booking</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">การจองจุดติดตั้ง</h1>
        <p className="mt-2 text-sm text-slate-400">Pending และ Approved ถูกล็อกที่ฐานข้อมูลเพื่อป้องกันการจองซ้ำ</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4"><p className="text-xs text-amber-100/70">รอ Admin</p><p className="mt-2 text-3xl font-semibold text-amber-100">{pending.length}</p></div>
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4"><p className="text-xs text-emerald-100/70">อนุมัติแล้ว</p><p className="mt-2 text-3xl font-semibold text-emerald-100">{approved.length}</p></div>
        <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4"><p className="text-xs text-rose-100/70">ปฏิเสธ</p><p className="mt-2 text-3xl font-semibold text-rose-100">{rejected.length}</p></div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.12em] text-slate-400">
            <tr><th className="px-4 py-3">Point</th><th className="px-4 py-3">จังหวัด/อำเภอ</th><th className="px-4 py-3">G</th><th className="px-4 py-3">ทีม</th><th className="px-4 py-3 text-right">พื้นที่</th><th className="px-4 py-3">วันติดตั้ง</th><th className="px-4 py-3 text-right">ค่าติดตั้ง</th><th className="px-4 py-3">สถานะ</th></tr>
          </thead>
          <tbody>
            {reservations.map((r) => {
              const site = siteMap.get(r.site_id);
              return (
                <tr key={r.id} className="border-t border-white/5 text-slate-200">
                  <td className="px-4 py-3 font-medium text-white">{site?.site_code || "-"}</td>
                  <td className="px-4 py-3">{site ? `${site.province} / ${site.district}` : "-"}</td>
                  <td className="px-4 py-3">{site?.installation_type || "-"}</td>
                  <td className="px-4 py-3">{r.team_name || "-"}</td>
                  <td className="px-4 py-3 text-right">{r.area_m2 ? `${r.area_m2} ตร.ม.` : "-"}</td>
                  <td className="px-4 py-3">{r.requested_install_date || "ไม่ระบุ"}</td>
                  <td className="px-4 py-3 text-right">{baht(r.installation_fee_total)}</td>
                  <td className="px-4 py-3"><span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs">{r.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
