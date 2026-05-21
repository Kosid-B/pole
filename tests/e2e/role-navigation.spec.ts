import { expect, test, type Page } from "@playwright/test";

async function signInAsRole(
  page: Page,
  email: string,
) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("executive sees cross-functional navigation", async ({ page }) => {
  await signInAsRole(page, "executive@example.com");

  await expect(
    page.getByRole("navigation", { name: "Dashboard navigation" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Projects/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Teams/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Field Reports/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Finance/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Imports/i })).toBeVisible();
});

test("field leader only keeps field reporting access", async ({ page }) => {
  await signInAsRole(page, "field@example.com");

  await expect(page).toHaveURL(/\/field-reports$/);
  await expect(page.getByRole("link", { name: /Field Reports/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Finance/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Imports/i })).toHaveCount(0);
});
