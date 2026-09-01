import { expect, test } from "@playwright/test";
import { openAsSeededRole } from "./helpers/session";

test("mobile navigation reveals core work first and progressively discloses PM controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openAsSeededRole(page, "executive@example.com", "EXECUTIVE", "/");

  const navigation = page.getByRole("navigation", { name: "Dashboard navigation" });
  await expect(navigation).toBeVisible();

  await expect(navigation.getByText("งานหลัก", { exact: true })).toBeVisible();
  await expect(navigation.getByRole("link", { name: /Commercial \/ Pricing/i })).toBeVisible();

  const pmFinancial = navigation.getByRole("link", { name: /PM Financial/i });
  await expect(pmFinancial).toBeHidden();

  await navigation.getByText("PM Workflow Controls", { exact: true }).click();
  await expect(pmFinancial).toBeVisible();
});
