"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { submitDeliveryReceipt, type DeliveryRole } from "@/lib/delivery-control";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function requiredNumber(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) ? value : NaN;
}

function optionalNumber(formData: FormData, key: string) {
  const raw = text(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function refresh() {
  revalidatePath("/field-deliveries");
  revalidatePath("/pm/calloffs");
  revalidatePath("/pm");
}

export async function submitDeliveryAction(formData: FormData) {
  const session = await requireSession();
  const role = session.user.role as DeliveryRole;
  if (!["EXECUTIVE", "ADMIN", "FIELD_LEADER"].includes(role)) {
    redirect("/field-deliveries?error=submitter-role-blocked");
  }

  const requestId = text(formData, "request_id");
  const calloffId = text(formData, "calloff_id");
  const doRef = text(formData, "do_ref");
  const evidenceRef = text(formData, "evidence_ref");
  const deliveredM3 = requiredNumber(formData, "delivered_m3");
  const acceptedM3 = requiredNumber(formData, "accepted_m3");
  const rejectedM3 = requiredNumber(formData, "rejected_m3");
  const reconciles =
    Number.isFinite(deliveredM3) &&
    Number.isFinite(acceptedM3) &&
    Number.isFinite(rejectedM3) &&
    deliveredM3 > 0 &&
    acceptedM3 >= 0 &&
    rejectedM3 >= 0 &&
    Math.abs(deliveredM3 - acceptedM3 - rejectedM3) <= 0.01;

  if (!requestId || !calloffId || !doRef || !evidenceRef || !reconciles) {
    redirect("/field-deliveries?error=delivery-form-incomplete");
  }

  const result = await submitDeliveryReceipt({
    request_id: requestId,
    calloff_id: calloffId,
    do_ref: doRef,
    truck_no: text(formData, "truck_no"),
    delivered_m3: deliveredM3,
    accepted_m3: acceptedM3,
    rejected_m3: rejectedM3,
    slump_mm: optionalNumber(formData, "slump_mm"),
    concrete_temp_c: optionalNumber(formData, "concrete_temp_c"),
    cube_sample_ref: text(formData, "cube_sample_ref"),
    evidence_ref: evidenceRef,
    note: text(formData, "note"),
    actor_user_id: session.user.id,
    actor_email: session.user.email,
    actor_name: session.user.name,
    actor_role: role,
  });

  if (!result.data) {
    redirect(`/field-deliveries?error=${encodeURIComponent(result.error || "delivery-submit-failed")}`);
  }

  refresh();
  redirect("/field-deliveries?submitted=success");
}
