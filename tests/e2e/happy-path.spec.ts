import { expect, test } from "@playwright/test";

test("admin happy path touches each MVP module", async ({ page }) => {
  await page.goto("/sign-in");

  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByLabel("Role").selectOption("ADMIN");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("heading", { name: "Executive portfolio dashboard" }),
  ).toBeVisible();

  await page.getByRole("link", { name: /Projects/i }).click();
  await expect(
    page.getByRole("heading", { name: "Project and area management" }),
  ).toBeVisible();

  await page.getByRole("link", { name: /Teams/i }).click();
  await expect(
    page.getByRole("heading", { name: "Team management" }),
  ).toBeVisible();

  await page.getByRole("link", { name: /Field Reports/i }).click();
  await expect(
    page.getByRole("heading", { name: "Daily field reporting" }),
  ).toBeVisible();

  await page.getByRole("link", { name: /Finance/i }).click();
  await expect(
    page.getByRole("heading", { name: "Billing and cost tracking" }),
  ).toBeVisible();

  await page.getByRole("link", { name: /Imports/i }).click();
  await expect(
    page.getByRole("heading", { name: "Import review center" }),
  ).toBeVisible();
});
