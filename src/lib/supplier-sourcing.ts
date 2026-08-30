import "server-only";

type LoadResult<T> =
  | { configured: true; data: T; error: null }
  | { configured: false; data: null; error: string }
  | { configured: true; data: null; error: string };

export type SupplierCandidate = {
  id: string;
  procurement_zone_code: string;
  material_group: "CONCRETE_240KSC" | "AGGREGATE" | "STEEL_REINFORCEMENT" | string;
  supplier_name: string;
  plant_location: string | null;
  service_provinces: string[];
  phone: string | null;
  email: string | null;
  line_id: string | null;
  website: string | null;
  source_url: string | null;
  source_kind: string;
  contact_verified_at: string | null;
  contact_status: string;
  commercial_status: string;
  credit_days: number | null;
  deposit_pct: number | null;
  capacity_per_day: number | null;
  lead_time_days: number | null;
  distance_km: number | null;
  quoted_base_rate: number | null;
  estimated_freight: number | null;
  total_delivered_cost: number | null;
  recommendation_status: string;
  priority_rank: number;
  note: string | null;
  award_ready: boolean;
  rfq_missing: string[];
};

export type SupplierZone = {
  id: string;
  zone_code: string;
  zone_name: string;
  hub_province: string;
  provinces: string[];
  forecast_sites: number;
  sourcing_priority: number;
  status: string;
  note: string | null;
  candidate_count: number;
  confirmed_count: number;
  award_ready_count: number;
  concrete_count: number;
  aggregate_count: number;
  steel_count: number;
  candidates: SupplierCandidate[];
};

export type SupplierSourcingOverview = {
  ok: boolean;
  label: string;
  summary: {
    zones: number;
    candidates: number;
    confirmed: number;
    award_ready: number;
    public_contacts: number;
    concrete_candidates: number;
    aggregate_candidates: number;
    steel_candidates: number;
  };
  zones: SupplierZone[];
  sourcing_rule: string;
};

export type ProcurementRfqBid = {
  id: string;
  cluster_id: string;
  supplier_slot: "A" | "B" | "C";
  supplier_name: string | null;
  plant_location: string | null;
  base_rate: number | null;
  freight_per_m3: number | null;
  pump_per_m3: number | null;
  waiting_per_m3: number | null;
  short_load_per_m3: number | null;
  cash_discount_per_m3: number | null;
  volume_rebate_per_m3: number | null;
  schedule_discount_per_m3: number | null;
  other_adjustment_per_m3: number | null;
  capacity_m3_day: number | null;
  lead_time_days: number | null;
  payment_terms: string | null;
  quotation_ref: string | null;
  valid_until: string | null;
  bid_status: "draft" | "rfq_sent" | "quoted" | "confirmed" | "rejected" | string;
  note: string | null;
  effective_delivered_cost: number;
  quote_valid: boolean;
  award_ready: boolean;
  rfq_missing: string[];
};

export type ProcurementRfqCluster = {
  id: string;
  material_group: string;
  cluster_name: string;
  province: string;
  forecast_sites: number;
  forecast_volume_m3: number;
  benchmark_delivered_rate: number;
  target_saving_per_m3: number;
  target_rate: number;
  rfq_status: string;
  awarded_supplier_name: string | null;
  awarded_effective_rate: number | null;
  quoted_count: number;
  confirmed_count: number;
  award_ready_count: number;
  bids: ProcurementRfqBid[];
};

export type ProcurementRfqOverview = {
  ok: boolean;
  label: string;
  summary: {
    clusters: number;
    bid_slots: number;
    rfq_sent: number;
    quoted: number;
    confirmed: number;
    award_ready: number;
  };
  clusters: ProcurementRfqCluster[];
  formula: string;
};

export type SaveProcurementBidInput = {
  cluster_id: string;
  supplier_slot: "A" | "B" | "C";
  supplier_name?: string | null;
  plant_location?: string | null;
  base_rate?: number | null;
  freight_per_m3?: number | null;
  pump_per_m3?: number | null;
  waiting_per_m3?: number | null;
  short_load_per_m3?: number | null;
  cash_discount_per_m3?: number | null;
  volume_rebate_per_m3?: number | null;
  schedule_discount_per_m3?: number | null;
  other_adjustment_per_m3?: number | null;
  capacity_m3_day?: number | null;
  lead_time_days?: number | null;
  payment_terms?: string | null;
  quotation_ref?: string | null;
  valid_until?: string | null;
  bid_status?: "draft" | "rfq_sent" | "quoted" | "confirmed" | "rejected";
  note?: string | null;
  supplier_id?: string | null;
};

const SUPPLIER_API_URL =
  process.env.DRYING_YARD_SUPPLIER_API_URL?.trim() ||
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-supplier-api";

async function postSupplierApi<T>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<LoadResult<T>> {
  const code = process.env.DRYING_YARD_ADMIN_ACCESS_CODE?.trim();

  if (!code) {
    return {
      configured: false,
      data: null,
      error:
        "Set DRYING_YARD_ADMIN_ACCESS_CODE in the server environment. Supplier contacts and PM commercial data are never requested directly from the browser.",
    };
  }

  try {
    const response = await fetch(SUPPLIER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, action, ...payload }),
      cache: "no-store",
    });

    const body = (await response.json()) as T & {
      error?: string;
      detail?: string;
      missing?: string[];
    };

    if (!response.ok) {
      const missing = body.missing?.length ? `: ${body.missing.join(", ")}` : "";
      return {
        configured: true,
        data: null,
        error:
          `${body.detail || body.error || `Supplier sourcing API returned HTTP ${response.status}`}${missing}`,
      };
    }

    return { configured: true, data: body, error: null };
  } catch (error) {
    return {
      configured: true,
      data: null,
      error:
        error instanceof Error ? error.message : "Unable to load supplier sourcing data",
    };
  }
}

export function getSupplierSourcingOverview() {
  return postSupplierApi<SupplierSourcingOverview>("overview");
}

export function getProcurementRfqOverview() {
  return postSupplierApi<ProcurementRfqOverview>("rfq_overview");
}

export function saveProcurementBid(input: SaveProcurementBidInput) {
  return postSupplierApi<{ ok: true; bid: ProcurementRfqBid }>(
    "upsert_bid",
    input as unknown as Record<string, unknown>,
  );
}
