import { expect, test } from "@playwright/test";
import { openAsSeededRole } from "./helpers/session";

test("executive sees cross-functional navigation", async ({ page }) => {
  await openAsSeededRole(
    page,
    "executive@example.com",
    "EXECUTIVE",
    "/",
  );

  await expect(
    page.getByRole("navigation", { name: "Dashboard navigation" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Projects/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Commercial \/ Pricing/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /PM Control/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Award Approval/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Procurement/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Teams/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Field Reports/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Finance/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Imports/i })).toBeVisible();
});

test("field leader only keeps field reporting access", async ({ page }) => {
  await openAsSeededRole(
    page,
    "field@example.com",
    "FIELD_LEADER",
    "/field-reports",
  );

  await expect(page).toHaveURL(/\/field-reports$/);
  await expect(page.getByRole("link", { name: /Field Reports/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Commercial \/ Pricing/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /PM Control/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Award Approval/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Procurement/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Finance/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Imports/i })).toHaveCount(0);
});
