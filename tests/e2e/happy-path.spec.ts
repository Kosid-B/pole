import { expect, test } from "@playwright/test";
import { openAsSeededRole } from "./helpers/session";

test("admin happy path touches each MVP module", async ({ page }) => {
  await openAsSeededRole(page, "admin@example.com", "ADMIN", "/");

  await expect(
    page.getByRole("heading", {
      name: "งานลานตาก 446 จุด — เห็นสถานะก่อน แล้วค่อยตัดสินใจ",
    }),
  ).toBeVisible();

  const openModule = async (name: RegExp, route: RegExp) => {
    const link = page
      .getByRole("navigation", { name: "Dashboard navigation" })
      .getByRole("link", { name });

    await expect(link).toBeVisible();
    await Promise.all([
      page.waitForURL(route, { waitUntil: "commit" }),
      link.click({ noWaitAfter: true }),
    ]);
  };

  await openModule(/Projects/, /\/projects$/);
  await expect(
    page.getByRole("heading", { name: "Project and area management" }),
  ).toBeVisible();

  await openModule(/Teams/, /\/teams$/);
  await expect(
    page.getByRole("heading", { name: "Team management" }),
  ).toBeVisible();

  await openModule(/Field Reports/, /\/field-reports$/);
  await expect(
    page.getByRole("heading", { name: "Daily field reporting" }),
  ).toBeVisible();

  await openModule(/Finance/, /\/finance$/);
  await expect(
    page.getByRole("heading", { name: "Billing and cost tracking" }),
  ).toBeVisible();

  await openModule(/Imports/, /\/imports$/);
  await expect(
    page.getByRole("heading", { name: "Import review center" }),
  ).toBeVisible();
});
