# Project Command Center

This repository contains the MVP command center for project rollout operations.
The current baseline includes:

- Role-aware dashboard shell
- Project and area setup
- Team management
- Field reporting
- Finance tracking
- Import review queue
- Executive dashboard summary

## Getting started

1. Install dependencies with `pnpm install`.
2. Generate the Prisma client with `pnpm db:generate`.
3. Push the SQLite schema with `pnpm db:push`.
4. Seed the sample data with `pnpm db:seed`.
5. Start the app with `pnpm dev`.

## Verification

The strongest routine checks supported by the current baseline are:

1. `pnpm test`
2. `pnpm build`
3. `pnpm db:push`
4. `pnpm db:seed`

Current e2e status:

- `tests/e2e/auth-shell.spec.ts` covers protected shell access
- `tests/e2e/role-navigation.spec.ts` covers role-based navigation expectations
- `tests/e2e/happy-path.spec.ts` defines the admin MVP journey target
- `tests/e2e/executive-dashboard.spec.ts` defines executive dashboard coverage

These e2e specs are scaffolded for delivery readiness, but the current baseline
does not yet include Playwright installation/configuration, so they are not part
of the runnable verification path yet.

## Notes

- The app uses a shared SQLite setup tailored for this Windows workspace.
- Unrelated root content under `Installation/` and the Thai PDF are intentionally
  left untouched.
