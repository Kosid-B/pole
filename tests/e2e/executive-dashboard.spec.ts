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
    page.getByRole("heading", {
      name: "งานลานตาก 446 จุด — เห็นสถานะก่อน แล้วค่อยตัดสินใจ",
    }),
  ).toBeVisible();
  await expect(page.getByText("Decision Guardrails")).toBeVisible();
  await expect(page.getByText("GM Gate")).toBeVisible();
  await expect(page.getByText("Workspaces")).toBeVisible();
  await expect(page.getByText("Next best action")).toBeVisible();
});
