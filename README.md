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

## Database workflows

### Local development

1. `pnpm db:generate`
2. `pnpm db:push`
3. `pnpm db:seed`

This flow keeps the local Windows-friendly SQLite setup.

### Production

1. Set `DATABASE_URL` to the production PostgreSQL connection string.
2. Run `pnpm db:generate`
3. Run `pnpm db:deploy`
4. Optionally run `pnpm db:seed:prod` only when you are ready to bootstrap
   live data intentionally.

Production uses `prisma/schema.postgres.prisma` plus checked-in migrations under
`prisma/migrations/`. Do not use `pnpm db:push` against production.

## Verification

The strongest routine checks supported by the current baseline are:

1. `pnpm test`
2. `pnpm build`
3. `pnpm db:push`
4. `pnpm db:seed`
5. `pnpm test:e2e`

Current e2e status:

- `tests/e2e/auth-shell.spec.ts` covers protected shell access
- `tests/e2e/role-navigation.spec.ts` covers role-based navigation expectations
- `tests/e2e/happy-path.spec.ts` defines the admin MVP journey target
- `tests/e2e/executive-dashboard.spec.ts` defines executive dashboard coverage

Before the first local e2e run, install the browser once with:

1. `pnpm playwright:install`

Then run:

1. `pnpm test:e2e`

## Identity and master data verification

Before merge, confirm the normalized data flow end-to-end:

1. Sign in with seeded database users such as `admin@example.com` or
   `field@example.com`
2. Create teams with fixed team types instead of free-text role labels
3. Create finance entries with fixed cost categories
4. Create field reports with normalized unit selections and optional equipment
   suggestions
5. Verify dashboard summaries still reflect progress, finance, and latest issues

Recommended command sequence:

1. `pnpm db:generate`
2. `pnpm db:push`
3. `pnpm db:seed`
4. `pnpm test`
5. `pnpm test:e2e`
6. `pnpm build`

## UX verification

Before merge, verify the following:

1. `pnpm test`
2. `pnpm test:e2e`
3. `pnpm build`

Manual review points:

- the dashboard reads as summary first, action second
- module pages keep short, role-appropriate choices
- field reporting is comfortable on mobile without precision tapping
- warnings and critical states use both text and color

## Notes

- The app uses a shared SQLite setup tailored for this Windows workspace.
- Unrelated root content under `Installation/` and the Thai PDF are intentionally
  left untouched.
