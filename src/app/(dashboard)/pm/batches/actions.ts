"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  releaseBatch,
  setBatchSchedule,
  setBatchSiteReadiness,
} from "@/lib/batch-release";
import { requireSession } from "@/lib/auth";

function requireControlRole(role: string) {
  if (role !== "EXECUTIVE" && role !== "ADMIN") {
    redirect("/pm/batches?error=batch-control-role-blocked");
  }
  return role;
}

function requiredText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function optionalNumber(formData: FormData, key: string) {
  const raw = requiredText(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "yes";
}

function refreshBatchPaths() {
  revalidatePath("/pm/batches");
  revalidatePath("/pm");
  revalidatePath("/procurement");
  revalidatePath("/pm/financial");
  revalidatePath("/pm/suppliers/award-approval");
}

function actor(session: Awaited<ReturnType<typeof requireSession>>, role: "EXECUTIVE" | "ADMIN") {
  return {
    actor_user_id: session.user.id,
    actor_email: session.user.email,
    actor_name: session.user.name,
    actor_role: role,
  };
}

export async function setBatchScheduleAction(formData: FormData) {
  const session = await requireSession();
  const role = requireControlRole(session.user.role) as "EXECUTIVE" | "ADMIN";
  const requestId = requiredText(formData, "request_id");
  const batchId = requiredText(formData, "batch_id");
  const localStart = requiredText(formData, "planned_start_at");
  const reason = requiredText(formData, "reason");

  if (!requestId || !batchId || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localStart) || reason.length < 8) {
    redirect("/pm/batches?error=schedule-form-incomplete");
  }

  const result = await setBatchSchedule({
    request_id: requestId,
    batch_id: batchId,
    planned_start_at: `${localStart}:00+07:00`,
    reason,
    ...actor(session, role),
  });
  if (!result.data) {
    redirect(`/pm/batches?error=${encodeURIComponent(result.error || "schedule-update-failed")}`);
  }

  refreshBatchPaths();
  redirect(`/pm/batches?schedule=success&batch=${encodeURIComponent(batchId)}`);
}

export async function setBatchSiteReadinessAction(formData: FormData) {
  const session = await requireSession();
  const role = requireControlRole(session.user.role) as "EXECUTIVE" | "ADMIN";
  const requestId = requiredText(formData, "request_id");
  const batchId = requiredText(formData, "batch_id");
  const siteId = requiredText(formData, "site_id");
  const reason = requiredText(formData, "reason");
  const concreteM3 = optionalNumber(formData, "confirmed_concrete_m3");

  if (!requestId || !batchId || !siteId || reason.length < 8) {
    redirect("/pm/batches?error=site-readiness-form-incomplete");
  }

  const result = await setBatchSiteReadiness({
    request_id: requestId,
    batch_id: batchId,
    site_id: siteId,
    quantity_confirmed: checked(formData, "quantity_confirmed"),
    drawing_confirmed: checked(formData, "drawing_confirmed"),
    site_condition_confirmed: checked(formData, "site_condition_confirmed"),
    access_ready: checked(formData, "access_ready"),
    confirmed_area_m2: optionalNumber(formData, "confirmed_area_m2"),
    confirmed_concrete_m3: concreteM3,
    evidence_ref: requiredText(formData, "evidence_ref"),
    readiness_note: requiredText(formData, "readiness_note"),
    reason,
    ...actor(session, role),
  });
  if (!result.data) {
    redirect(`/pm/batches?error=${encodeURIComponent(result.error || "site-readiness-update-failed")}`);
  }

  refreshBatchPaths();
  redirect(`/pm/batches?readiness=success&batch=${encodeURIComponent(batchId)}`);
}

export async function releaseBatchAction(formData: FormData) {
  const session = await requireSession();
  const role = requireControlRole(session.user.role) as "EXECUTIVE" | "ADMIN";
  const requestId = requiredText(formData, "request_id");
  const batchId = requiredText(formData, "batch_id");
  const reason = requiredText(formData, "reason");
  const confirmed = requiredText(formData, "release_confirmation") === "yes";

  if (!requestId || !batchId || reason.length < 8 || !confirmed) {
    redirect("/pm/batches?error=batch-release-form-incomplete");
  }

  const result = await releaseBatch({
    request_id: requestId,
    batch_id: batchId,
    reason,
    ...actor(session, role),
  });
  if (!result.data) {
    redirect(`/pm/batches?error=${encodeURIComponent(result.error || "batch-release-failed")}`);
  }

  refreshBatchPaths();
  redirect(`/pm/batches?release=success&batch=${encodeURIComponent(batchId)}`);
}
