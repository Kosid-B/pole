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

  const navigation = page.getByRole("navigation", { name: "Dashboard navigation" });

  await navigation.getByRole("link", { name: /Projects/ }).click();
  await expect(
    page.getByRole("heading", { name: "Project and area management" }),
  ).toBeVisible();

  await navigation.getByRole("link", { name: /Teams/ }).click();
  await expect(
    page.getByRole("heading", { name: "Team management" }),
  ).toBeVisible();

  await navigation.getByRole("link", { name: /Field Reports/ }).click();
  await expect(
    page.getByRole("heading", { name: "Daily field reporting" }),
  ).toBeVisible();

  await navigation.getByRole("link", { name: /Finance/ }).click();
  await expect(
    page.getByRole("heading", { name: "Billing and cost tracking" }),
  ).toBeVisible();

  await navigation.getByRole("link", { name: /Imports/ }).click();
  await expect(
    page.getByRole("heading", { name: "Import review center" }),
  ).toBeVisible();
});
