import { expect, test } from "@playwright/test";

test("executive can reach the dashboard and see summary widgets", async ({
  page,
}) => {
  await page.goto("/sign-in");

  await page.getByLabel("Email").fill("executive@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByLabel("Role").selectOption("EXECUTIVE");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("heading", { name: "Executive portfolio dashboard" }),
  ).toBeVisible();
  await expect(page.getByText("Completion")).toBeVisible();
  await expect(page.getByText("Risk alerts")).toBeVisible();
  await expect(page.getByText("Project health")).toBeVisible();
});
