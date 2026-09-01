"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { postSupplierModule } from "@/lib/drying-yard-modules";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return raw == null ? "" : String(raw).trim();
}

function optionalNumber(formData: FormData, key: string) {
  const raw = value(formData, key);
  return raw === "" ? null : Number(raw);
}

function finish(error?: string) {
  revalidatePath("/pm");
  revalidatePath("/pm/suppliers");
  revalidatePath("/procurement");
  redirect(error ? `/pm/suppliers?error=${encodeURIComponent(error)}` : "/pm/suppliers?updated=1");
}

export async function updateSupplierTermsAction(formData: FormData) {
  const supplierId = value(formData, "supplier_id");
  if (!supplierId) finish("Supplier ID missing");

  const result = await postSupplierModule<{ ok: true }>({
    action: "update_supplier",
    supplier_id: supplierId,
    commercial_status: value(formData, "commercial_status") || "unconfirmed",
    recommendation_status: value(formData, "recommendation_status") || "candidate",
    credit_days: optionalNumber(formData, "credit_days"),
    deposit_pct: optionalNumber(formData, "deposit_pct"),
    capacity_per_day: optionalNumber(formData, "capacity_per_day"),
    lead_time_days: optionalNumber(formData, "lead_time_days"),
    distance_km: optionalNumber(formData, "distance_km"),
    quoted_base_rate: optionalNumber(formData, "quoted_base_rate"),
    estimated_freight: optionalNumber(formData, "estimated_freight"),
    total_delivered_cost: optionalNumber(formData, "total_delivered_cost"),
    phone: value(formData, "phone") || null,
    email: value(formData, "email") || null,
    line_id: value(formData, "line_id") || null,
    website: value(formData, "website") || null,
    plant_location: value(formData, "plant_location") || null,
    note: value(formData, "note") || null,
  });

  if (!result.data) finish(result.error || "Unable to update supplier");
  finish();
}

export async function markSupplierRfqSentAction(formData: FormData) {
  const supplierId = value(formData, "supplier_id");
  if (!supplierId) finish("Supplier ID missing");

  const result = await postSupplierModule<{ ok: true }>({
    action: "update_supplier",
    supplier_id: supplierId,
    commercial_status: "rfq_sent",
    recommendation_status: "shortlisted",
  });

  if (!result.data) finish(result.error || "Unable to mark RFQ sent");
  finish();
}
