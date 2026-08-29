import { getDryingYardOverview } from "@/lib/drying-yard";

export default async function DryingYardSitesPage() {
  const result = await getDryingYardOverview();
  if (!result.data) {
    return <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-100">{result.error}</div>;
  }

  const sites = result.data.sites;
  const provinces = [...new Set(sites.map((site) => site.province).filter(Boolean))].sort((a, b) => a.localeCompare(b, "th"));

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-medium text-sky-300">งานลานตาก</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">จุดติดตั้ง 446 จุด</h1>
        <p className="mt-2 text-sm text-slate-400">จังหวัด / อำเภอ / G / Tier / ราคาคอนกรีต / สถานะการจอง</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">จังหวัด</p><p className="mt-2 text-2xl font-semibold">{provinces.length}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">อำเภอ</p><p className="mt-2 text-2xl font-semibold">{new Set(sites.map((s) => `${s.province}|${s.district}`)).size}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">G63</p><p className="mt-2 text-2xl font-semibold text-sky-300">{sites.filter((s) => s.installation_type === "G63").length}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">G64</p><p className="mt-2 text-2xl font-semibold text-emerald-300">{sites.filter((s) => s.installation_type === "G64").length}</p></div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.12em] text-slate-400">
            <tr><th className="px-4 py-3">Point ID</th><th className="px-4 py-3">จังหวัด</th><th className="px-4 py-3">อำเภอ</th><th className="px-4 py-3">G</th><th className="px-4 py-3">Tier</th><th className="px-4 py-3 text-right">คอนกรีต/ลบ.ม.</th><th className="px-4 py-3">สถานะ</th></tr>
          </thead>
          <tbody>
            {sites.map((site) => (
              <tr key={site.id} className="border-t border-white/5 text-slate-200">
                <td className="px-4 py-3 font-medium text-white">{site.site_code}</td>
                <td className="px-4 py-3">{site.province}</td>
                <td className="px-4 py-3">{site.district}</td>
                <td className="px-4 py-3">{site.installation_type}</td>
                <td className="px-4 py-3">{site.tier || "-"}</td>
                <td className="px-4 py-3 text-right">{site.concrete_unit_cost ? Number(site.concrete_unit_cost).toLocaleString("th-TH") : "-"}</td>
                <td className="px-4 py-3">{site.reservation?.status === "approved" ? "จองแล้ว" : site.reservation?.status === "pending" ? "รอ Admin" : "ว่าง"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
