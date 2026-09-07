import "server-only";

type LoadResult<T> =
  | { configured: true; data: T; error: null }
  | { configured: false; data: null; error: string }
  | { configured: true; data: null; error: string };

export type DynamicGmAdvice = {
  recommended_gm: number;
  financial_risk_tier: "CONTROLLED" | "MEDIUM" | "HIGH" | "CRITICAL";
  dynamic_gm_gate: string;
  confirmed_quotes: number;
  confirmed_quote_groups: number;
  min_quotes: number;
  modeled_safety_reserve: number | null;
  recommended_selling_price_pre_vat: number | null;
};

export type GmSensitivityRow = {
  scope_type: "PROJECT" | "PROVINCE";
  scope_name: string;
  source_ref: string;
  source_date: string | null;
  gm: number;
  implied_cost_pre_vat: number;
  selling_price_pre_vat: number;
  selling_price_vat: number;
  gross_profit_pre_vat: number;
  cost_overrun_buffer_pct_of_cost: number;
  break_even_overrun_amount: number;
  modeled_advance_cash_vat: number;
  modeled_safety_reserve: number;
  modeled_funding_gap_days: number;
  evidence_status: string;
};

export type SiteCostSummary = {
  project_id: string;
  site_id: string;
  site_code: string;
  installation_type: string;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  material_cost: number;
  freight_cost: number;
  equipment_cost: number;
  labor_cost: number;
  total_site_cost: number;
  final_price_vat: number | null;
  selling_price_pre_vat: number | null;
  target_gross_margin: number | null;
  unconfirmed_cost_lines: number;
  gross_margin: number | null;
  cost_confirmation_status: string;
  commercial_gate: string;
  dynamic_gm?: DynamicGmAdvice | null;
};

export type SiteMaterialCost = {
  id: string;
  item_code: string;
  material_group: string;
  item_name: string;
  qty: number;
  unit: string;
  unit_price: number | null;
  surcharge_amount: number;
  discount_amount: number;
  pricing_status: string;
  valid_until: string | null;
  evidence_ref: string | null;
  supplier_quote_id: string | null;
};

export type SiteRateCost = {
  id: string;
  labor_code?: string | null;
  labor_name?: string;
  equipment_code?: string | null;
  equipment_name?: string;
  qty: number;
  unit: string;
  unit_rate: number | null;
  mobilization_amount?: number;
  demobilization_amount?: number;
  pricing_status: string;
  valid_until: string | null;
  evidence_ref: string | null;
};

export type SiteSupplier = {
  id: string;
  material_group: string;
  supplier_name: string;
  plant_location: string | null;
  commercial_status: string;
  procurement_zone_code: string;
};

export type SiteCostOverview = {
  ok: true;
  label: string;
  summary: { sites: number; go: number; hold: number; confirmed: number; unconfirmed: number; dynamic_review_eligible?: number };
  sites: SiteCostSummary[];
  rule: string;
};

export type SiteCostDetail = {
  ok: true;
  summary: SiteCostSummary;
  dynamic_gm: DynamicGmAdvice | null;
  materials: SiteMaterialCost[];
  freight: Array<Record<string, unknown>>;
  equipment: SiteRateCost[];
  labor: SiteRateCost[];
  suppliers: SiteSupplier[];
};

const SITE_COST_API_URL =
  process.env.DRYING_YARD_SITE_COST_API_URL?.trim() ||
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-site-cost-api";

async function postSiteCostApi<T>(action: string, payload: Record<string, unknown> = {}): Promise<LoadResult<T>> {
  const code = process.env.DRYING_YARD_ADMIN_ACCESS_CODE?.trim();
  if (!code) {
    return {
      configured: false,
      data: null,
      error: "Set DRYING_YARD_ADMIN_ACCESS_CODE in the server environment. Site cost data is never requested directly from the browser.",
    };
  }

  try {
    const response = await fetch(SITE_COST_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, action, ...payload }),
      cache: "no-store",
    });
    const body = (await response.json()) as T & { error?: string; detail?: string };
    if (!response.ok) {
      return {
        configured: true,
        data: null,
        error: body.detail || body.error || `Site cost API returned HTTP ${response.status}`,
      };
    }
    return { configured: true, data: body, error: null };
  } catch (error) {
    return {
      configured: true,
      data: null,
      error: error instanceof Error ? error.message : "Unable to load site cost RFQ data",
    };
  }
}

export function getSiteCostOverview() {
  return postSiteCostApi<SiteCostOverview>("overview");
}

export function getSiteCostDetail(siteId: string) {
  return postSiteCostApi<SiteCostDetail>("site_detail", { site_id: siteId });
}

export function getGmSensitivity(scopeName?: string) {
  return postSiteCostApi<{ ok: true; scenarios: GmSensitivityRow[]; rule: string }>("gm_sensitivity", scopeName ? { scope_name: scopeName } : {});
}

export function applySiteMaterialQuote(payload: Record<string, unknown>) {
  return postSiteCostApi<{ ok: true; quote_id: string; updated_material_lines: number; freight_id: string | null; summary: SiteCostSummary }>("apply_material_quote", payload);
}

export function applySiteRateBatch(payload: Record<string, unknown>) {
  return postSiteCostApi<{ ok: true; rate_type: string; updated_lines: number; summary: SiteCostSummary }>("apply_rate_batch", payload);
}
