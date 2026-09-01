import { expect, test } from "@playwright/test";
import { openAsSeededRole } from "./helpers/session";

test("executive sees cross-functional navigation", async ({ page }) => {
  await openAsSeededRole(
    page,
    "executive@example.com",
    "EXECUTIVE",
    "/",
  );

  const navigation = page.getByRole("navigation", {
    name: "Dashboard navigation",
  });
  await expect(navigation).toBeVisible();

  for (const name of [
    /Projects/i,
    /Commercial \/ Pricing/i,
    /PM Control/i,
    /Award Approval/i,
    /Batch Release/i,
    /Supplier Call-off/i,
    /Payment Request/i,
    /Supplier Invoice/i,
    /Procurement/i,
    /Teams/i,
    /Field Reports/i,
    /Field Readiness/i,
    /Field Delivery/i,
    /Finance/i,
    /Imports/i,
  ]) {
    await expect(navigation.getByRole("link", { name })).toBeVisible();
  }
});

test("field leader keeps field workflows but not PM release controls", async ({ page }) => {
  await openAsSeededRole(
    page,
    "field@example.com",
    "FIELD_LEADER",
    "/field-reports",
  );

  await expect(page).toHaveURL(/\/field-reports$/);
  const navigation = page.getByRole("navigation", {
    name: "Dashboard navigation",
  });

  for (const name of [/Field Reports/i, /Field Readiness/i, /Field Delivery/i]) {
    await expect(navigation.getByRole("link", { name })).toBeVisible();
  }

  for (const name of [
    /Commercial \/ Pricing/i,
    /PM Control/i,
    /Award Approval/i,
    /Batch Release/i,
    /Supplier Call-off/i,
    /Payment Request/i,
    /Supplier Invoice/i,
    /Procurement/i,
    /Finance/i,
    /Imports/i,
  ]) {
    await expect(navigation.getByRole("link", { name })).toHaveCount(0);
  }
});
