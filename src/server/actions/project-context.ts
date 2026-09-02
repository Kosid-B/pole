"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import {
  getSiteCostProjectContext,
  isVerifiedProjectSelection,
  SITECOST_PROJECT_ID_COOKIE_NAME,
} from "@/lib/project-context";

function projectSelectionError(code: "invalid-project" | "access-denied") {
  const params = new URLSearchParams({ projectError: code });
  return `/projects?${params.toString()}`;
}

export async function selectSiteCostProject(formData: FormData) {
  await requireSession();

  const requestedProjectId = String(formData.get("projectId") ?? "").trim();

  if (!requestedProjectId) {
    redirect(projectSelectionError("invalid-project"));
  }

  // Re-authorize the target project using the current server-side credential/session.
  // The browser-provided project id is never committed to a cookie before this check.
  const verification = await getSiteCostProjectContext({
    requestedProjectId,
  });

  if (!isVerifiedProjectSelection(verification, requestedProjectId)) {
    redirect(projectSelectionError("access-denied"));
  }

  const cookieStore = await cookies();
  const secureCookie =
    process.env.NODE_ENV === "production" && process.env.E2E_HTTP !== "1";

  cookieStore.set(SITECOST_PROJECT_ID_COOKIE_NAME, requestedProjectId, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie,
    path: "/",
  });

  revalidatePath("/", "layout");
}

export async function clearSiteCostProjectSelection() {
  await requireSession();

  const cookieStore = await cookies();
  cookieStore.delete(SITECOST_PROJECT_ID_COOKIE_NAME);
  revalidatePath("/", "layout");
}
