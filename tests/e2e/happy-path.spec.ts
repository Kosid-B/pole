import { expect, test } from "@playwright/test";
import { openAsSeededRole } from "./helpers/session";

test("admin happy path touches each MVP module", async ({ page }) => {
  await openAsSeededRole(page, "admin@example.com", "ADMIN", "/");

  await expect(
    page.getByRole("heading", { name: "ภาพรวมผู้บริหาร" }),
  ).toBeVisible();

  const navigation = page.getByRole("navigation", { name: "Dashboard navigation" });
  const openModule = async (name: string | RegExp, exact = false) => {
    const link = navigation.getByRole("link", { name, exact });

    await expect(link).toBeVisible();
    await link.click();
  };

  await openModule("โครงการ", true);
  await expect(
    page.getByRole("heading", { name: "พอร์ตโครงการ" }),
  ).toBeVisible();

  await openModule("ทีมงาน", true);
  await expect(
    page.getByRole("heading", { name: "Team management" }),
  ).toBeVisible();

  await openModule(/Field Reports/);
  await expect(
    page.getByRole("heading", { name: "Daily field reporting" }),
  ).toBeVisible();

  await openModule(/Finance/);
  await expect(
    page.getByRole("heading", { name: "Billing and cost tracking" }),
  ).toBeVisible();

  await openModule(/Imports/);
  await expect(
    page.getByRole("heading", { name: "Import review center" }),
  ).toBeVisible();
});
