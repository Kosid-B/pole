import { expect, test } from "@playwright/test";
import { openAsSeededRole } from "./helpers/session";

test("admin can sign in and reach the protected dashboard shell", async ({
  page,
}) => {
  await page.goto("/sign-in");

  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("password");

  await Promise.all([
    page.waitForURL((url) => url.pathname !== "/sign-in", { timeout: 30_000 }),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);

  await expect(
    page.getByRole("heading", { name: "Project operations dashboard" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByRole("navigation", { name: "Dashboard navigation" }),
  ).toBeVisible();
  await expect(page.getByText("Signed in as")).toBeVisible();
});

test("field leaders are redirected away from finance", async ({ page }) => {
  await openAsSeededRole(
    page,
    "field@example.com",
    "FIELD_LEADER",
    "/finance",
  );

  await expect(page).toHaveURL(/\/field-reports$/);
  await expect(
    page.getByRole("heading", {
      name: "Daily field reporting",
    }),
  ).toBeVisible();
});
