"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import {
  closeSupplierCalloff,
  createSupplierCalloff,
  reviewDeliveryReceipt,
} from "@/lib/delivery-control";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function number(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) ? value : NaN;
}

function refresh() {
  revalidatePath("/pm/calloffs");
  revalidatePath("/field-deliveries");
  revalidatePath("/pm/batches");
  revalidatePath("/pm");
}

function deliveryIso(local: string) {
  if (!local) return "";
  const value = new Date(`${local}:00+07:00`);
  return Number.isFinite(value.getTime()) ? value.toISOString() : "";
}

export async function createCalloffAction(formData: FormData) {
  const session = await requireSession();
  if (session.user.role !== "EXECUTIVE" && session.user.role !== "ADMIN") {
    redirect("/pm/calloffs?error=approver-role-blocked");
  }

  const requestId = text(formData, "request_id");
  const batchId = text(formData, "batch_id");
  const siteId = text(formData, "site_id");
  const supplierBidId = text(formData, "supplier_bid_id");
  const calloffRef = text(formData, "calloff_ref");
  const requestedM3 = number(formData, "requested_m3");
  const plannedDeliveryAt = deliveryIso(text(formData, "planned_delivery_at"));
  const reason = text(formData, "reason");
  const confirmed = text(formData, "confirmation") === "yes";

  if (
    !requestId ||
    !batchId ||
    !siteId ||
    !supplierBidId ||
    !calloffRef ||
    !Number.isFinite(requestedM3) ||
    requestedM3 <= 0 ||
    !plannedDeliveryAt ||
    reason.length < 8 ||
    !confirmed
  ) {
    redirect("/pm/calloffs?error=calloff-form-incomplete");
  }

  const result = await createSupplierCalloff({
    request_id: requestId,
    batch_id: batchId,
    site_id: siteId,
    supplier_bid_id: supplierBidId,
    calloff_ref: calloffRef,
    requested_m3: requestedM3,
    planned_delivery_at: plannedDeliveryAt,
    reason,
    actor_user_id: session.user.id,
    actor_email: session.user.email,
    actor_name: session.user.name,
    actor_role: session.user.role,
  });

  if (!result.data) {
    redirect(`/pm/calloffs?error=${encodeURIComponent(result.error || "calloff-create-failed")}`);
  }

  refresh();
  redirect("/pm/calloffs?created=success");
}

export async function reviewDeliveryAction(formData: FormData) {
  const session = await requireSession();
  if (session.user.role !== "EXECUTIVE" && session.user.role !== "ADMIN") {
    redirect("/pm/calloffs?error=reviewer-role-blocked");
  }

  const requestId = text(formData, "request_id");
  const submissionId = text(formData, "submission_id");
  const decision = text(formData, "decision");
  const reviewReason = text(formData, "review_reason");
  const confirmed = text(formData, "confirmation") === "yes";

  if (
    !requestId ||
    !submissionId ||
    !["accepted", "rejected"].includes(decision) ||
    reviewReason.length < 8 ||
    !confirmed
  ) {
    redirect("/pm/calloffs?error=delivery-review-incomplete");
  }

  const result = await reviewDeliveryReceipt({
    request_id: requestId,
    submission_id: submissionId,
    decision: decision as "accepted" | "rejected",
    review_reason: reviewReason,
    actor_user_id: session.user.id,
    actor_email: session.user.email,
    actor_name: session.user.name,
    actor_role: session.user.role,
  });

  if (!result.data) {
    redirect(`/pm/calloffs?error=${encodeURIComponent(result.error || "delivery-review-failed")}`);
  }

  refresh();
  redirect("/pm/calloffs?reviewed=success");
}

export async function closeCalloffAction(formData: FormData) {
  const session = await requireSession();
  if (session.user.role !== "EXECUTIVE" && session.user.role !== "ADMIN") {
    redirect("/pm/calloffs?error=approver-role-blocked");
  }

  const requestId = text(formData, "request_id");
  const calloffId = text(formData, "calloff_id");
  const status = text(formData, "status");
  const reason = text(formData, "reason");
  const confirmed = text(formData, "confirmation") === "yes";

  if (
    !requestId ||
    !calloffId ||
    !["completed", "cancelled"].includes(status) ||
    reason.length < 8 ||
    !confirmed
  ) {
    redirect("/pm/calloffs?error=calloff-close-incomplete");
  }

  const result = await closeSupplierCalloff({
    request_id: requestId,
    calloff_id: calloffId,
    status: status as "completed" | "cancelled",
    reason,
    actor_user_id: session.user.id,
    actor_email: session.user.email,
    actor_name: session.user.name,
    actor_role: session.user.role,
  });

  if (!result.data) {
    redirect(`/pm/calloffs?error=${encodeURIComponent(result.error || "calloff-close-failed")}`);
  }

  refresh();
  redirect("/pm/calloffs?closed=success");
}
