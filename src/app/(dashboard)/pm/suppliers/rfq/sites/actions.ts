"use server";

import { revalidatePath } from "next/cache";
import { applySiteMaterialQuote, applySiteRateBatch } from "@/lib/site-cost-rfq";

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

function materialLinesFromForm(formData: FormData) {
  const lines: Array<Record<string, unknown>> = [];
  for (const [key, rawValue] of formData.entries()) {
    if (!key.startsWith("unit_price__")) continue;
    const materialCostId = key.slice("unit_price__".length);
    const raw = String(rawValue ?? "").trim();
    if (!raw) continue;
    const unitPrice = Number(raw);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error(`Invalid unit price for ${materialCostId}`);
    }
    lines.push({
      material_cost_id: materialCostId,
      unit_price: unitPrice,
      surcharge_amount: numberOrNull(formData, `surcharge__${materialCostId}`) ?? 0,
      discount_amount: numberOrNull(formData, `discount__${materialCostId}`) ?? 0,
    });
  }
  return lines;
}

function rateLinesFromForm(formData: FormData, rateType: "labor" | "equipment") {
  const lines: Array<Record<string, unknown>> = [];
  for (const [key, rawValue] of formData.entries()) {
    if (!key.startsWith("unit_rate__")) continue;
    const costId = key.slice("unit_rate__".length);
    const raw = String(rawValue ?? "").trim();
    if (!raw) continue;
    const unitRate = Number(raw);
    if (!Number.isFinite(unitRate) || unitRate <= 0) {
      throw new Error(`Invalid unit rate for ${costId}`);
    }
    const line: Record<string, unknown> = { cost_id: costId, unit_rate: unitRate };
    if (rateType === "equipment") {
      line.mobilization_amount = numberOrNull(formData, `mobilization__${costId}`) ?? 0;
      line.demobilization_amount = numberOrNull(formData, `demobilization__${costId}`) ?? 0;
    }
    lines.push(line);
  }
  return lines;
}

export async function saveSiteMaterialQuoteAction(formData: FormData) {
  const siteId = String(formData.get("site_id") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const materialGroup = String(formData.get("material_group") ?? "").trim();
  const quotationRef = String(formData.get("quotation_ref") ?? "").trim();
  const validUntil = String(formData.get("valid_until") ?? "").trim();
  if (!siteId || !supplierId || !materialGroup || !quotationRef || !validUntil) {
    throw new Error("Site, supplier, material group, quotation ref and valid until are required");
  }

  const lines = materialLinesFromForm(formData);
  if (!lines.length) throw new Error("Enter at least one material unit price");

  const freightAmount = numberOrNull(formData, "freight_amount");
  const freight = freightAmount === null ? null : {
    amount: freightAmount,
    origin_name: text(formData, "freight_origin"),
    distance_km: numberOrNull(formData, "freight_distance_km"),
    vehicle_type: text(formData, "freight_vehicle_type"),
  };

  const result = await applySiteMaterialQuote({
    site_id: siteId,
    supplier_id: supplierId,
    material_group: materialGroup,
    quotation_ref: quotationRef,
    quoted_at: text(formData, "quoted_at"),
    valid_until: validUntil,
    payment_terms: text(formData, "payment_terms"),
    evidence_ref: text(formData, "evidence_ref") || quotationRef,
    lines,
    freight,
  });
  if (!result.data) throw new Error(result.error || "Unable to apply site material quote");
  revalidatePath(`/pm/suppliers/rfq/sites?site_id=${siteId}`);
  revalidatePath("/pm/suppliers/rfq/sites");
}

export async function saveSiteRateBatchAction(formData: FormData) {
  const siteId = String(formData.get("site_id") ?? "").trim();
  const rateType = String(formData.get("rate_type") ?? "").trim() as "labor" | "equipment";
  const evidenceRef = String(formData.get("evidence_ref") ?? "").trim();
  const validUntil = String(formData.get("valid_until") ?? "").trim();
  if (!siteId || !["labor", "equipment"].includes(rateType) || !evidenceRef || !validUntil) {
    throw new Error("Site, rate type, evidence ref and valid until are required");
  }
  const lines = rateLinesFromForm(formData, rateType);
  if (!lines.length) throw new Error("Enter at least one unit rate");

  const result = await applySiteRateBatch({
    site_id: siteId,
    rate_type: rateType,
    evidence_ref: evidenceRef,
    valid_until: validUntil,
    lines,
  });
  if (!result.data) throw new Error(result.error || "Unable to apply site rate batch");
  revalidatePath(`/pm/suppliers/rfq/sites?site_id=${siteId}`);
  revalidatePath("/pm/suppliers/rfq/sites");
}

export async function importSiteMaterialCsvAction(formData: FormData) {
  const siteId = String(formData.get("site_id") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const materialGroup = String(formData.get("material_group") ?? "").trim();
  const quotationRef = String(formData.get("quotation_ref") ?? "").trim();
  const validUntil = String(formData.get("valid_until") ?? "").trim();
  const csv = String(formData.get("csv_text") ?? "").trim();
  if (!siteId || !supplierId || !materialGroup || !quotationRef || !validUntil || !csv) {
    throw new Error("Site, supplier, material group, quotation ref, valid until and CSV are required");
  }

  const rows = csv.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
  const lines: Array<Record<string, unknown>> = [];
  for (const row of rows) {
    if (/^material_cost_id\s*,/i.test(row)) continue;
    const [materialCostId, unitPriceRaw, surchargeRaw = "0", discountRaw = "0"] = row.split(",").map((x) => x.trim());
    const unitPrice = Number(unitPriceRaw);
    const surcharge = Number(surchargeRaw || 0);
    const discount = Number(discountRaw || 0);
    if (!materialCostId || !Number.isFinite(unitPrice) || unitPrice <= 0 || !Number.isFinite(surcharge) || surcharge < 0 || !Number.isFinite(discount) || discount < 0) {
      throw new Error(`Invalid CSV row: ${row}`);
    }
    lines.push({ material_cost_id: materialCostId, unit_price: unitPrice, surcharge_amount: surcharge, discount_amount: discount });
  }
  if (!lines.length) throw new Error("CSV contains no valid material rows");

  const result = await applySiteMaterialQuote({
    site_id: siteId,
    supplier_id: supplierId,
    material_group: materialGroup,
    quotation_ref: quotationRef,
    quoted_at: text(formData, "quoted_at"),
    valid_until: validUntil,
    payment_terms: text(formData, "payment_terms"),
    evidence_ref: text(formData, "evidence_ref") || quotationRef,
    lines,
  });
  if (!result.data) throw new Error(result.error || "Unable to import site material CSV");
  revalidatePath(`/pm/suppliers/rfq/sites?site_id=${siteId}`);
  revalidatePath("/pm/suppliers/rfq/sites");
}
