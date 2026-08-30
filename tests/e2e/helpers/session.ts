import type { BrowserContext, Page } from "@playwright/test";
import { createPrismaClient } from "../../../src/lib/db";
import type { AppRole } from "../../../src/lib/permissions";

const BASE_URL = "http://localhost:3000";

export async function installSeededSession(
  context: BrowserContext,
  email: string,
  expectedRole: AppRole,
) {
  const db = createPrismaClient();

  try {
    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new Error(`Seeded active user not found: ${email}`);
    }

    if (user.role !== expectedRole) {
      throw new Error(
        `Seeded user role mismatch for ${email}: expected ${expectedRole}, got ${user.role}`,
      );
    }

    await context.addCookies([
      {
        name: "pm-user-id",
        value: user.id,
        url: BASE_URL,
        httpOnly: true,
        sameSite: "Lax",
        secure: false,
      },
      {
        name: "pm-role",
        value: user.role,
        url: BASE_URL,
        httpOnly: true,
        sameSite: "Lax",
        secure: false,
      },
      {
        name: "pm-email",
        value: user.email,
        url: BASE_URL,
        httpOnly: true,
        sameSite: "Lax",
        secure: false,
      },
    ]);
  } finally {
    await db.$disconnect();
  }
}

export async function openAsSeededRole(
  page: Page,
  email: string,
  role: AppRole,
  target: string,
) {
  await installSeededSession(page.context(), email, role);
  await page.goto(target);
}
