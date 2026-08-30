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

export function getCommercialOverview() {
  return loadAdminModule<CommercialOverview>(COMMERCIAL_API_URL, "overview");
}

export function getPmOverview() {
  return loadAdminModule<PmOverview>(PM_API_URL, "overview");
}

export function getProcurementOverview() {
  return loadAdminModule<ProcurementOverview>(PM_API_URL, "procurement_overview");
}

export function getCustomerProposalLink() {
  return loadAdminModule<CustomerProposalLink>(PROPOSAL_LINK_API_URL);
}
