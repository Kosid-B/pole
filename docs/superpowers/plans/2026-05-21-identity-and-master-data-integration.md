# Identity and Master Data Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock-style role sign-in with database-backed user authentication and wire normalized master data into teams, finance, and field-report workflows.

**Architecture:** Keep the existing Next.js App Router and Prisma foundation, but extend the schema with identity and master-data tables, migrate application writes toward relations, and preserve safe fallbacks where legacy free-text fields are still needed during transition. Execute in two internal phases: first stabilize schema, seed, and auth; then update forms, queries, summaries, and regression coverage.

**Tech Stack:** `Next.js` App Router, `TypeScript`, `Prisma`, `SQLite` for local dev, `PostgreSQL` production schema, `Vitest`, `Playwright`

---

## Planned File Structure

- `prisma/schema.prisma` — local SQLite source of truth for the new identity and master-data models
- `prisma/schema.postgres.prisma` — production PostgreSQL mirror of the same schema additions
- `prisma/migrations/20260521_identity_master_data/*` — production migration for the new tables and relations
- `prisma/seed.ts` — development seed with users, fixed master data, and updated sample domain data
- `prisma/seed.production.ts` — production-safe bootstrap users and master data only
- `src/lib/auth.ts` — database-backed sign-in, password verification, and session loading
- `src/lib/permissions.ts` — role constants remain, but usage must align with user-backed auth
- `src/lib/db.ts` — only if auth or query helpers need new exports
- `src/types/domain.ts` — typed summaries for team type, cost category, units, and optional equipment master references
- `src/app/(auth)/sign-in/page.tsx` — remove the normal role selector and reflect real-user auth
- `src/app/(dashboard)/teams/page.tsx` — teams page summary remains, but form/table consume team types
- `src/app/(dashboard)/finance/page.tsx` — finance page consumes normalized cost categories
- `src/app/(dashboard)/field-reports/page.tsx` — field report summaries continue working with normalized units
- `src/app/(dashboard)/field-reports/new/page.tsx` — field-report creation page stays intact while form changes underneath
- `src/components/layout/top-bar.tsx` — switch-role affordance must be removed or isolated if auth becomes real
- `src/components/teams/team-form.tsx` — add team type selection
- `src/components/teams/team-table.tsx` — display team type
- `src/components/finance/cost-entry-form.tsx` — select fixed cost category
- `src/components/finance/finance-summary-table.tsx` — show normalized category labels
- `src/components/field-reports/field-report-form.tsx` — feed normalized unit and equipment options into the report form
- `src/components/field-reports/material-line-items.tsx` — add unit selection from master data
- `src/components/field-reports/equipment-line-items.tsx` — support optional equipment master selection plus free-text fallback
- `src/server/queries/teams.ts` — join `TeamType`
- `src/server/queries/finance.ts` — join `CostCategory`
- `src/server/queries/field-reports.ts` — join `UnitOfMeasure` and optional `EquipmentMaster`
- `src/server/actions/teams.ts` — persist `teamTypeId`
- `src/server/actions/finance.ts` — persist `costCategoryId`
- `src/server/actions/field-reports.ts` — persist normalized units and optional equipment master references
- `src/lib/validations/finance.ts` — update cost-entry validation for category IDs
- `tests/unit/auth.test.ts` — database-backed auth success and failure cases
- `tests/unit/permissions.test.ts` — keep route access stable after auth changes
- `tests/integration/teams-actions.test.ts` — team type integration
- `tests/integration/finance-actions.test.ts` — cost category integration
- `tests/integration/field-reports-actions.test.ts` — normalized unit and equipment fallback integration
- `tests/integration/dashboard-summary.test.ts` — ensure summary queries still work with relations
- `tests/e2e/auth-shell.spec.ts` — sign in as real seeded users
- `tests/e2e/role-navigation.spec.ts` — role behavior without mock role switching
- `tests/e2e/field-report-flow.spec.ts` — field-report flow with normalized units and equipment fallback
- `tests/e2e/happy-path.spec.ts` — full admin path with real-user auth
- `README.md` — local/prod auth and master-data verification notes if needed

## Delivery Notes

- Do not mix this plan with unrelated UX/UI commits unless explicitly requested at execution time.
- Preserve local SQLite workflows and PostgreSQL production workflows together; both schema files must stay aligned.
- `CostCategory` and `TeamType` are fixed seed-driven master data in this round, not user-editable settings.
- `EquipmentMaster` must seed only `DRILL` and `GENSET`, but the field-report flow still supports free-text equipment names.
- Remove the mock-style role selector from normal sign-in behavior and update tests to use real seeded users instead.
- Preserve compatibility where needed during migration by keeping selected text fields until the app fully reads from normalized relations.

### Task 1: Add Identity and Master Data Schema

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/schema.postgres.prisma`
- Modify: `src/types/domain.ts`
- Test: `tests/integration/schema-smoke.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/schema-smoke.test.ts
import { createPrismaClient } from "@/lib/db";

const prisma = createPrismaClient();

describe("schema smoke", () => {
  it("supports users and seeded master-data relations", async () => {
    const userCount = await prisma.user.count();
    const teamTypeCount = await prisma.teamType.count();
    const costCategoryCount = await prisma.costCategory.count();
    const unitCount = await prisma.unitOfMeasure.count();
    const equipmentCount = await prisma.equipmentMaster.count();

    expect(userCount).toBeGreaterThanOrEqual(0);
    expect(teamTypeCount).toBeGreaterThanOrEqual(0);
    expect(costCategoryCount).toBeGreaterThanOrEqual(0);
    expect(unitCount).toBeGreaterThanOrEqual(0);
    expect(equipmentCount).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/integration/schema-smoke.test.ts`
Expected: FAIL because `user`, `teamType`, `costCategory`, or the new relations do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```prisma
// prisma/schema.prisma
model User {
  id           String   @id @default(cuid())
  fullName     String
  email        String   @unique
  passwordHash String
  role         UploadedByRole
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model TeamType {
  id        String   @id @default(cuid())
  code      String   @unique
  nameTh    String
  sortOrder Int      @default(0)
  isActive  Boolean  @default(true)
  teams     Team[]
}

model CostCategory {
  id        String      @id @default(cuid())
  code      String      @unique
  nameTh    String
  sortOrder Int         @default(0)
  isActive  Boolean     @default(true)
  entries   CostEntry[]
}

model Team {
  // existing fields...
  teamTypeId String?
  teamType   TeamType? @relation(fields: [teamTypeId], references: [id], onDelete: Restrict)
}

model CostEntry {
  // existing fields...
  costCategoryId String?
  costCategory   CostCategory? @relation(fields: [costCategoryId], references: [id], onDelete: Restrict)
}

model FieldReportMaterial {
  // existing fields...
  unitId String?
  unitRef UnitOfMeasure? @relation(fields: [unitId], references: [id], onDelete: Restrict)
}

model FieldReportEquipment {
  // existing fields...
  equipmentMasterId String?
  unitId            String?
  equipmentMaster   EquipmentMaster? @relation(fields: [equipmentMasterId], references: [id], onDelete: Restrict)
  unitRef           UnitOfMeasure?   @relation(fields: [unitId], references: [id], onDelete: Restrict)
}
```

```ts
// src/types/domain.ts
export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  role: UploadedByRole;
  isActive: boolean;
}

export interface TeamTypeSummary {
  id: string;
  code: string;
  nameTh: string;
}

export interface CostCategorySummary {
  id: string;
  code: string;
  nameTh: string;
}

export interface UnitOfMeasureSummary {
  id: string;
  code: string;
  nameTh: string;
  symbol: string;
}

export interface EquipmentMasterSummary {
  id: string;
  code: string;
  nameTh: string;
  defaultUnitId: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
- `pnpm db:generate`
- `pnpm test -- --run tests/integration/schema-smoke.test.ts`

Expected:
- Prisma client regenerates successfully
- schema smoke test passes or advances to the seed-dependent failure expected in Task 2

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/schema.postgres.prisma src/types/domain.ts tests/integration/schema-smoke.test.ts
git commit -m "feat: add identity and master data schema"
```

### Task 2: Add Migrations and Seeded Bootstrap Data

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `prisma/seed.production.ts`
- Create: `prisma/migrations/20260521_identity_master_data/migration.sql`
- Modify: `prisma/migrations/migration_lock.toml` only if Prisma updates it
- Test: `tests/integration/schema-smoke.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/schema-smoke.test.ts
it("seeds fixed users and master data", async () => {
  const admin = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });
  const teamTypes = await prisma.teamType.findMany({ orderBy: { sortOrder: "asc" } });
  const costCategories = await prisma.costCategory.findMany({ orderBy: { sortOrder: "asc" } });
  const equipment = await prisma.equipmentMaster.findMany({ orderBy: { code: "asc" } });

  expect(admin?.role).toBe("ADMIN");
  expect(teamTypes.map((item) => item.code)).toEqual([
    "INSTALL",
    "FOUNDATION",
    "INSPECTION",
    "TRANSPORT",
  ]);
  expect(costCategories.map((item) => item.code)).toEqual([
    "MAT",
    "LAB",
    "EQP",
    "TRN",
    "OTH",
  ]);
  expect(equipment.map((item) => item.code)).toEqual(["DRILL", "GENSET"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
- `pnpm db:push`
- `pnpm db:seed`
- `pnpm test -- --run tests/integration/schema-smoke.test.ts`

Expected: FAIL because the new seeded users and master-data records do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// prisma/seed.ts
import { hash } from "bcryptjs";
import { createPrismaClient } from "../src/lib/db";

const prisma = createPrismaClient();

const seededUsers = [
  { fullName: "Executive User", email: "executive@example.com", role: "EXECUTIVE" as const },
  { fullName: "Admin User", email: "admin@example.com", role: "ADMIN" as const },
  { fullName: "Field User", email: "field@example.com", role: "FIELD_LEADER" as const },
];

async function seedIdentityAndMasterData() {
  const passwordHash = await hash("password", 10);

  await prisma.user.createMany({
    data: seededUsers.map((user) => ({ ...user, passwordHash, isActive: true })),
  });

  await prisma.teamType.createMany({
    data: [
      { code: "INSTALL", nameTh: "ติดตั้ง", sortOrder: 1 },
      { code: "FOUNDATION", nameTh: "ฐานราก", sortOrder: 2 },
      { code: "INSPECTION", nameTh: "ตรวจรับ", sortOrder: 3 },
      { code: "TRANSPORT", nameTh: "ขนส่ง", sortOrder: 4 },
    ],
  });

  await prisma.costCategory.createMany({
    data: [
      { code: "MAT", nameTh: "วัสดุ", sortOrder: 1 },
      { code: "LAB", nameTh: "ค่าแรง", sortOrder: 2 },
      { code: "EQP", nameTh: "เครื่องจักร", sortOrder: 3 },
      { code: "TRN", nameTh: "ขนส่ง", sortOrder: 4 },
      { code: "OTH", nameTh: "อื่น ๆ", sortOrder: 5 },
    ],
  });
}
```

```ts
// prisma/seed.production.ts
await prisma.user.upsert({
  where: { email: "admin@example.com" },
  update: {},
  create: {
    fullName: "Admin User",
    email: "admin@example.com",
    passwordHash,
    role: "ADMIN",
    isActive: true,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run:
- `pnpm db:push`
- `pnpm db:seed`
- `pnpm test -- --run tests/integration/schema-smoke.test.ts`

Expected:
- local schema pushes
- seed runs successfully
- schema smoke test passes with seeded identity and master data

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts prisma/seed.production.ts prisma/migrations/20260521_identity_master_data
git commit -m "feat: seed identity and master data"
```

### Task 3: Replace Mock Role Sign-In with Database Auth

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/app/(auth)/sign-in/page.tsx`
- Modify: `src/components/layout/top-bar.tsx`
- Test: `tests/unit/auth.test.ts`
- Test: `tests/e2e/auth-shell.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/auth.test.ts
import { verifyPasswordForUser } from "@/lib/auth";

describe("database auth", () => {
  it("accepts a seeded user with the correct password", async () => {
    const user = await verifyPasswordForUser("admin@example.com", "password");

    expect(user?.role).toBe("ADMIN");
    expect(user?.email).toBe("admin@example.com");
  });

  it("rejects an inactive user", async () => {
    const user = await verifyPasswordForUser("inactive@example.com", "password");

    expect(user).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/auth.test.ts`
Expected: FAIL because auth still uses role cookies and no database-backed password verification exists.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/auth.ts
import { compare } from "bcryptjs";
import { createPrismaClient } from "@/lib/db";

const prisma = createPrismaClient();

export async function verifyPasswordForUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const matches = await compare(password, user.passwordHash);

  if (!matches) {
    return null;
  }

  return user;
}

export async function signInWithPassword(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const user = await verifyPasswordForUser(email, password);

  if (!user) {
    redirect("/sign-in?error=invalid-credentials");
  }

  const cookieStore = await cookies();
  cookieStore.set(ROLE_COOKIE_NAME, user.role, { httpOnly: true, sameSite: "lax", path: "/" });
  cookieStore.set(EMAIL_COOKIE_NAME, user.email, { httpOnly: true, sameSite: "lax", path: "/" });

  redirect(getSafeRedirectTarget(redirectTo, user.role));
}
```

```tsx
// src/app/(auth)/sign-in/page.tsx
import { signInWithPassword } from "@/lib/auth";

// remove the role selector block entirely
<form action={signInWithPassword} className="space-y-5">
  {/* keep email/password, keep redirectTo, add an inline error message when searchParams.error exists */}
</form>
```

- [ ] **Step 4: Run test to verify it passes**

Run:
- `pnpm test -- --run tests/unit/auth.test.ts`
- `pnpm test:e2e -- --grep "admin can sign in and reach the protected dashboard shell"`

Expected:
- unit auth tests pass
- auth-shell e2e passes with seeded users and no role selector dependency

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/app/(auth)/sign-in/page.tsx src/components/layout/top-bar.tsx tests/unit/auth.test.ts tests/e2e/auth-shell.spec.ts
git commit -m "feat: switch auth to database users"
```

### Task 4: Integrate Team Types and Cost Categories

**Files:**
- Modify: `src/server/queries/teams.ts`
- Modify: `src/server/actions/teams.ts`
- Modify: `src/components/teams/team-form.tsx`
- Modify: `src/components/teams/team-table.tsx`
- Modify: `src/server/queries/finance.ts`
- Modify: `src/server/actions/finance.ts`
- Modify: `src/components/finance/cost-entry-form.tsx`
- Modify: `src/components/finance/finance-summary-table.tsx`
- Modify: `src/lib/validations/finance.ts`
- Test: `tests/integration/teams-actions.test.ts`
- Test: `tests/integration/finance-actions.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/teams-actions.test.ts
expect(createdTeam.teamType?.code).toBe("INSTALL");

// tests/integration/finance-actions.test.ts
expect(createdCostEntry.costCategory?.code).toBe("MAT");
```

- [ ] **Step 2: Run test to verify it fails**

Run:
- `pnpm test -- --run tests/integration/teams-actions.test.ts`
- `pnpm test -- --run tests/integration/finance-actions.test.ts`

Expected: FAIL because actions and summaries still write and read free-text values only.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/server/actions/teams.ts
await prisma.team.create({
  data: {
    projectId,
    name,
    leaderName,
    crewSize,
    specialization,
    teamTypeId,
  },
});
```

```tsx
// src/components/teams/team-form.tsx
<select id="teamTypeId" name="teamTypeId" required>
  {teamTypes.map((teamType) => (
    <option key={teamType.id} value={teamType.id}>
      {teamType.nameTh}
    </option>
  ))}
</select>
```

```ts
// src/server/actions/finance.ts
await prisma.costEntry.create({
  data: {
    projectId,
    costCategoryId,
    category: selectedCategory.nameTh,
    description,
    amount,
    entryDate,
    valueType,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run:
- `pnpm test -- --run tests/integration/teams-actions.test.ts`
- `pnpm test -- --run tests/integration/finance-actions.test.ts`

Expected:
- team action tests pass with `TeamType`
- finance action tests pass with `CostCategory`

- [ ] **Step 5: Commit**

```bash
git add src/server/queries/teams.ts src/server/actions/teams.ts src/components/teams/team-form.tsx src/components/teams/team-table.tsx src/server/queries/finance.ts src/server/actions/finance.ts src/components/finance/cost-entry-form.tsx src/components/finance/finance-summary-table.tsx src/lib/validations/finance.ts tests/integration/teams-actions.test.ts tests/integration/finance-actions.test.ts
git commit -m "feat: normalize teams and finance master data"
```

### Task 5: Integrate Units and Optional Equipment Master into Field Reports

**Files:**
- Modify: `src/server/queries/field-reports.ts`
- Modify: `src/server/actions/field-reports.ts`
- Modify: `src/components/field-reports/field-report-form.tsx`
- Modify: `src/components/field-reports/material-line-items.tsx`
- Modify: `src/components/field-reports/equipment-line-items.tsx`
- Modify: `src/app/(dashboard)/field-reports/page.tsx`
- Test: `tests/integration/field-reports-actions.test.ts`
- Test: `tests/e2e/field-report-flow.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/field-reports-actions.test.ts
expect(report.materials[0].unitRef?.code).toBe("POLE");
expect(report.equipment[0].equipmentMaster?.code).toBe("DRILL");
expect(report.equipment[1].name).toBe("Custom lift");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/integration/field-reports-actions.test.ts`
Expected: FAIL because materials and equipment still use text-only unit fields.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/field-reports/material-line-items.tsx
<select id="materials.0.unitId" name="materials.0.unitId" required>
  {units.map((unit) => (
    <option key={unit.id} value={unit.id}>
      {unit.nameTh}
    </option>
  ))}
</select>
```

```tsx
// src/components/field-reports/equipment-line-items.tsx
<select id="equipment.0.equipmentMasterId" name="equipment.0.equipmentMasterId" defaultValue="">
  <option value="">Custom equipment entry</option>
  {equipmentOptions.map((equipment) => (
    <option key={equipment.id} value={equipment.id}>
      {equipment.nameTh}
    </option>
  ))}
</select>

<input id="equipment.0.name" name="equipment.0.name" placeholder="Custom lift" />
<select id="equipment.0.unitId" name="equipment.0.unitId" required>{/* units */}</select>
```

```ts
// src/server/actions/field-reports.ts
await prisma.fieldReport.create({
  data: {
    // existing header fields...
    materials: {
      create: materialRows.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unitLabel,
        unitId: item.unitId,
      })),
    },
    equipment: {
      create: equipmentRows.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unitLabel,
        unitId: item.unitId,
        equipmentMasterId: item.equipmentMasterId || null,
      })),
    },
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run:
- `pnpm test -- --run tests/integration/field-reports-actions.test.ts`
- `pnpm test:e2e -- --grep "field leader can create a field report with material and equipment usage"`

Expected:
- integration test passes with normalized units and optional equipment master
- field-report e2e passes with both structured and fallback input behavior

- [ ] **Step 5: Commit**

```bash
git add src/server/queries/field-reports.ts src/server/actions/field-reports.ts src/components/field-reports/field-report-form.tsx src/components/field-reports/material-line-items.tsx src/components/field-reports/equipment-line-items.tsx src/app/(dashboard)/field-reports/page.tsx tests/integration/field-reports-actions.test.ts tests/e2e/field-report-flow.spec.ts
git commit -m "feat: normalize field report units and equipment"
```

### Task 6: Update Dashboard, Summaries, and Cross-Module Queries

**Files:**
- Modify: `src/lib/dashboard/get-dashboard-summary.ts`
- Modify: `src/lib/dashboard/get-dashboard-alerts.ts` only if alert text depends on normalized fields
- Modify: `src/server/queries/projects.ts` if team/project summaries need type-aware fields
- Modify: `src/app/(dashboard)/finance/page.tsx`
- Modify: `src/app/(dashboard)/teams/page.tsx`
- Modify: `src/app/(dashboard)/field-reports/page.tsx`
- Modify: `src/app/(dashboard)/page.tsx` only if selectors or summary copy must change
- Test: `tests/integration/dashboard-summary.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/dashboard-summary.test.ts
expect(summary.projectHealth[0].latestIssue).toBeDefined();
expect(summary.finance.actualCostValue).toBeGreaterThanOrEqual(0);
expect(summary.progress.totalTeams).toBeGreaterThan(0);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/integration/dashboard-summary.test.ts`
Expected: FAIL if summary queries still rely on old shapes that break after normalization.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/server/queries/teams.ts
include: {
  project: true,
  teamType: true,
}

// src/server/queries/finance.ts
include: {
  project: true,
  costCategory: true,
}

// src/server/queries/field-reports.ts
include: {
  project: true,
  area: true,
  team: { include: { teamType: true } },
  materials: { include: { unitRef: true } },
  equipment: { include: { unitRef: true, equipmentMaster: true } },
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/integration/dashboard-summary.test.ts`
Expected: PASS with summary queries still intact after the new joins.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dashboard/get-dashboard-summary.ts src/lib/dashboard/get-dashboard-alerts.ts src/server/queries/projects.ts src/server/queries/teams.ts src/server/queries/finance.ts src/server/queries/field-reports.ts src/app/(dashboard)/finance/page.tsx src/app/(dashboard)/teams/page.tsx src/app/(dashboard)/field-reports/page.tsx src/app/(dashboard)/page.tsx tests/integration/dashboard-summary.test.ts
git commit -m "feat: align dashboard queries with normalized data"
```

### Task 7: Final Regression, Docs, and Production-Safe Verification

**Files:**
- Modify: `tests/e2e/auth-shell.spec.ts`
- Modify: `tests/e2e/role-navigation.spec.ts`
- Modify: `tests/e2e/happy-path.spec.ts`
- Modify: `README.md`

- [ ] **Step 1: Write the failing test**

```md
<!-- README.md -->
## Identity and master data verification

- Sign in uses database users
- Teams use team types
- Finance uses fixed cost categories
- Field reports use normalized units with equipment fallback
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:e2e`
Expected: One or more flows fail until all e2e selectors and sign-in expectations are updated for the new auth model.

- [ ] **Step 3: Write minimal implementation**

```ts
// tests/e2e/auth-shell.spec.ts
await page.getByLabel("Email").fill("admin@example.com");
await page.getByLabel("Password").fill("password");
await page.getByRole("button", { name: "Sign in" }).click();
```

```ts
// tests/e2e/role-navigation.spec.ts
// remove any dependence on the sign-in role selector and authenticate as
// executive@example.com or field@example.com directly.
```

```md
<!-- README.md -->
## Identity and master data verification

Before merge, verify:

1. `pnpm db:generate`
2. `pnpm db:push`
3. `pnpm db:seed`
4. `pnpm test`
5. `pnpm test:e2e`
6. `pnpm build`

Production bootstrap sequence:

1. set `DATABASE_URL`
2. run `pnpm db:deploy`
3. optionally run `pnpm db:seed:prod`
```

- [ ] **Step 4: Run test to verify it passes**

Run:
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

Expected:
- all unit and integration tests pass
- all e2e tests pass with real-user authentication
- production build passes

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/auth-shell.spec.ts tests/e2e/role-navigation.spec.ts tests/e2e/happy-path.spec.ts README.md
git commit -m "chore: finalize identity and master data regression coverage"
```

## Spec Coverage Check

- Real `User` records and hashed passwords: covered in Tasks 1-3.
- Fixed `CostCategory`, `TeamType`, `UnitOfMeasure`, and `EquipmentMaster`: covered in Tasks 1-2.
- Team, finance, and field-report integration: covered in Tasks 4-5.
- Query and summary alignment: covered in Task 6.
- Regression updates and production-safe verification: covered in Task 7.
- Progressive normalization and fallback preservation: reflected in Tasks 1, 4, and 5.

## Self-Review Notes

- No placeholder markers such as `TODO` or `TBD` remain in the plan body.
- Task boundaries match the two intended phases: schema/seed/auth first, then form/query/regression integration.
- The plan uses real file paths from the current codebase and keeps scope inside identity and master-data integration.
- The plan preserves fallback text behavior where the spec required safe transition behavior.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-21-identity-and-master-data-integration.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
