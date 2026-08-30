# Project Management SaaS Law of UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved Law of UX design direction to the existing SaaS UI so the app becomes a balanced operations hub with executive summary, stronger visual hierarchy, and better mobile field usability.

**Architecture:** Keep the current App Router structure and data flows intact, but refactor the presentation layer around shared visual tokens, role-aware shell patterns, and more intentional dashboard/module hierarchy. Do not mix this plan with pending schema or master-data work; stay inside layout, styling, copy, and low-risk interaction improvements.

**Tech Stack:** `Next.js` App Router, `TypeScript`, `Tailwind CSS`, server components, `Vitest`, `Playwright`

---

## Planned File Structure

- `src/app/globals.css` — global color tokens, typography baseline, and shared background atmosphere
- `src/app/(dashboard)/layout.tsx` — high-level shell spacing and mobile/desktop page framing
- `src/app/(dashboard)/page.tsx` — executive-first operations hub homepage
- `src/app/(dashboard)/projects/page.tsx` — project module landing hierarchy
- `src/app/(dashboard)/teams/page.tsx` — team module hierarchy
- `src/app/(dashboard)/field-reports/page.tsx` — field activity summary hierarchy
- `src/app/(dashboard)/field-reports/new/page.tsx` — field-first reporting page framing
- `src/app/(dashboard)/finance/page.tsx` — finance module hierarchy
- `src/app/(dashboard)/imports/page.tsx` — import review hierarchy
- `src/components/layout/app-sidebar.tsx` — role-aware navigation cards and shell tone
- `src/components/layout/top-bar.tsx` — protected workspace header hierarchy and actions
- `src/components/layout/role-badge.tsx` — role signal styling
- `src/components/dashboard/kpi-card.tsx` — KPI presentation hierarchy
- `src/components/dashboard/progress-overview.tsx` — grouped progress section
- `src/components/dashboard/finance-overview.tsx` — grouped finance section
- `src/components/dashboard/project-health-table.tsx` — readable data-dense table styling
- `src/components/dashboard/risk-alert-list.tsx` — alert severity presentation
- `src/components/field-reports/field-report-form.tsx` — sectioned mobile-first report form
- `src/components/field-reports/material-line-items.tsx` — cleaner item capture block
- `src/components/field-reports/equipment-line-items.tsx` — cleaner equipment capture block
- `src/components/field-reports/photo-uploader.tsx` — field reporting upload block styling
- `src/components/projects/project-table.tsx` — operations-friendly data table hierarchy
- `src/components/finance/finance-summary-table.tsx` — dense but readable finance presentation
- `src/components/imports/import-review-table.tsx` — review queue styling and state clarity
- `tests/unit/app-shell.test.tsx` — global shell and background assertions
- `tests/unit/top-bar.test.tsx` — shell hierarchy regression assertions
- `tests/e2e/executive-dashboard.spec.ts` — dashboard visual hierarchy smoke coverage
- `tests/e2e/field-report-flow.spec.ts` — field-first flow regression coverage
- `README.md` — updated UX verification notes if needed

## Delivery Notes

- Preserve current routes, data queries, and permissions. This is a UX/UI pass, not a workflow rewrite.
- Follow the approved direction exactly: Balanced role support, Industrial Control + Modern Utility tone, Navy + Cyan palette, operations hub homepage.
- Apply Law of UX decisions consistently, especially Hick's Law, Fitts's Law, Miller's Law, and Peak-End Rule.
- Avoid introducing new dependencies unless the current codebase absolutely cannot express the design without them.
- Do not touch unfinished Prisma schema/master-data work in `prisma/schema.prisma`.

### Task 1: Establish the Global Visual Foundation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/(dashboard)/layout.tsx`
- Test: `tests/unit/app-shell.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/app-shell.test.tsx
import { render, screen } from "@testing-library/react";
import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders the product shell and keeps the command-center title visible", () => {
    render(
      <RootLayout>
        <div>child page</div>
      </RootLayout>,
    );

    expect(screen.getByText("Project Command Center")).toBeInTheDocument();
    expect(screen.getByText("child page")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/app-shell.test.tsx`
Expected: PASS today for title presence, but this step sets the baseline before visual foundation edits.

- [ ] **Step 3: Write minimal implementation**

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
  --bg-top: #06121f;
  --bg-bottom: #0f172a;
  --panel: rgba(10, 22, 38, 0.82);
  --panel-soft: rgba(15, 23, 42, 0.72);
  --panel-border: rgba(103, 232, 249, 0.14);
  --text-main: #e2f3ff;
  --text-soft: #9fb4c8;
  --accent: #67e8f9;
  --accent-strong: #22d3ee;
  --warn: #fbbf24;
  --danger: #f87171;
  --success: #34d399;
}

html {
  min-height: 100%;
  background:
    radial-gradient(circle at top left, rgba(34, 211, 238, 0.18), transparent 30%),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.14), transparent 28%),
    linear-gradient(180deg, var(--bg-top) 0%, var(--bg-bottom) 100%);
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: "Segoe UI", "Tahoma", sans-serif;
  color: var(--text-main);
}

* {
  box-sizing: border-box;
}
```

```tsx
// src/app/(dashboard)/layout.tsx
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { requireSession } from "@/lib/auth";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await requireSession();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-5 px-4 py-4 lg:flex-row lg:px-6 lg:py-6">
      <AppSidebar session={session} />
      <div className="flex-1 space-y-5">
        <TopBar session={session} />
        <main className="rounded-[2rem] border border-[var(--panel-border)] bg-[var(--panel)] p-5 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/app-shell.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/(dashboard)/layout.tsx tests/unit/app-shell.test.tsx
git commit -m "feat: add law-of-ux visual foundation"
```

### Task 2: Rebuild the Role-Aware Shell Around Hick's Law and Fitts's Law

**Files:**
- Modify: `src/components/layout/app-sidebar.tsx`
- Modify: `src/components/layout/top-bar.tsx`
- Modify: `src/components/layout/role-badge.tsx`
- Test: `tests/unit/top-bar.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/top-bar.test.tsx
import { render, screen } from "@testing-library/react";
import { TopBar } from "@/components/layout/top-bar";

describe("TopBar", () => {
  it("shows the signed-in email and switch-role link", () => {
    render(
      <TopBar
        session={{
          user: {
            email: "admin@example.com",
            name: "admin",
            role: "ADMIN",
          },
        }}
      />,
    );

    expect(screen.getByText("Signed in as")).toBeInTheDocument();
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Switch role" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/top-bar.test.tsx`
Expected: PASS today for the baseline, then use it as regression protection while reshaping hierarchy.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/layout/app-sidebar.tsx
import Link from "next/link";
import { RoleBadge } from "@/components/layout/role-badge";
import type { AppSession } from "@/lib/auth";
import { getNavigationForRole } from "@/lib/permissions";

type AppSidebarProps = {
  session: AppSession;
};

export function AppSidebar({ session }: AppSidebarProps) {
  const navItems = getNavigationForRole(session.user.role);

  return (
    <aside className="w-full rounded-[2rem] border border-[var(--panel-border)] bg-[var(--panel-soft)] p-5 shadow-[0_20px_60px_rgba(2,6,23,0.3)] backdrop-blur lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-80 lg:flex-none">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">
            Operations hub
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Control shell
          </h2>
          <p className="max-w-xs text-sm leading-6 text-slate-300">
            Open only the modules that matter for your role and move from
            summary into action quickly.
          </p>
        </div>
        <RoleBadge role={session.user.role} />
      </div>

      <nav className="mt-8 space-y-3" aria-label="Dashboard navigation">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-3xl border border-white/6 bg-white/[0.04] px-4 py-4 transition hover:border-cyan-300/40 hover:bg-cyan-400/[0.08]"
          >
            <span className="block text-sm font-semibold text-white">
              {item.label}
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-300">
              {item.description}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

```tsx
// src/components/layout/top-bar.tsx
import Link from "next/link";
import { getSwitchRoleHref, signOut, type AppSession } from "@/lib/auth";

type TopBarProps = {
  session: AppSession;
};

export function TopBar({ session }: TopBarProps) {
  return (
    <header className="flex flex-col gap-4 rounded-[2rem] border border-[var(--panel-border)] bg-[var(--panel-soft)] px-5 py-4 shadow-[0_20px_60px_rgba(2,6,23,0.24)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">
          Protected workspace
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Project operations dashboard
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-right">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
            Signed in as
          </p>
          <p className="text-sm font-medium text-white">{session.user.email}</p>
        </div>
        <Link
          href={getSwitchRoleHref()}
          prefetch={false}
          className="rounded-full border border-cyan-300/20 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/10"
        >
          Switch role
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
```

```tsx
// src/components/layout/role-badge.tsx
import type { AppRole } from "@/lib/permissions";

const roleStyles: Record<AppRole, string> = {
  EXECUTIVE: "border-cyan-300/30 bg-cyan-400/10 text-cyan-100",
  ADMIN: "border-sky-300/30 bg-sky-400/10 text-sky-100",
  FIELD_LEADER: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
};

export function RoleBadge({ role }: { role: AppRole }) {
  return (
    <div className={`inline-flex rounded-full border px-3 py-2 text-xs font-semibold tracking-[0.24em] ${roleStyles[role]}`}>
      {role.replace("_", " ")}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/top-bar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/app-sidebar.tsx src/components/layout/top-bar.tsx src/components/layout/role-badge.tsx tests/unit/top-bar.test.tsx
git commit -m "feat: refine role-aware shell ux"
```

### Task 3: Turn the Homepage Into an Operations Hub With Executive Summary

**Files:**
- Modify: `src/app/(dashboard)/page.tsx`
- Modify: `src/components/dashboard/kpi-card.tsx`
- Modify: `src/components/dashboard/progress-overview.tsx`
- Modify: `src/components/dashboard/finance-overview.tsx`
- Modify: `src/components/dashboard/project-health-table.tsx`
- Modify: `src/components/dashboard/risk-alert-list.tsx`
- Test: `tests/e2e/executive-dashboard.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/e2e/executive-dashboard.spec.ts
import { expect, test } from "@playwright/test";

test("executive can reach the dashboard and see summary widgets", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("executive@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByLabel("Role").selectOption("EXECUTIVE");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("heading", { name: "Executive portfolio dashboard" }),
  ).toBeVisible();
  await expect(page.getByText("Completion", { exact: true })).toBeVisible();
  await expect(page.getByText("Risk alerts")).toBeVisible();
  await expect(page.getByText("Project health")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:e2e`
Expected: PASS today for current structure, then act as smoke coverage while hierarchy is upgraded.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/app/(dashboard)/page.tsx
import { FinanceOverview } from "@/components/dashboard/finance-overview";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ProgressOverview } from "@/components/dashboard/progress-overview";
import { ProjectHealthTable } from "@/components/dashboard/project-health-table";
import { RiskAlertList } from "@/components/dashboard/risk-alert-list";
import { getDashboardAlerts } from "@/lib/dashboard/get-dashboard-alerts";
import { getDashboardSummary } from "@/lib/dashboard/get-dashboard-summary";

export default async function DashboardHomePage() {
  const [summary, alerts] = await Promise.all([
    getDashboardSummary(),
    getDashboardAlerts(),
  ]);

  return (
    <section className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_24rem]">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">
            Executive overview
          </p>
          <h2 className="text-4xl font-semibold tracking-tight text-white">
            Executive portfolio dashboard
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            Review progress, finance, billing exposure, and operational risk
            from one command surface, then move directly into the modules that
            need follow-through.
          </p>
        </div>
        <div className="rounded-[2rem] border border-cyan-300/12 bg-cyan-400/[0.06] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
            Today&apos;s focus
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-200">
            <p>Track project health, billing readiness, and risk signals before operational drift grows.</p>
            <p className="text-slate-300">Use the sections below to move from summary into action without losing context.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Projects"
          value={summary.progress.totalProjects.toLocaleString()}
          detail={`${summary.progress.totalAreas.toLocaleString()} areas and ${summary.progress.totalTeams.toLocaleString()} teams in scope`}
        />
        <KpiCard
          label="Completion"
          value={`${summary.progress.completionRate.toFixed(2)}%`}
          detail={`${summary.progress.completedUnits.toLocaleString()} of ${summary.progress.totalTargetUnits.toLocaleString()} target units`}
        />
        <KpiCard
          label="Billed"
          value={summary.finance.totalBilledValue.toLocaleString()}
          detail={`Against ${summary.finance.totalContractValue.toLocaleString()} in total contract value`}
        />
        <KpiCard
          label="Actual Cost"
          value={summary.finance.actualCostValue.toLocaleString()}
          detail={`Estimated costs currently ${summary.finance.estimatedCostValue.toLocaleString()}`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ProgressOverview progress={summary.progress} />
            <FinanceOverview finance={summary.finance} />
          </div>
          <ProjectHealthTable projects={summary.projectHealth} />
        </div>
        <RiskAlertList alerts={alerts} />
      </div>
    </section>
  );
}
```

```tsx
// src/components/dashboard/kpi-card.tsx
type KpiCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function KpiCard({ label, value, detail }: KpiCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-white/8 bg-white/[0.04] p-5 shadow-[0_18px_44px_rgba(2,6,23,0.22)]">
      <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
        {label}
      </p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{detail}</p>
    </article>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
- `pnpm test:e2e`
- `pnpm build`

Expected:
- executive dashboard e2e still passes
- build passes

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/page.tsx src/components/dashboard/kpi-card.tsx src/components/dashboard/progress-overview.tsx src/components/dashboard/finance-overview.tsx src/components/dashboard/project-health-table.tsx src/components/dashboard/risk-alert-list.tsx tests/e2e/executive-dashboard.spec.ts
git commit -m "feat: reshape dashboard into operations hub"
```

### Task 4: Apply Module-Level Hierarchy and Data-Dense Readability

**Files:**
- Modify: `src/app/(dashboard)/projects/page.tsx`
- Modify: `src/app/(dashboard)/teams/page.tsx`
- Modify: `src/app/(dashboard)/field-reports/page.tsx`
- Modify: `src/app/(dashboard)/finance/page.tsx`
- Modify: `src/app/(dashboard)/imports/page.tsx`
- Modify: `src/components/projects/project-table.tsx`
- Modify: `src/components/finance/finance-summary-table.tsx`
- Modify: `src/components/imports/import-review-table.tsx`
- Test: `tests/e2e/happy-path.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/e2e/happy-path.spec.ts
import { expect, test } from "@playwright/test";

test("admin happy path touches each MVP module", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByLabel("Role").selectOption("ADMIN");
  await page.getByRole("button", { name: "Sign in" }).click();

  const navigation = page.getByRole("navigation", { name: "Dashboard navigation" });

  await navigation.getByRole("link", { name: /Projects/ }).click();
  await expect(
    page.getByRole("heading", { name: "Project and area management" }),
  ).toBeVisible();

  await navigation.getByRole("link", { name: /Teams/ }).click();
  await expect(page.getByRole("heading", { name: "Team management" })).toBeVisible();

  await navigation.getByRole("link", { name: /Field Reports/ }).click();
  await expect(
    page.getByRole("heading", { name: "Daily field reporting" }),
  ).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:e2e`
Expected: PASS today for route coverage, then serve as regression coverage through visual hierarchy edits.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/app/(dashboard)/projects/page.tsx
import Link from "next/link";
import { ProjectTable } from "@/components/projects/project-table";
import { listProjects } from "@/server/queries/projects";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">
            Projects
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Project and area management
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            Review rollout structure, compare project readiness, and open the
            next setup action from one operational surface.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center justify-center rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
        >
          New project
        </Link>
      </div>

      <ProjectTable projects={projects} />
    </section>
  );
}
```

```tsx
// src/components/projects/project-table.tsx
// keep existing data mapping, but wrap with stronger headers and flatter table styling
<div className="overflow-hidden rounded-[1.75rem] border border-white/8 bg-slate-950/55">
  <div className="border-b border-white/6 px-5 py-4">
    <h3 className="text-lg font-semibold text-white">Portfolio setup</h3>
    <p className="text-sm text-slate-300">Compare scope, dates, and area readiness across projects.</p>
  </div>
  {/* existing table markup stays, but use clearer spacing and quieter metadata */}
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run:
- `pnpm test:e2e`
- `pnpm build`

Expected:
- module navigation e2e still passes
- build passes

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/projects/page.tsx src/app/(dashboard)/teams/page.tsx src/app/(dashboard)/field-reports/page.tsx src/app/(dashboard)/finance/page.tsx src/app/(dashboard)/imports/page.tsx src/components/projects/project-table.tsx src/components/finance/finance-summary-table.tsx src/components/imports/import-review-table.tsx tests/e2e/happy-path.spec.ts
git commit -m "feat: improve module hierarchy and data readability"
```

### Task 5: Make Field Reporting Mobile-First and Completion-Centered

**Files:**
- Modify: `src/app/(dashboard)/field-reports/new/page.tsx`
- Modify: `src/components/field-reports/field-report-form.tsx`
- Modify: `src/components/field-reports/material-line-items.tsx`
- Modify: `src/components/field-reports/equipment-line-items.tsx`
- Modify: `src/components/field-reports/photo-uploader.tsx`
- Test: `tests/e2e/field-report-flow.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/e2e/field-report-flow.spec.ts
import { expect, test } from "@playwright/test";

test("field leader can create a field report with material and equipment usage", async ({
  page,
}) => {
  await page.goto("/sign-in?redirectTo=/field-reports/new");
  await page.getByLabel("Email").fill("field@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByLabel("Role").selectOption("FIELD_LEADER");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("heading", { name: "Create a field report" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Save field report" })).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:e2e`
Expected: PASS today for workflow coverage, then stay green through the form redesign.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/app/(dashboard)/field-reports/new/page.tsx
import Link from "next/link";
import { FieldReportForm } from "@/components/field-reports/field-report-form";
import { createFieldReportFromForm } from "@/server/actions/field-reports";
import { getFieldReportFormProjects } from "@/server/queries/field-reports";

export default async function NewFieldReportPage() {
  const projects = await getFieldReportFormProjects();

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">
            Field reports
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Create a field report
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            Capture one complete shift update with progress, manpower, materials,
            equipment, and field issues from a mobile-friendly layout.
          </p>
        </div>
        <Link
          href="/field-reports"
          className="text-sm font-medium text-cyan-200 transition hover:text-white"
        >
          Back to field reports
        </Link>
      </div>

      <div className="rounded-[2rem] border border-white/8 bg-slate-950/55 p-4 sm:p-5 lg:p-6">
        <FieldReportForm action={createFieldReportFromForm} projects={projects} />
      </div>
    </section>
  );
}
```

```tsx
// src/components/field-reports/field-report-form.tsx
<form action={action} className="space-y-8">
  <section className="space-y-4 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-white">Core shift details</h3>
      <p className="text-sm text-slate-300">
        Start with project, team, date, and the core delivery counts for this shift.
      </p>
    </div>
    {/* existing project, area, team, reportDate, completedUnits, manpowerCount fields */}
  </section>

  <section className="space-y-4 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-white">Issues and blockers</h3>
      <p className="text-sm text-slate-300">
        Record only the field conditions that need follow-through or explain delivery risk.
      </p>
    </div>
    {/* existing textarea */}
  </section>

  <MaterialLineItems />
  <EquipmentLineItems />
  <PhotoUploader />

  <div className="sticky bottom-4 flex justify-end">
    <button
      type="submit"
      className="w-full rounded-full bg-cyan-300 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 sm:w-auto sm:min-w-52"
    >
      Save field report
    </button>
  </div>
</form>
```

- [ ] **Step 4: Run test to verify it passes**

Run:
- `pnpm test:e2e`
- `pnpm build`

Expected:
- field reporting flow still passes
- build passes

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/field-reports/new/page.tsx src/components/field-reports/field-report-form.tsx src/components/field-reports/material-line-items.tsx src/components/field-reports/equipment-line-items.tsx src/components/field-reports/photo-uploader.tsx tests/e2e/field-report-flow.spec.ts
git commit -m "feat: make field reporting mobile-first"
```

### Task 6: Finish UX Regression Coverage and Delivery Notes

**Files:**
- Modify: `README.md`
- Modify: `tests/e2e/executive-dashboard.spec.ts`
- Modify: `tests/e2e/happy-path.spec.ts`
- Modify: `tests/e2e/field-report-flow.spec.ts`

- [ ] **Step 1: Write the failing test**

```md
<!-- README.md -->
## UX verification

- Dashboard keeps KPI-first hierarchy
- Navigation stays role-aware
- Field reporting remains mobile-usable
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm build`
Expected: PASS today, but this step marks the final documentation and regression coverage task.

- [ ] **Step 3: Write minimal implementation**

```md
<!-- README.md -->
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
```

```ts
// tests/e2e/executive-dashboard.spec.ts
// keep the existing route and heading assertions, and add one expectation for
// the "Today's focus" support panel if implemented.
```

```ts
// tests/e2e/happy-path.spec.ts
// keep the existing route coverage and update selectors only if headings/copy
// changed during the UX pass.
```

```ts
// tests/e2e/field-report-flow.spec.ts
// keep the existing end-to-end path and update selectors only if section
// headings/copy changed during the UX pass.
```

- [ ] **Step 4: Run test to verify it passes**

Run:
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

Expected:
- unit and integration tests PASS
- e2e tests PASS
- build PASS

- [ ] **Step 5: Commit**

```bash
git add README.md tests/e2e/executive-dashboard.spec.ts tests/e2e/happy-path.spec.ts tests/e2e/field-report-flow.spec.ts
git commit -m "chore: finalize law-of-ux regression coverage"
```

## Spec Coverage Check

- Balanced role support: covered in Tasks 2-5 through role-aware shell and page hierarchy.
- Industrial Control + Modern Utility tone: covered in Tasks 1-4 through visual foundation, shell tone, and dashboard/module surfaces.
- Navy + Cyan palette: covered in Task 1 and reinforced in Tasks 2-5.
- Operations hub homepage: covered in Task 3.
- Law of UX application: Hick's Law, Fitts's Law, Miller's Law, and Peak-End Rule are implemented across Tasks 2-5.
- Field-first mobile reporting: covered in Task 5.
- Equipment UX direction remains intentionally narrow and compatible with future master-data implementation, but this plan does not touch unfinished schema work.

## Self-Review Notes

- No placeholders such as `TODO` or `TBD` remain for task intent, file paths, or commands.
- The plan stays inside presentation, copy, and regression coverage scope.
- Pending schema/master-data edits are explicitly excluded from this UX plan.
- Task boundaries map cleanly to existing code ownership: foundation, shell, dashboard, module pages, field reporting, and QA.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-21-project-management-saas-law-of-ux-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
