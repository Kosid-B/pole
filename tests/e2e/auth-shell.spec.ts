import { expect, test } from "@playwright/test";
import { openAsSeededRole } from "./helpers/session";

test("admin can reach the protected dashboard shell", async ({ page }) => {
  // Credential verification, redirect contract and session cookie issuance are
  // covered by tests/integration/sign-in-route.test.ts. Browser E2E uses the
  // seeded session helper so business-shell coverage is not coupled to
  // framework redirect timing on Windows CI.
  await openAsSeededRole(page, "admin@example.com", "ADMIN", "/");

  await expect(
    page.getByRole("heading", { name: "SiteCost — งานลานตาก 446 จุด" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Dashboard navigation" }),
  ).toBeVisible();
  await expect(page.getByText("บัญชีโครงการ · ADMIN")).toBeVisible();
});

test("field leaders are redirected away from finance", async ({ page }) => {
  await openAsSeededRole(
    page,
    "field@example.com",
    "FIELD_LEADER",
    "/finance",
  );

  await expect(page).toHaveURL(/\/field-reports$/);
  await expect(
    page.getByRole("heading", {
      name: "Daily field reporting",
    }),
  ).toBeVisible();
});
