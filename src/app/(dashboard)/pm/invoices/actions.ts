"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { reviewSupplierInvoice, submitSupplierInvoice } from "@/lib/invoice-control";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function number(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) ? value : NaN;
}

function refresh() {
  revalidatePath("/pm/invoices");
  revalidatePath("/pm/calloffs");
  revalidatePath("/finance");
  revalidatePath("/pm");
}

export async function submitSupplierInvoiceAction(formData: FormData) {
  const session = await requireSession();
  if (session.user.role !== "EXECUTIVE" && session.user.role !== "ADMIN") {
    redirect("/pm/invoices?error=approver-role-blocked");
  }

  const requestId = text(formData, "request_id");
  const supplierBidId = text(formData, "supplier_bid_id");
  const calloffId = text(formData, "calloff_id");
  const invoiceRef = text(formData, "invoice_ref");
  const taxInvoiceRef = text(formData, "tax_invoice_ref");
  const invoiceDate = text(formData, "invoice_date");
  const invoicedM3 = number(formData, "invoiced_m3");
  const invoiceLineNet = number(formData, "invoice_line_net");
  const netAmount = number(formData, "net_amount");
  const vatAmount = number(formData, "vat_amount");
  const grossAmount = number(formData, "gross_amount");
  const evidenceRef = text(formData, "evidence_ref");
  const note = text(formData, "note");
  const confirmed = text(formData, "confirmation") === "yes";

  if (
    !requestId ||
    !supplierBidId ||
    !calloffId ||
    !invoiceRef ||
    !invoiceDate ||
    !evidenceRef ||
    !Number.isFinite(invoicedM3) ||
    invoicedM3 <= 0 ||
    !Number.isFinite(invoiceLineNet) ||
    invoiceLineNet <= 0 ||
    !Number.isFinite(netAmount) ||
    netAmount <= 0 ||
    !Number.isFinite(vatAmount) ||
    vatAmount < 0 ||
    !Number.isFinite(grossAmount) ||
    grossAmount <= 0 ||
    Math.abs(invoiceLineNet - netAmount) > 0.01 ||
    Math.abs(grossAmount - (netAmount + vatAmount)) > 0.01 ||
    !confirmed
  ) {
    redirect("/pm/invoices?error=invoice-form-incomplete");
  }

  const result = await submitSupplierInvoice({
    request_id: requestId,
    supplier_bid_id: supplierBidId,
    calloff_id: calloffId,
    invoice_ref: invoiceRef,
    tax_invoice_ref: taxInvoiceRef,
    invoice_date: invoiceDate,
    invoiced_m3: invoicedM3,
    invoice_line_net: invoiceLineNet,
    net_amount: netAmount,
    vat_amount: vatAmount,
    gross_amount: grossAmount,
    evidence_ref: evidenceRef,
    note,
    actor_user_id: session.user.id,
    actor_email: session.user.email,
    actor_name: session.user.name,
    actor_role: session.user.role,
  });

  if (!result.data) {
    redirect(`/pm/invoices?error=${encodeURIComponent(result.error || "invoice-submit-failed")}`);
  }

  refresh();
  redirect("/pm/invoices?submitted=success");
}

export async function reviewSupplierInvoiceAction(formData: FormData) {
  const session = await requireSession();
  if (session.user.role !== "EXECUTIVE" && session.user.role !== "ADMIN") {
    redirect("/pm/invoices?error=reviewer-role-blocked");
  }

  const requestId = text(formData, "request_id");
  const invoiceId = text(formData, "invoice_id");
  const decision = text(formData, "decision");
  const reviewReason = text(formData, "review_reason");
  const confirmed = text(formData, "confirmation") === "yes";

  if (
    !requestId ||
    !invoiceId ||
    !["payment_eligible", "rejected"].includes(decision) ||
    reviewReason.length < 8 ||
    !confirmed
  ) {
    redirect("/pm/invoices?error=invoice-review-incomplete");
  }

  const result = await reviewSupplierInvoice({
    request_id: requestId,
    invoice_id: invoiceId,
    decision: decision as "payment_eligible" | "rejected",
    review_reason: reviewReason,
    actor_user_id: session.user.id,
    actor_email: session.user.email,
    actor_name: session.user.name,
    actor_role: session.user.role,
  });

  if (!result.data) {
    redirect(`/pm/invoices?error=${encodeURIComponent(result.error || "invoice-review-failed")}`);
  }

  refresh();
  redirect("/pm/invoices?reviewed=success");
}
