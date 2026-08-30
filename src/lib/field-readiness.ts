import "server-only";

export type ReadinessRole = "EXECUTIVE" | "ADMIN" | "FIELD_LEADER";

export type ReadinessSubmission = {
  id: string;
  request_id: string;
  batch_id: string;
  site_id: string;
  submitted_by_email: string;
  submitted_by_name: string;
  submitted_by_role: ReadinessRole;
  quantity_confirmed: boolean;
  drawing_confirmed: boolean;
  site_condition_confirmed: boolean;
  access_ready: boolean;
  confirmed_area_m2: number | null;
  confirmed_concrete_m3: number | null;
  evidence_ref: string | null;
  note: string | null;
  candidate_ready: boolean;
  submitted_at: string;
  review: ReadinessReview | null;
};

export type ReadinessReview = {
  id: string;
  submission_id: string;
  batch_id: string;
  site_id: string;
  decision: "accepted" | "rejected";
  reviewed_by_email: string;
  reviewed_by_name: string;
  reviewed_by_role: "EXECUTIVE" | "ADMIN";
  review_reason: string;
  reviewed_at: string;
};

export type ReadinessSite = {
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
  readiness_checked_by_email: string | null;
  readiness_checked_at: string | null;
  site_code: string;
  site_status: string;
  metadata: Record<string, unknown>;
  location: {
    province: string | null;
    district: string | null;
    subdistrict: string | null;
    address: string | null;
  } | null;
  latest_submission: ReadinessSubmission | null;
  verified_ready: boolean;
};

export type ReadinessBatch = {
  id: string;
  batch_code: string;
  batch_no: number;
  cluster_id: string;
  province: string;
  planned_site_count: number;
  planned_volume_m3: number;
  planned_start_at: string | null;
  status: string;
  summary: {
    sites: number;
    submitted: number;
    pending_review: number;
    verified_ready: number;
  };
  sites: ReadinessSite[];
};

export type FieldReadinessOverview = {
  ok: boolean;
  label: string;
  viewer_role: ReadinessRole;
  can_review: boolean;
  summary: {
    batches: number;
    sites: number;
    submitted: number;
    pending_review: number;
    verified_ready: number;
  };
  batches: ReadinessBatch[];
  rule: string;
};

export type ReadinessIdentity = {
  actor_user_id: string;
  actor_email: string;
  actor_name: string;
  actor_role: ReadinessRole;
};

export type SubmitReadinessInput = ReadinessIdentity & {
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
  note?: string;
};

export type ReviewReadinessInput = Omit<ReadinessIdentity, "actor_role"> & {
  actor_role: "EXECUTIVE" | "ADMIN";
  request_id: string;
  submission_id: string;
  decision: "accepted" | "rejected";
  review_reason: string;
};

type LoadResult<T> =
  | { configured: true; data: T; error: null }
  | { configured: false; data: null; error: string }
  | { configured: true; data: null; error: string };

const API_URL =
  process.env.DRYING_YARD_READINESS_API_URL?.trim() ||
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-readiness-api";

async function callReadinessApi<T>(
  action: "overview" | "submit" | "review",
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
          `Readiness API returned HTTP ${response.status}`,
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
          : "Unable to load field readiness controls",
    };
  }
}

export function getFieldReadinessOverview(viewerRole: ReadinessRole) {
  return callReadinessApi<FieldReadinessOverview>("overview", {
    viewer_role: viewerRole,
  });
}

export function submitFieldReadiness(input: SubmitReadinessInput) {
  return callReadinessApi<{ ok: boolean; result?: Record<string, unknown> }>(
    "submit",
    input,
  );
}

export function reviewFieldReadiness(input: ReviewReadinessInput) {
  return callReadinessApi<{ ok: boolean; result?: Record<string, unknown> }>(
    "review",
    input,
  );
}
