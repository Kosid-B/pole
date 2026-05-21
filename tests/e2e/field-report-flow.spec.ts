import { expect, test } from "@playwright/test";

test("field leader can create a field report with material and equipment usage", async ({
  page,
}) => {
  await page.goto("/sign-in?redirectTo=/field-reports/new");

  await page.getByLabel("Email").fill("field@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("heading", { name: "Create a field report" }),
  ).toBeVisible();

  await page.getByLabel("Project").selectOption({ index: 1 });
  await page.getByLabel("Area").selectOption({ index: 1 });
  await page.getByLabel("Team").selectOption({ index: 1 });
  await page.getByLabel("Report date").fill("2026-05-21");
  await page.getByLabel("Completed units").fill("16");
  await page.getByLabel("Manpower count").fill("8");
  await page.getByLabel("Issues and blockers").fill("Temporary access delay.");
  await page.getByLabel("Material name").fill("Concrete pole");
  await page.getByLabel("Quantity", { exact: true }).nth(0).fill("16");
  await page.getByLabel("Unit", { exact: true }).nth(0).selectOption({
    label: "ต้น (ต้น)",
  });
  await page.getByLabel("Suggested machine").selectOption({ label: "เครื่องเจาะ" });
  await page.getByLabel("Equipment name").fill("เครื่องเจาะ");
  await page.getByLabel("Quantity", { exact: true }).nth(1).fill("1");
  await page.getByLabel("Unit", { exact: true }).nth(1).selectOption({
    label: "เครื่อง (เครื่อง)",
  });
  await page.getByRole("button", { name: "Save field report" }).click();

  await expect(page).toHaveURL(/\/field-reports$/);
  await expect(
    page.getByRole("heading", { name: "Daily field reporting" }),
  ).toBeVisible();
  await expect(page.getByText("Temporary access delay.").first()).toBeVisible();
  await expect(page.getByText("Concrete pole - 16 ต้น").first()).toBeVisible();
  await expect(page.getByText("เครื่องเจาะ - 1 เครื่อง").first()).toBeVisible();
});
