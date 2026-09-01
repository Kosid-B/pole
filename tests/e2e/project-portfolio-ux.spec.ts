import { expect, test } from "@playwright/test";
import { openAsSeededRole } from "./helpers/session";

test("mobile portfolio prioritizes project cards and keeps templates collapsed", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openAsSeededRole(page, "admin@example.com", "ADMIN", "/projects");

  await expect(page.getByRole("heading", { name: "พอร์ตโครงการ" })).toBeVisible();
  await expect(page.getByText("90,000 Pole Rollout").first()).toBeVisible();
  await expect(page.getByText("NEXT FOCUS")).toBeVisible();
  await expect(page.getByRole("table")).not.toBeVisible();

  const templates = page.locator("details").filter({ hasText: "Project templates" });
  await expect(templates).not.toHaveAttribute("open", "");
  await expect(page.getByText("STANDARD-CONSTRUCTION")).not.toBeVisible();
});

test("desktop portfolio shows the decision table", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openAsSeededRole(page, "admin@example.com", "ADMIN", "/projects");

  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "โครงการ / สถานะ" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Next focus" })).toBeVisible();
  await expect(table.getByText("90,000 Pole Rollout")).toBeVisible();
});
