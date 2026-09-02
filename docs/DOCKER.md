# SiteCost Docker environment contract

Docker is used here to make local development and CI reproducible across Windows, macOS, Linux, and a fresh server. It is **not** the production database strategy and it does not replace Supabase or Vercel.

## What is fixed by the container contract

- Node.js runtime: Node 22 on Debian Bookworm Slim
- Package manager: pnpm 10.33.2
- Dependency install: `pnpm install --frozen-lockfile`
- Next.js build: standalone output
- Local SQLite path: `/app/data/sitecost.db`
- Persistent local data: Docker named volume `sitecost_data`
- Runtime process: non-root UID 1001
- Health endpoint: `GET /api/health`
- Linux CI gate: image build, DB initialization, container start, health verification

## First run

1. Copy `.env.docker.example` to `.env.docker`.
2. Fill local credentials in `.env.docker`. Never commit that file.
3. Start the stack:

```bash
docker compose --env-file .env.docker up --build
```

The stack performs two explicit stages:

1. `db-init` applies the local Prisma SQLite schema and seed data to the named volume.
2. `app` starts the production-like Next.js standalone server on port 3000.

Open `http://localhost:3000`.

Health check:

```bash
curl http://localhost:3000/api/health
```

## Stop / reset

Stop containers but keep local data:

```bash
docker compose down
```

Reset the local Docker database intentionally:

```bash
docker compose down -v
```

`-v` deletes the named volume. Use it only when a clean local dataset is intended.

## Important boundaries

- Do not place Supabase service-role keys in browser variables or committed env files.
- Keep `SITECOST_AUTH_PROVIDER=legacy` until Supabase Auth users, memberships, preview QA, and rollback gates are complete.
- Docker local SQLite is a development/test state store only. Production SaaS tenancy and authorization remain Supabase-backed.
- Vercel remains the intended deployment platform for the Next.js SaaS. Docker provides a portable runtime contract and Linux verification gate.
