import "server-only";

export type AwardApprovalBid = {
  id: string;
  cluster_id: string;
  supplier_slot: string;
  supplier_name: string | null;
  plant_location: string | null;
  effective_delivered_cost: number;
  capacity_m3_day: number | null;
  lead_time_days: number | null;
  payment_terms: string | null;
  quotation_ref: string | null;
  valid_until: string | null;
  bid_status: string;
  award_ready: boolean;
  missing: string[];
};

export type AwardApprovalAudit = {
  id: string;
  request_id: string;
  action: "award_approved" | "framework_activated";
  approved_by_email: string;
  approved_by_name: string;
  approved_by_role: "EXECUTIVE" | "ADMIN";
  approval_reason: string;
  primary_supplier_name: string | null;
  backup_supplier_name: string | null;
  primary_tdc_per_m3: number | null;
  backup_tdc_per_m3: number | null;
  forecast_gm: number;
  gm_floor: number;
  min_rolling_cash: number;
  safety_reserve: number;
  confirmed_customer_funding_pct: number;
  created_at: string;
};

export type AwardApprovalFramework = {
  id: string;
  cluster_id: string;
  agreement_no: string | null;
  primary_bid_id: string | null;
  backup_bid_id: string | null;
  primary_share_pct: number;
  backup_share_pct: number;
  effective_from: string | null;
  effective_to: string | null;
  calloff_notice_hours: number;
  rolling_forecast_days: number;
  price_review_trigger_per_m3: number;
  payment_mode: string;
  status: string;
  note: string | null;
  updated_at: string;
};

export type AwardApprovalCluster = {
  id: string;
  cluster_name: string;
  province: string;
  forecast_sites: number;
  forecast_volume_m3: number;
  rfq_status: string;
  awarded_supplier_name: string | null;
  awarded_effective_rate: number | null;
  award_ready_count: number;
  primary_candidate: AwardApprovalBid | null;
  backup_candidate: AwardApprovalBid | null;
  supplier_pair_pass: boolean;
  confirmed_funding_pct: number;
  funding_gate_pass: boolean;
  framework: AwardApprovalFramework | null;
  latest_audit: AwardApprovalAudit | null;
};

export type AwardApprovalOverview = {
  ok: boolean;
  label: string;
  gates: {
    gm: boolean;
    rolling_cash: boolean;
  };
  summary: {
    clusters: number;
    supplier_pair_ready: number;
    cluster_funding_ready: number;
    award_approved: number;
    framework_active: number;
  };
  financial: {
    gm_gate: {
      pass: boolean;
      forecast_gm: number;
      target_gm: number;
      forecast_eac: number;
    };
    cash_gate: {
      pass: boolean;
      min_cash: number;
      safety_reserve: number;
      funding_gap: number;
    };
    triggers: {
      confirmed_customer_direct_funding_pct: number;
    };
  };
  clusters: AwardApprovalCluster[];
  rule: string;
};

export type ApproverIdentity = {
  approved_by_user_id: string;
  approved_by_email: string;
  approved_by_name: string;
  approved_by_role: "EXECUTIVE" | "ADMIN";
};

export type ManualAwardInput = ApproverIdentity & {
  request_id: string;
  cluster_id: string;
  primary_bid_id: string;
  backup_bid_id: string;
  approval_reason: string;
};

export type FrameworkActivationInput = ApproverIdentity & {
  request_id: string;
  cluster_id: string;
  agreement_no: string;
  effective_from: string;
  effective_to?: string;
  approval_reason: string;
};

export type AwardActionResult = {
  ok: boolean;
  result?: Record<string, unknown>;
  snapshot?: Record<string, unknown>;
};

type LoadResult<T> =
  | { configured: true; data: T; error: null }
  | { configured: false; data: null; error: string }
  | { configured: true; data: null; error: string };

const API_URL =
  process.env.DRYING_YARD_AWARD_API_URL?.trim() ||
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-award-api";

async function callAwardApi<T>(
  action: "overview" | "approve_award" | "activate_framework",
  payload: Record<string, unknown> = {},
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
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, action, ...payload }),
      cache: "no-store",
    });

    const body = (await response.json()) as T & {
      error?: string;
      detail?: string;
      message?: string;
    };

    if (!response.ok) {
      return {
        configured: true,
        data: null,
        error:
          body.message ||
          body.detail ||
          body.error ||
          `Award API returned HTTP ${response.status}`,
      };
    }

    return { configured: true, data: body, error: null };
  } catch (error) {
    return {
      configured: true,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unable to load manual award approval controls",
    };
  }
}

export function getAwardApprovalOverview() {
  return callAwardApi<AwardApprovalOverview>("overview");
}

export function approveManualAward(input: ManualAwardInput) {
  return callAwardApi<AwardActionResult>("approve_award", input);
}

export function activateFrameworkAgreement(input: FrameworkActivationInput) {
  return callAwardApi<AwardActionResult>("activate_framework", input);
}

export function getClusterApprovalState(
  cluster: Pick<
    AwardApprovalCluster,
    "supplier_pair_pass" | "funding_gate_pass" | "framework"
  >,
  gates: AwardApprovalOverview["gates"],
) {
  if (cluster.framework?.status === "active") return "FRAMEWORK_ACTIVE" as const;
  if (cluster.framework?.status === "award_approved") return "AWARD_APPROVED" as const;
  if (
    cluster.supplier_pair_pass &&
    cluster.funding_gate_pass &&
    gates.gm &&
    gates.rolling_cash
  ) {
    return "READY_FOR_AWARD" as const;
  }
  return "BLOCKED" as const;
}
