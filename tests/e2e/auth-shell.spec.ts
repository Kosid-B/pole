import { expect, test } from "@playwright/test";

test("admin can sign in and reach the protected dashboard shell", async ({
  page,
}) => {
  await page.goto("/sign-in");

  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByLabel("Role").selectOption("ADMIN");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("heading", { name: "Project operations dashboard" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Dashboard navigation" }),
  ).toBeVisible();
  await expect(page.getByText("Signed in as")).toBeVisible();
});

test("field leaders are redirected away from finance", async ({ page }) => {
  await page.goto("/sign-in?redirectTo=/finance");

  await page.getByLabel("Email").fill("field@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByLabel("Role").selectOption("FIELD_LEADER");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/field-reports$/);
  await expect(
    page.getByRole("heading", {
      name: "Field leaders can reach their reporting workspace",
    }),
  ).toBeVisible();
});
