import { expect, test } from "@playwright/test";
import { openAsSeededRole } from "./helpers/session";

test("executive can reach the dashboard and see summary widgets", async ({
  page,
}) => {
  await openAsSeededRole(
    page,
    "executive@example.com",
    "EXECUTIVE",
    "/",
  );

  await expect(
    page.getByRole("heading", { name: "Executive portfolio dashboard" }),
  ).toBeVisible();
  await expect(page.getByText("Completion", { exact: true })).toBeVisible();
  await expect(page.getByText("Today's focus")).toBeVisible();
  await expect(page.getByText("Risk alerts and follow-up")).toBeVisible();
  await expect(page.getByText("Project health and exception watch")).toBeVisible();
});
