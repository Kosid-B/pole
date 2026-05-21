import { TeamForm } from "@/components/teams/team-form";
import { TeamTable } from "@/components/teams/team-table";
import { createTeamFromForm } from "@/server/actions/teams";
import { getProjectSummaries } from "@/server/queries/projects";
import { listTeams, listTeamTypes } from "@/server/queries/teams";

export default async function TeamsPage() {
  const [projects, teams, teamTypes] = await Promise.all([
    getProjectSummaries(),
    listTeams(),
    listTeamTypes(),
  ]);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.34em] text-cyan-200/70">
          Teams
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Team management
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-300">
          Keep the active crews visible first, then register the next team without
          losing track of project assignment coverage.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Teams</p>
          <p className="mt-2 text-2xl font-semibold text-white">{teams.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Project lanes</p>
          <p className="mt-2 text-2xl font-semibold text-white">{projects.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-cyan-300/18 bg-cyan-300/[0.06] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/80">Control note</p>
          <p className="mt-2 text-sm leading-6 text-cyan-50/90">
            Add crews only after confirming the project lane they should support.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <TeamTable teams={teams} />

        <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/45 p-6">
          {projects.length > 0 ? (
            <TeamForm
              action={createTeamFromForm}
              projects={projects}
              teamTypes={teamTypes}
            />
          ) : (
            <div className="space-y-3 text-sm text-slate-300">
              <h3 className="text-lg font-semibold text-white">
                Create a project first
              </h3>
              <p>
                Teams need a project assignment. Add a project in the projects
                module, then come back to register the first crew.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
