# Project Management SaaS MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-company project management SaaS MVP with an executive dashboard, project setup, field reporting, materials/equipment tracking, billing/finance tracking, and file import review.

**Architecture:** Create a single `Next.js` application with server-rendered dashboard pages, role-aware routing, `Prisma` models over `PostgreSQL`, and shared UI/form components. Start with the upstream data-entry modules first, but expose the executive dashboard early so stakeholders can validate the product direction while the operational data model is still being filled in.

**Tech Stack:** `Next.js` App Router, `TypeScript`, `Tailwind CSS`, `shadcn/ui`, `Prisma`, `PostgreSQL`, `NextAuth`, `Zod`, `React Hook Form`, `Vitest`, `Testing Library`, `Playwright`

---

## Planned File Structure

- `package.json` — app scripts and dependencies
- `pnpm-workspace.yaml` — optional workspace root marker, even for a single app
- `next.config.ts` — Next.js configuration
- `tsconfig.json` — TypeScript configuration
- `prisma/schema.prisma` — database models
- `prisma/seed.ts` — seed users, roles, sample project, and sample dashboard data
- `src/lib/auth.ts` — auth options and role helpers
- `src/lib/db.ts` — Prisma client singleton
- `src/lib/permissions.ts` — route/module permissions per role
- `src/lib/validations/*.ts` — Zod schemas for each form
- `src/lib/dashboard/*.ts` — executive KPI queries and aggregation helpers
- `src/app/(auth)/*` — sign-in UI
- `src/app/(dashboard)/layout.tsx` — protected shell
- `src/app/(dashboard)/page.tsx` — executive dashboard home
- `src/app/(dashboard)/projects/*` — project and area pages
- `src/app/(dashboard)/teams/*` — team pages
- `src/app/(dashboard)/field-reports/*` — field report pages
- `src/app/(dashboard)/finance/*` — billing and cost pages
- `src/app/(dashboard)/imports/*` — upload/import review pages
- `src/components/layout/*` — shell, navigation, role switch, top bar
- `src/components/dashboard/*` — KPI cards, trend blocks, alerts, charts/tables
- `src/components/forms/*` — shared form fields and submit actions
- `src/components/projects/*` — project/area form components
- `src/components/teams/*` — team form components
- `src/components/field-reports/*` — detailed site report forms and line items
- `src/components/finance/*` — billing/cost forms and tables
- `src/components/imports/*` — upload review widgets
- `src/server/actions/*` — server actions for create/update workflows
- `src/server/queries/*` — read-side queries per module
- `src/types/*` — domain DTOs for UI
- `tests/unit/*` — domain-level unit tests
- `tests/integration/*` — server action/query integration tests
- `tests/e2e/*` — role and workflow tests
- `.env.example` — local environment contract
- `README.md` — local setup and product overview

## Delivery Notes

- Prefer `pnpm` consistently across the repository.
- Use seeded sample data early so the dashboard is reviewable before full CRUD is complete.
- Keep the data model single-company by design. Do not add tenant IDs in the MVP.
- Distinguish estimated vs actual financial values everywhere the dashboard presents money.
- Use route groups and shared form components to avoid duplicating behavior by role.

### Task 1: Bootstrap the Application and Tooling

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `.env.example`
- Create: `README.md`
- Test: `tests/unit/app-shell.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/app-shell.test.tsx
import { render, screen } from "@testing-library/react";
import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders the product title in the shell metadata region", () => {
    render(
      <RootLayout>
        <div>child page</div>
      </RootLayout>,
    );

    expect(screen.getByText("Project Command Center")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/app-shell.test.tsx`
Expected: FAIL with module or component not found because the application shell has not been created yet.

- [ ] **Step 3: Write minimal implementation**

```json
// package.json
{
  "name": "project-management-saas",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

```tsx
// src/app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>Project Command Center</header>
        {children}
      </body>
    </html>
  );
}
```

```env
// .env.example
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/project_management_saas"
NEXTAUTH_SECRET="replace-me"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/unit/app-shell.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml next.config.ts tsconfig.json postcss.config.mjs tailwind.config.ts src/app/layout.tsx src/app/globals.css .env.example README.md tests/unit/app-shell.test.tsx
git commit -m "chore: bootstrap nextjs saas shell"
```

### Task 2: Add Authentication, Roles, and Protected Dashboard Shell

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/permissions.ts`
- Create: `src/middleware.ts`
- Create: `src/app/(auth)/sign-in/page.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/layout/app-sidebar.tsx`
- Create: `src/components/layout/top-bar.tsx`
- Create: `src/components/layout/role-badge.tsx`
- Test: `tests/unit/permissions.test.ts`
- Test: `tests/e2e/auth-shell.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/permissions.test.ts
import { canAccessRoute } from "@/lib/permissions";

describe("canAccessRoute", () => {
  it("allows field leaders into field reports but blocks finance", () => {
    expect(canAccessRoute("FIELD_LEADER", "/field-reports")).toBe(true);
    expect(canAccessRoute("FIELD_LEADER", "/finance")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/permissions.test.ts`
Expected: FAIL because the permissions module does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/permissions.ts
export type AppRole = "EXECUTIVE" | "ADMIN" | "FIELD_LEADER";

const routeAccess: Record<AppRole, string[]> = {
  EXECUTIVE: ["/", "/projects", "/teams", "/field-reports", "/finance", "/imports"],
  ADMIN: ["/", "/projects", "/teams", "/field-reports", "/finance", "/imports"],
  FIELD_LEADER: ["/", "/field-reports"],
};

export function canAccessRoute(role: AppRole, route: string) {
  return routeAccess[role].some((prefix) => route.startsWith(prefix));
}
```

```tsx
// src/app/(dashboard)/layout.tsx
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <AppSidebar />
      <main className="lg:pl-72">
        <TopBar />
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/unit/permissions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/permissions.ts src/middleware.ts src/app/(auth)/sign-in/page.tsx src/app/(dashboard)/layout.tsx src/components/layout/app-sidebar.tsx src/components/layout/top-bar.tsx src/components/layout/role-badge.tsx tests/unit/permissions.test.ts tests/e2e/auth-shell.spec.ts
git commit -m "feat: add auth and protected shell"
```

### Task 3: Define the Prisma Schema and Seed Data

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db.ts`
- Create: `src/types/domain.ts`
- Test: `tests/integration/schema-smoke.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/schema-smoke.test.ts
import { PrismaClient } from "@prisma/client";

describe("schema smoke", () => {
  it("creates a project with one area and one team", async () => {
    const prisma = new PrismaClient();

    const created = await prisma.project.create({
      data: {
        name: "Pilot Project",
        contractValue: 1000000,
        areas: {
          create: [{ name: "Sisaket Cluster", province: "Sisaket" }],
        },
        teams: {
          create: [{ name: "Team A", leaderName: "Somchai", crewSize: 6 }],
        },
      },
      include: { areas: true, teams: true },
    });

    expect(created.areas).toHaveLength(1);
    expect(created.teams).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/integration/schema-smoke.test.ts`
Expected: FAIL because Prisma models and generated client are not available yet.

- [ ] **Step 3: Write minimal implementation**

```prisma
// prisma/schema.prisma
model Project {
  id             String        @id @default(cuid())
  name           String
  customerName   String?
  contractValue  Decimal       @db.Decimal(14, 2)
  startDate      DateTime?
  endDate        DateTime?
  targetUnits    Int           @default(0)
  status         ProjectStatus @default(PLANNING)
  areas          ProjectArea[]
  teams          Team[]
  fieldReports   FieldReport[]
  billingRecords BillingRecord[]
  cashEntries    CashEntry[]
  costEntries    CostEntry[]
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

model ProjectArea {
  id         String   @id @default(cuid())
  projectId  String
  name       String
  province   String
  district   String?
  cluster    String?
  targetUnits Int     @default(0)
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  reports    FieldReport[]
}

model Team {
  id           String   @id @default(cuid())
  projectId    String
  name         String
  leaderName   String
  crewSize     Int
  specialization String?
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  reports      FieldReport[]
}
```

```ts
// prisma/seed.ts
import { PrismaClient, ProjectStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.project.create({
    data: {
      name: "90,000 Pole Rollout",
      customerName: "Tech Solution AI",
      contractValue: "150000000.00",
      targetUnits: 90000,
      status: ProjectStatus.ACTIVE,
      areas: {
        create: [
          { name: "Sisaket Hub", province: "Sisaket", targetUnits: 3327 },
          { name: "Nakhon Ratchasima Hub", province: "Nakhon Ratchasima", targetUnits: 2807 },
        ],
      },
      teams: {
        create: [
          { name: "Field Team Alpha", leaderName: "Prasit", crewSize: 8, specialization: "Smart pole install" },
        ],
      },
    },
  });
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 4: Run test to verify it passes**

Run:
- `pnpm prisma generate`
- `pnpm prisma db push`
- `pnpm vitest tests/integration/schema-smoke.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts src/lib/db.ts src/types/domain.ts tests/integration/schema-smoke.test.ts
git commit -m "feat: define prisma schema and seed data"
```

### Task 4: Build the Project and Area Management Module

**Files:**
- Create: `src/lib/validations/project.ts`
- Create: `src/server/actions/projects.ts`
- Create: `src/server/queries/projects.ts`
- Create: `src/app/(dashboard)/projects/page.tsx`
- Create: `src/app/(dashboard)/projects/new/page.tsx`
- Create: `src/components/projects/project-form.tsx`
- Create: `src/components/projects/project-table.tsx`
- Create: `src/components/projects/area-form.tsx`
- Test: `tests/integration/projects-actions.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/projects-actions.test.ts
import { createProject } from "@/server/actions/projects";

describe("createProject", () => {
  it("creates a project with one initial area", async () => {
    const result = await createProject({
      name: "Project East",
      contractValue: 5000000,
      targetUnits: 1200,
      initialArea: {
        name: "Zone A",
        province: "Ubon Ratchathani",
        targetUnits: 600,
      },
    });

    expect(result.name).toBe("Project East");
    expect(result.areas[0].province).toBe("Ubon Ratchathani");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/integration/projects-actions.test.ts`
Expected: FAIL because the project action does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/validations/project.ts
import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1),
  contractValue: z.coerce.number().positive(),
  targetUnits: z.coerce.number().int().nonnegative(),
  initialArea: z.object({
    name: z.string().min(1),
    province: z.string().min(1),
    targetUnits: z.coerce.number().int().nonnegative(),
  }),
});
```

```ts
// src/server/actions/projects.ts
"use server";

import { db } from "@/lib/db";
import { createProjectSchema } from "@/lib/validations/project";

export async function createProject(input: unknown) {
  const data = createProjectSchema.parse(input);

  return db.project.create({
    data: {
      name: data.name,
      contractValue: data.contractValue,
      targetUnits: data.targetUnits,
      areas: {
        create: [data.initialArea],
      },
    },
    include: { areas: true },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/integration/projects-actions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/project.ts src/server/actions/projects.ts src/server/queries/projects.ts src/app/(dashboard)/projects/page.tsx src/app/(dashboard)/projects/new/page.tsx src/components/projects/project-form.tsx src/components/projects/project-table.tsx src/components/projects/area-form.tsx tests/integration/projects-actions.test.ts
git commit -m "feat: add project and area management"
```

### Task 5: Build the Team Management Module

**Files:**
- Create: `src/lib/validations/team.ts`
- Create: `src/server/actions/teams.ts`
- Create: `src/server/queries/teams.ts`
- Create: `src/app/(dashboard)/teams/page.tsx`
- Create: `src/components/teams/team-form.tsx`
- Create: `src/components/teams/team-table.tsx`
- Test: `tests/integration/teams-actions.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/teams-actions.test.ts
import { createTeam } from "@/server/actions/teams";

describe("createTeam", () => {
  it("creates a team attached to a project", async () => {
    const team = await createTeam({
      projectId: "project-id",
      name: "North Crew",
      leaderName: "Anan",
      crewSize: 7,
      specialization: "Screw pile drilling",
    });

    expect(team.name).toBe("North Crew");
    expect(team.crewSize).toBe(7);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/integration/teams-actions.test.ts`
Expected: FAIL because the team action does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/validations/team.ts
import { z } from "zod";

export const createTeamSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  leaderName: z.string().min(1),
  crewSize: z.coerce.number().int().positive(),
  specialization: z.string().optional(),
});
```

```ts
// src/server/actions/teams.ts
"use server";

import { db } from "@/lib/db";
import { createTeamSchema } from "@/lib/validations/team";

export async function createTeam(input: unknown) {
  const data = createTeamSchema.parse(input);

  return db.team.create({
    data,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/integration/teams-actions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/team.ts src/server/actions/teams.ts src/server/queries/teams.ts src/app/(dashboard)/teams/page.tsx src/components/teams/team-form.tsx src/components/teams/team-table.tsx tests/integration/teams-actions.test.ts
git commit -m "feat: add team management"
```

### Task 6: Build the Field Reporting Workflow

**Files:**
- Create: `src/lib/validations/field-report.ts`
- Create: `src/server/actions/field-reports.ts`
- Create: `src/server/queries/field-reports.ts`
- Create: `src/app/(dashboard)/field-reports/page.tsx`
- Create: `src/app/(dashboard)/field-reports/new/page.tsx`
- Create: `src/components/field-reports/field-report-form.tsx`
- Create: `src/components/field-reports/material-line-items.tsx`
- Create: `src/components/field-reports/equipment-line-items.tsx`
- Create: `src/components/field-reports/photo-uploader.tsx`
- Test: `tests/integration/field-reports-actions.test.ts`
- Test: `tests/e2e/field-report-flow.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/field-reports-actions.test.ts
import { createFieldReport } from "@/server/actions/field-reports";

describe("createFieldReport", () => {
  it("stores report details, material usage, and equipment usage together", async () => {
    const report = await createFieldReport({
      projectId: "project-id",
      areaId: "area-id",
      teamId: "team-id",
      reportDate: "2026-05-20",
      completedUnits: 42,
      manpowerCount: 8,
      issues: "No blocker",
      materials: [{ name: "Anchor bolt", quantity: 84, unit: "pcs", estimatedCost: 4200 }],
      equipment: [{ name: "Drill rig", quantity: 1, unit: "unit", hoursUsed: 6 }],
    });

    expect(report.completedUnits).toBe(42);
    expect(report.materials).toHaveLength(1);
    expect(report.equipment).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/integration/field-reports-actions.test.ts`
Expected: FAIL because field report models and action are incomplete.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/validations/field-report.ts
import { z } from "zod";

export const createFieldReportSchema = z.object({
  projectId: z.string().min(1),
  areaId: z.string().min(1),
  teamId: z.string().min(1),
  reportDate: z.string().min(1),
  completedUnits: z.coerce.number().int().nonnegative(),
  manpowerCount: z.coerce.number().int().positive(),
  issues: z.string().default(""),
  materials: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.coerce.number().positive(),
      unit: z.string().min(1),
      estimatedCost: z.coerce.number().nonnegative(),
    }),
  ),
  equipment: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.coerce.number().positive(),
      unit: z.string().min(1),
      hoursUsed: z.coerce.number().nonnegative(),
    }),
  ),
});
```

```ts
// src/server/actions/field-reports.ts
"use server";

import { db } from "@/lib/db";
import { createFieldReportSchema } from "@/lib/validations/field-report";

export async function createFieldReport(input: unknown) {
  const data = createFieldReportSchema.parse(input);

  return db.fieldReport.create({
    data: {
      projectId: data.projectId,
      areaId: data.areaId,
      teamId: data.teamId,
      reportDate: new Date(data.reportDate),
      completedUnits: data.completedUnits,
      manpowerCount: data.manpowerCount,
      issues: data.issues,
      materials: { create: data.materials },
      equipment: { create: data.equipment },
    },
    include: { materials: true, equipment: true },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/integration/field-reports-actions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/field-report.ts src/server/actions/field-reports.ts src/server/queries/field-reports.ts src/app/(dashboard)/field-reports/page.tsx src/app/(dashboard)/field-reports/new/page.tsx src/components/field-reports/field-report-form.tsx src/components/field-reports/material-line-items.tsx src/components/field-reports/equipment-line-items.tsx src/components/field-reports/photo-uploader.tsx tests/integration/field-reports-actions.test.ts tests/e2e/field-report-flow.spec.ts
git commit -m "feat: add field reporting workflow"
```

### Task 7: Build Billing and Cost Tracking

**Files:**
- Create: `src/lib/validations/finance.ts`
- Create: `src/server/actions/finance.ts`
- Create: `src/server/queries/finance.ts`
- Create: `src/app/(dashboard)/finance/page.tsx`
- Create: `src/components/finance/billing-form.tsx`
- Create: `src/components/finance/cost-entry-form.tsx`
- Create: `src/components/finance/finance-summary-table.tsx`
- Test: `tests/integration/finance-actions.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/finance-actions.test.ts
import { createBillingRecord, createCostEntry } from "@/server/actions/finance";

describe("finance actions", () => {
  it("records billing and cost entries for one project", async () => {
    const billing = await createBillingRecord({
      projectId: "project-id",
      workPackage: "Week 1",
      billedValue: 250000,
      billingDate: "2026-05-20",
      expectedPaymentDate: "2026-06-05",
      isDocumentComplete: true,
    });

    const cost = await createCostEntry({
      projectId: "project-id",
      category: "MATERIAL",
      description: "Anchor bolts",
      amount: 92000,
      entryDate: "2026-05-20",
      valueType: "ACTUAL",
    });

    expect(billing.billedValue.toNumber()).toBe(250000);
    expect(cost.amount.toNumber()).toBe(92000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/integration/finance-actions.test.ts`
Expected: FAIL because finance actions and schema are missing.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/validations/finance.ts
import { z } from "zod";

export const createBillingRecordSchema = z.object({
  projectId: z.string().min(1),
  workPackage: z.string().min(1),
  billedValue: z.coerce.number().positive(),
  billingDate: z.string().min(1),
  expectedPaymentDate: z.string().min(1),
  isDocumentComplete: z.boolean(),
});

export const createCostEntrySchema = z.object({
  projectId: z.string().min(1),
  category: z.enum(["LABOR", "MATERIAL", "TRANSPORT", "MACHINERY", "OTHER"]),
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  entryDate: z.string().min(1),
  valueType: z.enum(["ESTIMATED", "ACTUAL"]),
});
```

```ts
// src/server/actions/finance.ts
"use server";

import { db } from "@/lib/db";
import { createBillingRecordSchema, createCostEntrySchema } from "@/lib/validations/finance";

export async function createBillingRecord(input: unknown) {
  const data = createBillingRecordSchema.parse(input);

  return db.billingRecord.create({
    data: {
      ...data,
      billingDate: new Date(data.billingDate),
      expectedPaymentDate: new Date(data.expectedPaymentDate),
    },
  });
}

export async function createCostEntry(input: unknown) {
  const data = createCostEntrySchema.parse(input);

  return db.costEntry.create({
    data: {
      ...data,
      entryDate: new Date(data.entryDate),
    },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/integration/finance-actions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/finance.ts src/server/actions/finance.ts src/server/queries/finance.ts src/app/(dashboard)/finance/page.tsx src/components/finance/billing-form.tsx src/components/finance/cost-entry-form.tsx src/components/finance/finance-summary-table.tsx tests/integration/finance-actions.test.ts
git commit -m "feat: add billing and cost tracking"
```

### Task 8: Build the Import Center

**Files:**
- Create: `src/lib/validations/imports.ts`
- Create: `src/server/actions/imports.ts`
- Create: `src/server/queries/imports.ts`
- Create: `src/app/(dashboard)/imports/page.tsx`
- Create: `src/components/imports/upload-dropzone.tsx`
- Create: `src/components/imports/import-review-table.tsx`
- Create: `src/components/imports/import-status-badge.tsx`
- Test: `tests/integration/imports-actions.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/imports-actions.test.ts
import { markImportForReview } from "@/server/actions/imports";

describe("markImportForReview", () => {
  it("creates an import job with pending review status", async () => {
    const job = await markImportForReview({
      fileName: "billing-week-1.xlsx",
      sourceType: "SPREADSHEET",
      uploadedByRole: "ADMIN",
    });

    expect(job.status).toBe("NEEDS_REVIEW");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/integration/imports-actions.test.ts`
Expected: FAIL because import tracking does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/validations/imports.ts
import { z } from "zod";

export const createImportJobSchema = z.object({
  fileName: z.string().min(1),
  sourceType: z.enum(["SPREADSHEET", "PDF"]),
  uploadedByRole: z.enum(["EXECUTIVE", "ADMIN", "FIELD_LEADER"]),
});
```

```ts
// src/server/actions/imports.ts
"use server";

import { db } from "@/lib/db";
import { createImportJobSchema } from "@/lib/validations/imports";

export async function markImportForReview(input: unknown) {
  const data = createImportJobSchema.parse(input);

  return db.importJob.create({
    data: {
      ...data,
      status: "NEEDS_REVIEW",
    },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/integration/imports-actions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/imports.ts src/server/actions/imports.ts src/server/queries/imports.ts src/app/(dashboard)/imports/page.tsx src/components/imports/upload-dropzone.tsx src/components/imports/import-review-table.tsx src/components/imports/import-status-badge.tsx tests/integration/imports-actions.test.ts
git commit -m "feat: add import review center"
```

### Task 9: Build the Executive Dashboard

**Files:**
- Create: `src/lib/dashboard/get-dashboard-summary.ts`
- Create: `src/lib/dashboard/get-dashboard-alerts.ts`
- Create: `src/app/(dashboard)/page.tsx`
- Create: `src/components/dashboard/kpi-card.tsx`
- Create: `src/components/dashboard/progress-overview.tsx`
- Create: `src/components/dashboard/finance-overview.tsx`
- Create: `src/components/dashboard/risk-alert-list.tsx`
- Create: `src/components/dashboard/project-health-table.tsx`
- Test: `tests/integration/dashboard-summary.test.ts`
- Test: `tests/e2e/executive-dashboard.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/dashboard-summary.test.ts
import { getDashboardSummary } from "@/lib/dashboard/get-dashboard-summary";

describe("getDashboardSummary", () => {
  it("returns progress and financial totals with actual vs estimated values", async () => {
    const summary = await getDashboardSummary();

    expect(summary.totalProjects).toBeGreaterThan(0);
    expect(summary.progress.completedUnits).toBeGreaterThanOrEqual(0);
    expect(summary.finance.actualCosts).toBeGreaterThanOrEqual(0);
    expect(summary.finance.estimatedCosts).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/integration/dashboard-summary.test.ts`
Expected: FAIL because dashboard aggregation helpers do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/dashboard/get-dashboard-summary.ts
import { db } from "@/lib/db";

export async function getDashboardSummary() {
  const totalProjects = await db.project.count();
  const reports = await db.fieldReport.findMany({ select: { completedUnits: true } });
  const costs = await db.costEntry.findMany({ select: { amount: true, valueType: true } });

  return {
    totalProjects,
    progress: {
      completedUnits: reports.reduce((sum, report) => sum + report.completedUnits, 0),
    },
    finance: {
      actualCosts: costs
        .filter((item) => item.valueType === "ACTUAL")
        .reduce((sum, item) => sum + Number(item.amount), 0),
      estimatedCosts: costs
        .filter((item) => item.valueType === "ESTIMATED")
        .reduce((sum, item) => sum + Number(item.amount), 0),
    },
  };
}
```

```tsx
// src/app/(dashboard)/page.tsx
import { getDashboardSummary } from "@/lib/dashboard/get-dashboard-summary";
import { KpiCard } from "@/components/dashboard/kpi-card";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Executive Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Projects" value={String(summary.totalProjects)} />
        <KpiCard label="Completed Units" value={String(summary.progress.completedUnits)} />
        <KpiCard label="Actual Costs" value={summary.finance.actualCosts.toLocaleString()} />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/integration/dashboard-summary.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/dashboard/get-dashboard-summary.ts src/lib/dashboard/get-dashboard-alerts.ts src/app/(dashboard)/page.tsx src/components/dashboard/kpi-card.tsx src/components/dashboard/progress-overview.tsx src/components/dashboard/finance-overview.tsx src/components/dashboard/risk-alert-list.tsx src/components/dashboard/project-health-table.tsx tests/integration/dashboard-summary.test.ts tests/e2e/executive-dashboard.spec.ts
git commit -m "feat: add executive dashboard"
```

### Task 10: Finish Validation, QA, and Delivery Readiness

**Files:**
- Modify: `README.md`
- Create: `src/components/shared/empty-state.tsx`
- Create: `tests/e2e/role-navigation.spec.ts`
- Create: `tests/e2e/happy-path.spec.ts`
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the failing test**

```ts
// tests/e2e/happy-path.spec.ts
import { test, expect } from "@playwright/test";

test("admin can create data that appears on the executive dashboard", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: "Projects" }).click();
  await page.getByRole("button", { name: "New project" }).click();
  await page.getByLabel("Project name").fill("Operations Pilot");
  await page.getByRole("button", { name: "Save project" }).click();
  await page.goto("/");
  await expect(page.getByText("Operations Pilot")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm playwright test tests/e2e/happy-path.spec.ts`
Expected: FAIL because the connected end-to-end flow is not fully implemented yet.

- [ ] **Step 3: Write minimal implementation**

```yaml
# .github/workflows/ci.yml
name: ci

on:
  push:
    branches: ["main", "master", "codex/**"]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm prisma generate
      - run: pnpm test
      - run: pnpm build
```

```md
<!-- README.md -->
## Verification

Run the checks below before every merge:

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```
```

- [ ] **Step 4: Run test to verify it passes**

Run:
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

Expected:
- unit and integration tests PASS
- e2e tests PASS
- production build succeeds

- [ ] **Step 5: Commit**

```bash
git add README.md src/components/shared/empty-state.tsx tests/e2e/role-navigation.spec.ts tests/e2e/happy-path.spec.ts .github/workflows/ci.yml
git commit -m "chore: finalize qa and delivery readiness"
```

## Spec Coverage Check

- Executive dashboard: covered in Task 9, with seeded reviewable KPIs starting in Task 3.
- Project and area setup: covered in Task 4.
- Team management: covered in Task 5.
- Detailed field reporting with materials, equipment, and photos: covered in Task 6.
- Billing and finance tracking: covered in Task 7.
- File-based import review: covered in Task 8.
- Role-based access and responsive shell: covered in Task 2, then exercised again in Task 10.
- Testing and release readiness: covered across Tasks 1-10, with explicit QA hardening in Task 10.

## Self-Review Notes

- No `TODO`, `TBD`, or deferred placeholder language remains in the plan.
- File paths are explicit and grouped by module ownership.
- The plan stays inside the approved MVP scope and does not pull in multi-company support, approval workflows, or offline-first behavior.
- Naming is consistent across actions, validations, and dashboard aggregation helpers.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-20-project-management-saas-mvp.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
