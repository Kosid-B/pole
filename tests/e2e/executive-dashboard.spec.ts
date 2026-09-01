import { expect, test } from "@playwright/test";
import { openAsSeededRole } from "./helpers/session";

test("executive can reach the dashboard and see decision evidence", async ({
  page,
}) => {
  await openAsSeededRole(
    page,
    "executive@example.com",
    "EXECUTIVE",
    "/",
  );

  await expect(
    page.getByRole("heading", { name: "ภาพรวมผู้บริหาร" }),
  ).toBeVisible();
  await expect(page.getByText("Completion", { exact: true })).toBeVisible();
  await expect(page.getByText("Exception queue")).toBeVisible();
  await expect(page.getByText("Risk alerts and follow-up")).toBeVisible();
  await expect(page.getByText("Project health and exception watch")).toBeVisible();
});
