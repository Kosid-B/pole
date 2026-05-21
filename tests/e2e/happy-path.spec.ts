import { expect, test } from "@playwright/test";

test("admin happy path touches each MVP module", async ({ page }) => {
  await page.goto("/sign-in");

  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("heading", { name: "Executive portfolio dashboard" }),
  ).toBeVisible();

  const navigation = page.getByRole("navigation", { name: "Dashboard navigation" });

  const openModule = async (name: RegExp) => {
    const link = navigation.getByRole("link", { name });
    await link.scrollIntoViewIfNeeded();
    await link.click();
  };

  await openModule(/Projects/);
  await expect(
    page.getByRole("heading", { name: "Project and area management" }),
  ).toBeVisible();

  await openModule(/Teams/);
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
