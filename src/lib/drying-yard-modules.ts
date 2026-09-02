import "server-only";

import { cookies } from "next/headers";
import { SUPABASE_ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth";
import { getSiteCostProjectContext } from "@/lib/project-context";
import {
  resolveSelectedModuleProject,
  type SiteCostModuleCode,
} from "@/lib/project-module-scope";

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
  project_id?: string;
  auth_mode?: "legacy" | "supabase";
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
  project_id?: string;
  auth_mode?: "legacy" | "supabase";
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
  project_id?: string;
  auth_mode?: "legacy" | "supabase";
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

async function postModule<T>(
  apiUrl: string,
  body: Record<string, string>,
  headers: Headers,
): Promise<LoadResult<T>> {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | (T & { error?: string; detail?: string })
      | null;

    if (!response.ok || !payload) {
      return {
        configured: true,
        data: null,
        error:
          payload?.detail ||
          payload?.error ||
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

async function loadProjectScopedAdminModule<T>(
  apiUrl: string,
  action: string,
  requiredModule: SiteCostModuleCode,
): Promise<LoadResult<T>> {
  const projectContext = await getSiteCostProjectContext();

  if (!projectContext.configured) {
    return {
      configured: false,
      data: null,
      error: projectContext.error,
    };
  }

  if (!projectContext.data) {
    return {
      configured: true,
      data: null,
      error: projectContext.error,
    };
  }

  const scope = resolveSelectedModuleProject(projectContext.data, requiredModule);

  if (!scope.ok) {
    return {
      configured: true,
      data: null,
      error: scope.error,
    };
  }

  const headers = new Headers({ "Content-Type": "application/json" });
  const body: Record<string, string> = {
    action,
    project_id: scope.project.id,
  };

  if (projectContext.data.auth_mode === "supabase") {
    const cookieStore = await cookies();
    const accessToken = cookieStore
      .get(SUPABASE_ACCESS_TOKEN_COOKIE_NAME)
      ?.value?.trim();

    if (!accessToken) {
      return {
        configured: true,
        data: null,
        error: "SUPABASE_SESSION_REQUIRED",
      };
    }

    headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    const code = process.env.DRYING_YARD_ADMIN_ACCESS_CODE?.trim();

    if (!code) {
      return {
        configured: false,
        data: null,
        error:
          "Set DRYING_YARD_ADMIN_ACCESS_CODE in the server environment. The access code is never sent to the browser.",
      };
    }

    body.code = code;
  }

  return postModule<T>(apiUrl, body, headers);
}

async function loadLegacyAdminModule<T>(
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

  const body: Record<string, string> = { code };
  if (action) body.action = action;

  return postModule<T>(
    apiUrl,
    body,
    new Headers({ "Content-Type": "application/json" }),
  );
}

export function getCommercialOverview() {
  return loadProjectScopedAdminModule<CommercialOverview>(
    COMMERCIAL_API_URL,
    "overview",
    "commercial",
  );
}

export function getPmOverview() {
  return loadProjectScopedAdminModule<PmOverview>(PM_API_URL, "overview", "pm");
}

export function getProcurementOverview() {
  return loadProjectScopedAdminModule<ProcurementOverview>(
    PM_API_URL,
    "procurement_overview",
    "procurement",
  );
}

export function getCustomerProposalLink() {
  return loadLegacyAdminModule<CustomerProposalLink>(PROPOSAL_LINK_API_URL);
}
