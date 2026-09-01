import "server-only";

type LoadResult<T> =
  | { configured: true; data: T; error: null }
  | { configured: false; data: null; error: string }
  | { configured: true; data: null; error: string };

export type CommercialReferencePrice = {
  catalog_version: string;
  installation_type: "G63" | "G64";
  area_m2: 120 | 192 | 252;
  tier: "A" | "B" | "C";
  reference_price_vat: number;
  approved_for_quote: boolean;
  source_type: string;
  source_note: string | null;
};

export type CommercialOverview = {
  ok: boolean;
  label: string;
  summary: {
    site_count: number;
    quote_count: number;
    published_quotes: number;
    total_quote_vat: number;
    gross_margin: number;
    vat_rate: number;
  };
  g_summary: Array<{
    installation_type: "G63" | "G64";
    site_count: number;
    total_price_vat: number;
    avg_price_vat: number;
  }>;
  tier_summary: Array<{
    tier: "A" | "B" | "C";
    site_count: number;
    concrete_unit_cost: number;
    total_price_vat: number;
    avg_price_vat: number;
  }>;
  province_summary: Array<{
    province: string;
    site_count: number;
    district_count: number;
    total_price_vat: number;
    avg_price_vat: number;
    avg_concrete_unit_cost: number;
  }>;
  size_catalog: Array<{
    code: string;
    name: string;
    width_m: number;
    length_m: number;
    area_m2: number;
  }>;
  package_catalog: Array<{
    installation_type: "G63" | "G64";
    display_name: string;
    components: string[];
    pole_type: string | null;
    pole_qty: number;
  }>;
  reference_catalog: {
    catalog_version: string | null;
    approved_for_quote: boolean;
    rows: CommercialReferencePrice[];
  };
  source_note: string;
};

export type PmOverview = {
  ok: boolean;
  totals: {
    cost: number;
    sale: number;
    gp: number;
    vat: number;
    final: number;
    concrete: number;
    gm: number;
  };
  quote_summary: {
    count: number;
    published_count: number;
    value_vat: number;
  };
  settings: {
    contract_mode: "unknown" | "private" | "public_procurement";
    advance_target_pct: number;
    client_payment_lag_days: number;
    claim_cycle_days: number;
    retention_pct: number;
    supplier_credit_days_default: number;
    safety_buffer_pct: number;
    batch_size_sites: number;
    batch_start_interval_days: number;
  } | null;
  packages: Array<{
    package_code: string;
    package_name: string;
    budget_amount: number;
    material_amount: number;
    labor_service_amount: number;
    planned_work_week: number;
    supplier_name?: string | null;
    po_no?: string | null;
    supplier_credit_days?: number | null;
    deposit_pct?: number | null;
    actual_committed_amount?: number | null;
    actual_paid_amount?: number | null;
    status?: string | null;
  }>;
};

export type ProcurementBid = {
  id: string;
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
  bid_status: string | null;
  effective_delivered_cost: number;
};

export type ProcurementOverview = {
  ok: boolean;
  summary: {
    clusters: number;
    sites: number;
    volume: number;
    target_saving: number;
    awarded_clusters: number;
    awarded_volume: number;
    awarded_saving: number;
    coverage_pct: number;
    weighted_awarded_saving_per_m3: number;
  };
  clusters: Array<{
    id: string;
    material_group: string;
    cluster_name: string;
    province: string;
    forecast_sites: number;
    forecast_volume_m3: number;
    benchmark_delivered_rate: number;
    target_saving_per_m3: number;
    target_rate: number;
    target_saving_total: number;
    customer_payment_mode: string | null;
    customer_funded_pct: number | null;
    rfq_status: string | null;
    awarded_supplier_name: string | null;
    awarded_effective_rate: number | null;
    awarded_saving_per_m3: number;
    awarded_saving_total: number;
    primary_share_pct: number | null;
    backup_share_pct: number | null;
    forecast_window_days: number | null;
    calloff_notice_hours: number | null;
    bids: ProcurementBid[];
    agreement: {
      agreement_no: string | null;
      primary_share_pct: number | null;
      backup_share_pct: number | null;
      payment_mode: string | null;
      status: string | null;
    } | null;
    funding: {
      funding_mode: string | null;
      funded_pct: number | null;
      payment_trigger: string | null;
      settlement_days: number | null;
      approved_ceiling: number | null;
      status: string | null;
    } | null;
  }>;
};

export type SupplierCandidate = {
  id: string;
  procurement_zone_code: string;
  material_group: "CONCRETE_240KSC" | "AGGREGATE" | "STEEL_REINFORCEMENT" | string;
  supplier_name: string;
  plant_location: string | null;
  service_provinces: string[] | null;
  phone: string | null;
  email: string | null;
  line_id: string | null;
  website: string | null;
  source_url: string | null;
  source_kind: string | null;
  contact_verified_at: string | null;
  contact_status: string | null;
  commercial_status: "unconfirmed" | "rfq_sent" | "quoted" | "confirmed" | "rejected" | string;
  credit_days: number | null;
  deposit_pct: number | null;
  capacity_per_day: number | null;
  lead_time_days: number | null;
  distance_km: number | null;
  quoted_base_rate: number | null;
  estimated_freight: number | null;
  total_delivered_cost: number | null;
  recommendation_status: string | null;
  priority_rank: number | null;
  note: string | null;
  updated_at: string | null;
  award_ready: boolean;
  rfq_missing: string[];
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
  zones: Array<{
    id: string;
    zone_code: string;
    zone_name: string;
    hub_province: string | null;
    provinces: string[];
    forecast_sites: number;
    sourcing_priority: number;
    status: string | null;
    note: string | null;
    updated_at: string | null;
    candidates: SupplierCandidate[];
    candidate_count: number;
    confirmed_count: number;
    award_ready_count: number;
    concrete_count: number;
    aggregate_count: number;
    steel_count: number;
  }>;
  sourcing_rule: string;
};

export type CustomerProposalLink = {
  ok: boolean;
  proposal_no: string;
  version_no: string;
  status: string;
  url: string;
  updated_at: string;
};

const COMMERCIAL_API_URL =
  process.env.DRYING_YARD_COMMERCIAL_API_URL?.trim() ||
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-commercial-api";

const PM_API_URL =
  process.env.DRYING_YARD_PM_API_URL?.trim() ||
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-pm-api";

const SUPPLIER_API_URL =
  process.env.DRYING_YARD_SUPPLIER_API_URL?.trim() ||
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-supplier-api";

const PROPOSAL_LINK_API_URL =
  process.env.DRYING_YARD_PROPOSAL_LINK_API_URL?.trim() ||
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-proposal-link-api";

async function loadAdminModule<T>(
  apiUrl: string,
  action?: string,
): Promise<LoadResult<T>> {
  const code = process.env.DRYING_YARD_ADMIN_ACCESS_CODE?.trim();

  if (!code) {
    return {
      configured: false,
      data: null,
      error:
        "Set DRYING_YARD_ADMIN_ACCESS_CODE in the server environment. The access code is never sent to the browser.",
    };
  }

  try {
    const body = action ? { code, action } : { code };
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = (await response.json()) as T & {
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
          `Drying-yard module returned HTTP ${response.status}`,
      };
    }

    return { configured: true, data: payload, error: null };
  } catch (error) {
    return {
      configured: true,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unable to load drying-yard module data",
    };
  }
}

export async function postSupplierModule<T>(
  body: Record<string, unknown>,
): Promise<LoadResult<T>> {
  const code = process.env.DRYING_YARD_ADMIN_ACCESS_CODE?.trim();

  if (!code) {
    return {
      configured: false,
      data: null,
      error: "Set DRYING_YARD_ADMIN_ACCESS_CODE in the server environment.",
    };
  }

  try {
    const response = await fetch(SUPPLIER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, ...body }),
      cache: "no-store",
    });
    const payload = (await response.json()) as T & { error?: string; detail?: string };
    if (!response.ok) {
      return {
        configured: true,
        data: null,
        error: payload.detail || payload.error || `Supplier module returned HTTP ${response.status}`,
      };
    }
    return { configured: true, data: payload, error: null };
  } catch (error) {
    return {
      configured: true,
      data: null,
      error: error instanceof Error ? error.message : "Unable to update supplier module",
    };
  }
}

export function getCommercialOverview() {
  return loadAdminModule<CommercialOverview>(COMMERCIAL_API_URL, "overview");
}

export function getPmOverview() {
  return loadAdminModule<PmOverview>(PM_API_URL, "overview");
}

export function getProcurementOverview() {
  return loadAdminModule<ProcurementOverview>(PM_API_URL, "procurement_overview");
}

export function getSupplierSourcingOverview() {
  return loadAdminModule<SupplierSourcingOverview>(SUPPLIER_API_URL, "overview");
}

export function getCustomerProposalLink() {
  return loadAdminModule<CustomerProposalLink>(PROPOSAL_LINK_API_URL);
}
