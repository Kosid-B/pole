import Link from "next/link";
import { getChangeAccountHref, signOut, type AppSession } from "@/lib/auth";
import type { SiteCostProjectContext } from "@/lib/project-context";
import { selectSiteCostProject } from "@/server/actions/project-context";

type TopBarProps = {
  session: AppSession;
  selectedProject?: SiteCostProjectContext | null;
  projects?: SiteCostProjectContext[];
  projectCount?: number;
};

export function TopBar({
  session,
  selectedProject = null,
  projects = [],
  projectCount = 0,
}: TopBarProps) {
  const accessibleProjectCount = projects.length || projectCount;
  const canSwitchProject = Boolean(selectedProject && projects.length > 1);

  return (
    <header className="rounded-[2rem] border border-[var(--panel-border)] bg-[var(--panel-soft)] px-5 py-4 shadow-[0_20px_60px_rgba(2,6,23,0.28)] backdrop-blur sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold text-emerald-100">
              ระบบพร้อมใช้งาน
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-medium text-slate-300">
              {session.user.role}
            </span>
            {selectedProject ? (
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold text-cyan-100">
                Project scoped
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[1.8rem]">
            SiteCost Project Command Center
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
            ตัดสินใจจากสถานะสำคัญก่อน แล้วค่อยลงรายละเอียดในแต่ละโมดูล
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {canSwitchProject && selectedProject ? (
            <form
              key={selectedProject.id}
              action={selectSiteCostProject}
              aria-label="เปลี่ยนโครงการที่กำลังใช้งาน"
              className="min-w-0 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-3 sm:min-w-[22rem]"
            >
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="sitecost-project-selector"
                  className="text-[11px] font-medium text-cyan-100/70"
                >
                  โครงการที่ต้องการใช้
                </label>
                <Link
                  href="/projects"
                  className="text-[11px] font-medium text-cyan-100/70 underline-offset-4 hover:text-cyan-50 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                >
                  ดูพอร์ต
                </Link>
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <select
                  id="sitecost-project-selector"
                  name="projectId"
                  defaultValue={selectedProject.id}
                  className="min-h-12 min-w-0 flex-1 rounded-xl border border-cyan-100/15 bg-slate-950/80 px-3 py-2 text-sm font-medium text-cyan-50 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.project_name} — {project.project_code}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                >
                  เปลี่ยนโครงการ
                </button>
              </div>
              <p className="mt-2 truncate text-[11px] text-cyan-100/60">
                ปัจจุบัน: {selectedProject.project_code} • {selectedProject.enabled_modules.length} modules • {accessibleProjectCount} projects accessible
              </p>
            </form>
          ) : selectedProject ? (
            <Link
              href="/projects"
              aria-label={`ดูโครงการ ${selectedProject.project_name}`}
              className="min-h-12 min-w-0 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2.5 text-left transition hover:border-cyan-300/45 hover:bg-cyan-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 sm:min-w-72"
            >
              <span className="block text-[11px] font-medium text-cyan-100/70">โครงการปัจจุบัน</span>
              <span className="mt-0.5 block truncate text-sm font-semibold text-cyan-50">
                {selectedProject.project_name}
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-cyan-100/60">
                {selectedProject.project_code} • {selectedProject.enabled_modules.length} modules
                {accessibleProjectCount > 1
                  ? ` • ${accessibleProjectCount} projects accessible`
                  : ""}
              </span>
            </Link>
          ) : (
            <Link
              href="/projects"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-50 transition hover:border-cyan-300/45 hover:bg-cyan-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            >
              เลือก / ดูโครงการ
            </Link>
          )}

          <div className="min-w-0 rounded-2xl border border-white/8 bg-slate-950/60 px-4 py-2.5 sm:max-w-64">
            <p className="truncate text-xs text-slate-500">Signed in as</p>
            <p className="truncate text-sm font-medium text-slate-200">{session.user.email}</p>
          </div>

          <Link
            href={getChangeAccountHref()}
            prefetch={false}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          >
            เปลี่ยนบัญชี
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-rose-300/10 hover:text-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60 sm:w-auto"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
