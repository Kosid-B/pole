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

const SUPPLIER_API_URL =
  process.env.DRYING_YARD_SUPPLIER_API_URL?.trim() ||
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-supplier-api";

export async function getSupplierSourcingOverview(): Promise<LoadResult<SupplierSourcingOverview>> {
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
      body: JSON.stringify({ code, action: "overview" }),
      cache: "no-store",
    });

    const payload = (await response.json()) as SupplierSourcingOverview & {
      error?: string;
      detail?: string;
    };

    if (!response.ok) {
      return {
        configured: true,
        data: null,
        error:
          payload.detail ||
          payload.error ||
          `Supplier sourcing API returned HTTP ${response.status}`,
      };
    }

    return { configured: true, data: payload, error: null };
  } catch (error) {
    return {
      configured: true,
      data: null,
      error:
        error instanceof Error ? error.message : "Unable to load supplier sourcing data",
    };
  }
}
