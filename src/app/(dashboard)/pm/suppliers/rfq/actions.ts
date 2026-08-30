"use server";

import { revalidatePath } from "next/cache";
import { saveProcurementBid, type SaveProcurementBidInput } from "@/lib/supplier-sourcing";

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function numberOrNull(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export async function saveRfqBidAction(formData: FormData) {
  const clusterId = String(formData.get("cluster_id") ?? "").trim();
  const supplierSlot = String(formData.get("supplier_slot") ?? "").trim().toUpperCase();

  if (!clusterId || !["A", "B", "C"].includes(supplierSlot)) {
    throw new Error("Invalid RFQ cluster or supplier slot");
  }

  const input: SaveProcurementBidInput = {
    cluster_id: clusterId,
    supplier_slot: supplierSlot as "A" | "B" | "C",
    supplier_name: text(formData, "supplier_name"),
    plant_location: text(formData, "plant_location"),
    base_rate: numberOrNull(formData, "base_rate"),
    freight_per_m3: numberOrNull(formData, "freight_per_m3"),
    pump_per_m3: numberOrNull(formData, "pump_per_m3"),
    waiting_per_m3: numberOrNull(formData, "waiting_per_m3"),
    short_load_per_m3: numberOrNull(formData, "short_load_per_m3"),
    cash_discount_per_m3: numberOrNull(formData, "cash_discount_per_m3"),
    volume_rebate_per_m3: numberOrNull(formData, "volume_rebate_per_m3"),
    schedule_discount_per_m3: numberOrNull(formData, "schedule_discount_per_m3"),
    other_adjustment_per_m3: numberOrNull(formData, "other_adjustment_per_m3"),
    capacity_m3_day: numberOrNull(formData, "capacity_m3_day"),
    lead_time_days: numberOrNull(formData, "lead_time_days"),
    payment_terms: text(formData, "payment_terms"),
    quotation_ref: text(formData, "quotation_ref"),
    valid_until: text(formData, "valid_until"),
    note: text(formData, "note"),
    bid_status: String(formData.get("bid_status") ?? "draft") as SaveProcurementBidInput["bid_status"],
  };

  const result = await saveProcurementBid(input);
  if (!result.data) {
    throw new Error(result.error || "Unable to save RFQ bid");
  }

  revalidatePath("/pm/suppliers/rfq");
  revalidatePath("/pm/suppliers");
  revalidatePath("/procurement");
}
