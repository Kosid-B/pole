import Link from "next/link";
import type { ProjectStatus, ProjectSummary } from "@/types/domain";

type ProjectTableProps = {
  projects: ProjectSummary[];
};

const statusMeta: Record<
  ProjectStatus,
  { label: string; className: string; nextFocus: string }
> = {
  PLANNING: {
    label: "กำลังวางแผน",
    className: "border-sky-300/20 bg-sky-300/10 text-sky-100",
    nextFocus: "ยืนยันพื้นที่ ทีม และ baseline ก่อนเริ่ม execution",
  },
  ACTIVE: {
    label: "กำลังดำเนินงาน",
    className: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    nextFocus: "ติดตาม exception, ความคืบหน้า และ cash guardrail",
  },
  ON_HOLD: {
    label: "พักงาน",
    className: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    nextFocus: "ตรวจสาเหตุ HOLD และเงื่อนไขที่ต้องปลดก่อนเดินงานต่อ",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    className: "border-white/10 bg-white/[0.05] text-slate-300",
    nextFocus: "ตรวจ closing evidence, billing และบทเรียนโครงการ",
  },
};

function formatBaht(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const meta = statusMeta[status];

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function PrimaryArea({ project }: { project: ProjectSummary }) {
  const area = project.areas[0];
  if (!area) {
    return <span className="text-slate-500">ยังไม่มีพื้นที่</span>;
  }

  return (
    <span>
      <span className="block text-slate-200">{area.name}</span>
      <span className="mt-0.5 block text-xs text-slate-500">
        {area.province}{area.district ? ` • ${area.district}` : ""}
      </span>
    </span>
  );
}

export function ProjectTable({ projects }: ProjectTableProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-cyan-300/20 bg-cyan-300/[0.04] p-6 sm:p-8">
        <p className="text-sm font-semibold text-white">ยังไม่มีโครงการใน Portfolio</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
          สร้างโครงการแรกก่อน แล้วค่อยเพิ่มพื้นที่ ทีม และข้อมูลการเงินตามลำดับ เพื่อลดการตั้งค่าที่ไม่จำเป็นตั้งแต่ต้น
        </p>
        <Link
          href="/projects/new"
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
        >
          สร้างโครงการแรก
        </Link>
      </div>
    );
  }

  return (
    <section aria-labelledby="portfolio-project-list" className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Projects</p>
          <h3 id="portfolio-project-list" className="mt-1 text-xl font-semibold text-white">
            โครงการที่ต้องบริหาร
          </h3>
          <p className="mt-1 text-sm text-slate-400">สถานะและสิ่งที่ควรโฟกัสจะแสดงก่อนรายละเอียดเชิงทะเบียน</p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
        >
          + สร้างโครงการใหม่
        </Link>
      </div>

      <div className="grid gap-3 md:hidden">
        {projects.map((project) => {
          const meta = statusMeta[project.status];
          return (
            <article
              key={project.id}
              className="rounded-[1.6rem] border border-white/8 bg-white/[0.04] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-white">{project.name}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {project.customerName || "ยังไม่ได้ระบุลูกค้า"}
                  </p>
                </div>
                <ProjectStatusBadge status={project.status} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-white/6 bg-slate-950/35 p-3">
                  <p className="text-[11px] text-slate-500">มูลค่าสัญญา</p>
                  <p className="mt-1 text-sm font-semibold text-white">{formatBaht(project.contractValue)}</p>
                </div>
                <div className="rounded-2xl border border-white/6 bg-slate-950/35 p-3">
                  <p className="text-[11px] text-slate-500">ขอบเขต</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {project.areas.length} พื้นที่ • {project.targetUnits.toLocaleString("th-TH")} units
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.05] p-3">
                <p className="text-[11px] font-semibold text-cyan-100/70">NEXT FOCUS</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{meta.nextFocus}</p>
              </div>

              <div className="mt-3 border-t border-white/6 pt-3 text-sm">
                <p className="text-xs text-slate-500">พื้นที่หลัก</p>
                <div className="mt-1"><PrimaryArea project={project} /></div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-[1.75rem] border border-white/8 bg-white/[0.04] md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/8 text-left text-sm text-slate-200">
            <thead className="bg-slate-950/50 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">โครงการ / สถานะ</th>
                <th className="px-5 py-3 font-medium">Next focus</th>
                <th className="px-5 py-3 font-medium">มูลค่าสัญญา</th>
                <th className="px-5 py-3 font-medium">ขอบเขต</th>
                <th className="px-5 py-3 font-medium">พื้นที่หลัก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {projects.map((project) => (
                <tr key={project.id} className="align-top transition hover:bg-white/[0.025]">
                  <td className="px-5 py-4">
                    <div className="max-w-xs space-y-2">
                      <p className="font-semibold text-white">{project.name}</p>
                      <p className="text-xs text-slate-500">{project.customerName || "ยังไม่ได้ระบุลูกค้า"}</p>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                  </td>
                  <td className="max-w-sm px-5 py-4 text-sm leading-6 text-slate-300">
                    {statusMeta[project.status].nextFocus}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-white">
                    {formatBaht(project.contractValue)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="block text-white">{project.areas.length} พื้นที่</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {project.targetUnits.toLocaleString("th-TH")} target units • {project.teams.length} teams
                    </span>
                  </td>
                  <td className="px-5 py-4"><PrimaryArea project={project} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
