"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import {
  reviewSupplierPaymentRequest,
  submitSupplierPaymentRequest,
} from "@/lib/payment-request-control";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function refresh() {
  revalidatePath("/pm/payment-requests");
  revalidatePath("/pm/invoices");
  revalidatePath("/pm/financial");
  revalidatePath("/finance");
  revalidatePath("/pm");
}

export async function submitSupplierPaymentRequestAction(formData: FormData) {
  const session = await requireSession();
  if (session.user.role !== "EXECUTIVE" && session.user.role !== "ADMIN") {
    redirect("/pm/payment-requests?error=submitter-role-blocked");
  }
  const requestId = text(formData, "request_id");
  const invoiceId = text(formData, "invoice_id");
  const dueDate = text(formData, "due_date");
  const evidenceRef = text(formData, "evidence_ref");
  const requestReason = text(formData, "request_reason");
  const confirmed = text(formData, "confirmation") === "yes";
  if (!requestId || !invoiceId || !dueDate || !evidenceRef || requestReason.length < 8 || !confirmed) {
    redirect("/pm/payment-requests?error=payment-request-form-incomplete");
  }
  const result = await submitSupplierPaymentRequest({
    request_id: requestId,
    invoice_id: invoiceId,
    due_date: dueDate,
    evidence_ref: evidenceRef,
    request_reason: requestReason,
    actor_user_id: session.user.id,
    actor_email: session.user.email,
    actor_name: session.user.name,
    actor_role: session.user.role,
  });
  if (!result.data) redirect(`/pm/payment-requests?error=${encodeURIComponent(result.error || "payment-request-submit-failed")}`);
  refresh();
  redirect("/pm/payment-requests?submitted=success");
}

export async function reviewSupplierPaymentRequestAction(formData: FormData) {
  const session = await requireSession();
  if (session.user.role !== "EXECUTIVE") {
    redirect("/pm/payment-requests?error=executive-review-required");
  }
  const requestId = text(formData, "request_id");
  const paymentRequestId = text(formData, "payment_request_id");
  const decision = text(formData, "decision");
  const reviewReason = text(formData, "review_reason");
  const confirmed = text(formData, "confirmation") === "yes";
  if (
    !requestId ||
    !paymentRequestId ||
    !["cash_reserved", "rejected"].includes(decision) ||
    reviewReason.length < 8 ||
    !confirmed
  ) {
    redirect("/pm/payment-requests?error=payment-request-review-incomplete");
  }
  const result = await reviewSupplierPaymentRequest({
    request_id: requestId,
    payment_request_id: paymentRequestId,
    decision: decision as "cash_reserved" | "rejected",
    review_reason: reviewReason,
    actor_user_id: session.user.id,
    actor_email: session.user.email,
    actor_name: session.user.name,
    actor_role: "EXECUTIVE",
  });
  if (!result.data) redirect(`/pm/payment-requests?error=${encodeURIComponent(result.error || "payment-request-review-failed")}`);
  refresh();
  redirect("/pm/payment-requests?reviewed=success");
}
