import "server-only";

export type BatchActorIdentity = {
  actor_user_id: string;
  actor_email: string;
  actor_name: string;
  actor_role: "EXECUTIVE" | "ADMIN";
};

export type BatchSite = {
  id: string;
  batch_id: string;
  site_id: string;
  sequence_no: number;
  readiness_status: string;
  quantity_confirmed: boolean;
  drawing_confirmed: boolean;
  site_condition_confirmed: boolean;
  access_ready: boolean;
  confirmed_area_m2: number | null;
  confirmed_concrete_m3: number | null;
  evidence_ref: string | null;
  readiness_note: string | null;
  site_code: string;
  site_status: string;
  ready: boolean;
  location: {
    province: string | null;
    district: string | null;
    subdistrict: string | null;
    address: string | null;
  } | null;
};

export type BatchFinancialGate = {
  gm_pass: boolean;
  forecast_gm: number;
  gm_floor: number;
  cash_pass: boolean;
  min_cash: number;
  safety_reserve: number;
  commitment_pass: boolean;
  four_week_collectible_cash: number;
  four_week_confirmed_commitments: number;
  four_week_coverage_after_reserve: number;
};

export type BatchRelease = {
  id: string;
  project_id: string;
  cluster_id: string;
  batch_no: number;
  batch_code: string;
  province: string;
  planned_site_count: number;
  planned_volume_m3: number;
  planned_start_at: string | null;
  status: string;
  released_at: string | null;
  sites: BatchSite[];
  site_gate: {
    pass: boolean;
    ready_sites: number;
    total_sites: number;
    confirmed_volume_m3: number;
  };
  procurement_gate: {
    pass: boolean;
    framework: Record<string, unknown> | null;
    primary: Record<string, unknown> | null;
    backup: Record<string, unknown> | null;
  };
  capacity_gate: {
    pass: boolean;
    weighted_capacity_m3_day: number;
    required_daily_m3: number;
    volume_source: "confirmed" | "planned";
    max_lead_time_days: number;
  };
  funding_gate: {
    pass: boolean;
    confirmed_funding_pct: number;
    funding: Array<Record<string, unknown>>;
  };
  schedule_gate: {
    pass: boolean;
    notice_pass: boolean;
    lead_time_pass: boolean;
    forecast_pass: boolean;
    effective_period_pass: boolean;
    calloff_notice_hours: number;
    rolling_forecast_days: number;
  };
  financial_gate: BatchFinancialGate;
  release_ready: boolean;
  blockers: string[];
  latest_audit: Record<string, unknown> | null;
};

export type BatchReleaseOverview = {
  ok: boolean;
  label: string;
  financial_gate: BatchFinancialGate;
  summary: {
    batches: number;
    released: number;
    release_ready: number;
    site_ready: number;
    procurement_ready: number;
    funding_ready: number;
    total_sites: number;
  };
  batches: BatchRelease[];
  rule: string;
};

export type BatchScheduleInput = BatchActorIdentity & {
  request_id: string;
  batch_id: string;
  planned_start_at: string;
  reason: string;
};

export type BatchSiteReadinessInput = BatchActorIdentity & {
  request_id: string;
  batch_id: string;
  site_id: string;
  quantity_confirmed: boolean;
  drawing_confirmed: boolean;
  site_condition_confirmed: boolean;
  access_ready: boolean;
  confirmed_area_m2?: number | null;
  confirmed_concrete_m3?: number | null;
  evidence_ref?: string;
  readiness_note?: string;
  reason: string;
};

export type BatchReleaseInput = BatchActorIdentity & {
  request_id: string;
  batch_id: string;
  reason: string;
};

type LoadResult<T> =
  | { configured: true; data: T; error: null }
  | { configured: false; data: null; error: string }
  | { configured: true; data: null; error: string };

const API_URL =
  process.env.DRYING_YARD_BATCH_API_URL?.trim() ||
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-batch-api";

async function callBatchApi<T>(
  action: "overview" | "set_schedule" | "set_site_readiness" | "release_batch",
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
      blockers?: string[];
    };
    if (!response.ok) {
      const blockerText = body.blockers?.length
        ? `: ${body.blockers.join(" • ")}`
        : "";
      return {
        configured: true,
        data: null,
        error:
          (body.message || body.detail || body.error ||
            `Batch API returned HTTP ${response.status}`) + blockerText,
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
          : "Unable to load rolling batch release controls",
    };
  }
}

export function getBatchReleaseOverview() {
  return callBatchApi<BatchReleaseOverview>("overview");
}

export function setBatchSchedule(input: BatchScheduleInput) {
  return callBatchApi<{ ok: boolean; result?: Record<string, unknown> }>(
    "set_schedule",
    input,
  );
}

export function setBatchSiteReadiness(input: BatchSiteReadinessInput) {
  return callBatchApi<{ ok: boolean; result?: Record<string, unknown> }>(
    "set_site_readiness",
    input,
  );
}

export function releaseBatch(input: BatchReleaseInput) {
  return callBatchApi<{ ok: boolean; result?: Record<string, unknown> }>(
    "release_batch",
    input,
  );
}
