import type { TeamSummary } from "@/types/domain";

type TeamTableProps = {
  teams: TeamSummary[];
};

export function TeamTable({ teams }: TeamTableProps) {
  if (teams.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-300">
        No teams yet. Add the first crew to connect people planning to a
        project.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-200">
        <thead className="bg-slate-950/50 text-xs uppercase tracking-[0.2em] text-sky-200/70">
          <tr>
            <th className="px-4 py-3 font-medium">Team</th>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Leader</th>
            <th className="px-4 py-3 font-medium">Crew size</th>
            <th className="px-4 py-3 font-medium">Specialization</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {teams.map((team) => (
            <tr key={team.id} className="align-top">
              <td className="px-4 py-4 font-medium text-white">{team.name}</td>
              <td className="px-4 py-4">{team.projectName}</td>
              <td className="px-4 py-4">{team.leaderName}</td>
              <td className="px-4 py-4">{team.crewSize}</td>
              <td className="px-4 py-4">
                {team.specialization ?? (
                  <span className="text-slate-400">Not set</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
