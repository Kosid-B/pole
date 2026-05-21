import { TeamForm } from "@/components/teams/team-form";
import { TeamTable } from "@/components/teams/team-table";
import { createTeamFromForm } from "@/server/actions/teams";
import { getProjectSummaries } from "@/server/queries/projects";
import { listTeams } from "@/server/queries/teams";

export default async function TeamsPage() {
  const [projects, teams] = await Promise.all([
    getProjectSummaries(),
    listTeams(),
  ]);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
          Teams
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Team management
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">
          Attach rollout crews to active projects so the operations dashboard can
          start organizing work by team.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <TeamTable teams={teams} />

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
          {projects.length > 0 ? (
            <TeamForm action={createTeamFromForm} projects={projects} />
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
