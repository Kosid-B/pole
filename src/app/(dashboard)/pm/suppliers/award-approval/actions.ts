"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  activateFrameworkAgreement,
  approveManualAward,
} from "@/lib/award-approval";
import { requireSession } from "@/lib/auth";

function requireApprovalRole(role: string) {
  if (role !== "EXECUTIVE" && role !== "ADMIN") {
    redirect("/pm/suppliers/award-approval?error=approval-role-blocked");
  }
  return role;
}

function requiredText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function refreshAwardPaths() {
  revalidatePath("/pm/suppliers/award-precheck");
  revalidatePath("/pm/suppliers/award-approval");
  revalidatePath("/pm/suppliers/rfq");
  revalidatePath("/procurement");
  revalidatePath("/pm/financial");
  revalidatePath("/pm");
}

export async function approveAwardAction(formData: FormData) {
  const session = await requireSession();
  const role = requireApprovalRole(session.user.role);

  const requestId = requiredText(formData, "request_id");
  const clusterId = requiredText(formData, "cluster_id");
  const primaryBidId = requiredText(formData, "primary_bid_id");
  const backupBidId = requiredText(formData, "backup_bid_id");
  const approvalReason = requiredText(formData, "approval_reason");
  const confirmed = requiredText(formData, "approval_confirmation") === "yes";

  if (
    !requestId ||
    !clusterId ||
    !primaryBidId ||
    !backupBidId ||
    approvalReason.length < 8 ||
    !confirmed
  ) {
    redirect("/pm/suppliers/award-approval?error=award-form-incomplete");
  }

  const result = await approveManualAward({
    request_id: requestId,
    cluster_id: clusterId,
    primary_bid_id: primaryBidId,
    backup_bid_id: backupBidId,
    approval_reason: approvalReason,
    approved_by_user_id: session.user.id,
    approved_by_email: session.user.email,
    approved_by_name: session.user.name,
    approved_by_role: role,
  });

  if (!result.data) {
    const error = encodeURIComponent(result.error || "award-approval-failed");
    redirect(`/pm/suppliers/award-approval?error=${error}`);
  }

  refreshAwardPaths();
  redirect(`/pm/suppliers/award-approval?award=success&cluster=${encodeURIComponent(clusterId)}`);
}

export async function activateFrameworkAction(formData: FormData) {
  const session = await requireSession();
  const role = requireApprovalRole(session.user.role);

  const requestId = requiredText(formData, "request_id");
  const clusterId = requiredText(formData, "cluster_id");
  const agreementNo = requiredText(formData, "agreement_no");
  const effectiveFrom = requiredText(formData, "effective_from");
  const effectiveTo = requiredText(formData, "effective_to");
  const approvalReason = requiredText(formData, "approval_reason");
  const confirmed = requiredText(formData, "activation_confirmation") === "yes";

  if (
    !requestId ||
    !clusterId ||
    !agreementNo ||
    !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom) ||
    approvalReason.length < 8 ||
    !confirmed
  ) {
    redirect("/pm/suppliers/award-approval?error=framework-form-incomplete");
  }

  const result = await activateFrameworkAgreement({
    request_id: requestId,
    cluster_id: clusterId,
    agreement_no: agreementNo,
    effective_from: effectiveFrom,
    effective_to: effectiveTo || undefined,
    approval_reason: approvalReason,
    approved_by_user_id: session.user.id,
    approved_by_email: session.user.email,
    approved_by_name: session.user.name,
    approved_by_role: role,
  });

  if (!result.data) {
    const error = encodeURIComponent(result.error || "framework-activation-failed");
    redirect(`/pm/suppliers/award-approval?error=${error}`);
  }

  refreshAwardPaths();
  redirect(`/pm/suppliers/award-approval?framework=success&cluster=${encodeURIComponent(clusterId)}`);
}
