import type {
  SiteCostProjectContext,
  SiteCostProjectContextPayload,
} from "@/lib/project-context";

type AuthoritativeProjectRegistryProps = {
  projects: SiteCostProjectContext[];
  selectedProjectId: string | null;
  authMode: SiteCostProjectContextPayload["auth_mode"];
};

const moduleLabels: Record<string, string> = {
  commercial: "Commercial",
  pm: "PM",
  procurement: "Procurement",
  field: "Field",
  finance: "Finance",
};

function statusLabel(status: string) {
  if (status.toLowerCase() === "active") return "ใช้งานอยู่";
  if (status.toLowerCase() === "inactive") return "ปิดใช้งาน";
  if (status.toLowerCase() === "suspended") return "ระงับชั่วคราว";
  return status;
}

export function AuthoritativeProjectRegistry({
  projects,
  selectedProjectId,
  authMode,
}: AuthoritativeProjectRegistryProps) {
  return (
    <section
      aria-labelledby="authorized-project-registry-title"
      className="rounded-[1.75rem] border border-cyan-300/14 bg-cyan-300/[0.035] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
            Authoritative registry
          </p>
          <h3 id="authorized-project-registry-title" className="mt-1 text-xl font-semibold text-white">
            โครงการที่บัญชีนี้เข้าถึงได้
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            รายการนี้มาจาก Supabase Core Project Registry และใช้สิทธิ์ของ credential หรือ membership เป็นตัวกำหนด scope
          </p>
        </div>
        <span className="w-fit rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-400">
          Auth: {authMode === "supabase" ? "Supabase" : "Legacy bridge"}
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="mt-5 rounded-[1.4rem] border border-dashed border-white/10 bg-slate-950/30 p-6 text-sm leading-6 text-slate-400">
          บัญชีนี้ยังไม่มี Project membership ที่ใช้งานได้ จึงไม่แสดงโครงการจากฐานข้อมูลอื่นมาทดแทน
        </div>
      ) : (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {projects.map((project) => {
            const isSelected = project.id === selectedProjectId;

            return (
              <article
                key={project.id}
                className={`rounded-[1.5rem] border p-5 ${
                  isSelected
                    ? "border-cyan-300/35 bg-cyan-300/[0.075] shadow-[0_18px_55px_rgba(34,211,238,0.08)]"
                    : "border-white/8 bg-slate-950/35"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">
                      {project.project_code}
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-white">{project.project_name}</h4>
                    <p className="mt-1 text-xs text-slate-500">{statusLabel(project.status)}</p>
                  </div>
                  {isSelected ? (
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                      โครงการปัจจุบัน
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-slate-500">
                      ยังไม่เปิด switching
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Enabled modules
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {project.enabled_modules.length > 0 ? (
                      project.enabled_modules.map((module) => (
                        <span
                          key={module}
                          className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300"
                        >
                          {moduleLabels[module] || module}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-amber-100/70">ยังไม่มี module ที่เปิดใช้งาน</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-amber-300/14 bg-amber-300/[0.045] px-4 py-3 text-xs leading-5 text-amber-50/80">
        Project switching จะเปิดเมื่อ selected project_id ถูกตรวจสิทธิ์และส่งต่อถึงทุก module query แบบ end-to-end แล้วเท่านั้น
      </div>
    </section>
  );
}
