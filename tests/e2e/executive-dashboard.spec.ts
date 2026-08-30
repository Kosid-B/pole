import { expect, test } from "@playwright/test";

test("executive can reach the dashboard and see summary widgets", async ({
  page,
}) => {
  await page.goto("/sign-in");

  await page.getByLabel("Email").fill("executive@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("heading", { name: "Executive portfolio dashboard" }),
  ).toBeVisible();
  await expect(page.getByText("Completion", { exact: true })).toBeVisible();
  await expect(page.getByText("Today's focus")).toBeVisible();
  await expect(page.getByText("Risk alerts and follow-up")).toBeVisible();
  await expect(page.getByText("Project health and exception watch")).toBeVisible();
});
