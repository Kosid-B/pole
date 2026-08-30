"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  reviewFieldReadiness,
  submitFieldReadiness,
  type ReadinessRole,
} from "@/lib/field-readiness";
import { requireSession } from "@/lib/auth";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "yes";
}

function optionalNumber(formData: FormData, key: string) {
  const raw = text(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function refresh() {
  revalidatePath("/field-readiness");
  revalidatePath("/pm/batches");
  revalidatePath("/pm");
}

function identity(session: Awaited<ReturnType<typeof requireSession>>) {
  return {
    actor_user_id: session.user.id,
    actor_email: session.user.email,
    actor_name: session.user.name,
    actor_role: session.user.role as ReadinessRole,
  };
}

export async function submitReadinessAction(formData: FormData) {
  const session = await requireSession();
  const role = session.user.role as ReadinessRole;
  if (!["EXECUTIVE", "ADMIN", "FIELD_LEADER"].includes(role)) {
    redirect("/field-readiness?error=submitter-role-blocked");
  }

  const requestId = text(formData, "request_id");
  const batchId = text(formData, "batch_id");
  const siteId = text(formData, "site_id");
  const evidenceRef = text(formData, "evidence_ref");
  const concreteM3 = optionalNumber(formData, "confirmed_concrete_m3");
  const candidateReady =
    checked(formData, "quantity_confirmed") &&
    checked(formData, "drawing_confirmed") &&
    checked(formData, "site_condition_confirmed") &&
    checked(formData, "access_ready") &&
    Number(concreteM3 || 0) > 0;

  if (!requestId || !batchId || !siteId || (candidateReady && !evidenceRef)) {
    redirect("/field-readiness?error=readiness-submission-incomplete");
  }

  const result = await submitFieldReadiness({
    request_id: requestId,
    batch_id: batchId,
    site_id: siteId,
    quantity_confirmed: checked(formData, "quantity_confirmed"),
    drawing_confirmed: checked(formData, "drawing_confirmed"),
    site_condition_confirmed: checked(formData, "site_condition_confirmed"),
    access_ready: checked(formData, "access_ready"),
    confirmed_area_m2: optionalNumber(formData, "confirmed_area_m2"),
    confirmed_concrete_m3: concreteM3,
    evidence_ref: evidenceRef,
    note: text(formData, "note"),
    ...identity(session),
  });

  if (!result.data) {
    redirect(`/field-readiness?error=${encodeURIComponent(result.error || "readiness-submit-failed")}&batch=${encodeURIComponent(batchId)}`);
  }

  refresh();
  redirect(`/field-readiness?submitted=success&batch=${encodeURIComponent(batchId)}`);
}

export async function reviewReadinessAction(formData: FormData) {
  const session = await requireSession();
  if (session.user.role !== "EXECUTIVE" && session.user.role !== "ADMIN") {
    redirect("/field-readiness?error=reviewer-role-blocked");
  }

  const requestId = text(formData, "request_id");
  const submissionId = text(formData, "submission_id");
  const batchId = text(formData, "batch_id");
  const decision = text(formData, "decision");
  const reason = text(formData, "review_reason");
  const confirmed = text(formData, "review_confirmation") === "yes";

  if (
    !requestId ||
    !submissionId ||
    !batchId ||
    !["accepted", "rejected"].includes(decision) ||
    reason.length < 8 ||
    !confirmed
  ) {
    redirect(`/field-readiness?error=review-form-incomplete&batch=${encodeURIComponent(batchId)}`);
  }

  const result = await reviewFieldReadiness({
    request_id: requestId,
    submission_id: submissionId,
    decision: decision as "accepted" | "rejected",
    review_reason: reason,
    actor_user_id: session.user.id,
    actor_email: session.user.email,
    actor_name: session.user.name,
    actor_role: session.user.role,
  });

  if (!result.data) {
    redirect(`/field-readiness?error=${encodeURIComponent(result.error || "readiness-review-failed")}&batch=${encodeURIComponent(batchId)}`);
  }

  refresh();
  redirect(`/field-readiness?reviewed=success&batch=${encodeURIComponent(batchId)}`);
}
