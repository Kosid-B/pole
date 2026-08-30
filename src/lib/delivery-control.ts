import "server-only";

export type DeliveryRole = "EXECUTIVE" | "ADMIN" | "FIELD_LEADER";

export type DeliveryReview = {
  id: string;
  submission_id: string;
  decision: "accepted" | "rejected";
  reviewed_by_name: string;
  reviewed_by_email: string;
  reviewed_by_role: "EXECUTIVE" | "ADMIN";
  review_reason: string;
  reviewed_at: string;
};

export type DeliveryReceipt = {
  id: string;
  calloff_id: string;
  batch_id: string;
  site_id: string;
  do_ref: string;
  truck_no: string | null;
  delivered_m3: number;
  accepted_m3: number;
  rejected_m3: number;
  qa_status: "accepted" | "partial" | "rejected";
  slump_mm: number | null;
  concrete_temp_c: number | null;
  cube_sample_ref: string | null;
  evidence_ref: string;
  note: string | null;
  submitted_by_name: string;
  submitted_by_email: string;
  submitted_by_role: DeliveryRole;
  submitted_at: string;
  review: DeliveryReview | null;
};

export type DeliveryCalloff = {
  id: string;
  calloff_ref: string;
  batch_id: string;
  batch_code: string;
  batch_status: string;
  site_id: string;
  site_code: string;
  province: string;
  district: string | null;
  supplier_name: string;
  supplier_role: "primary" | "backup";
  requested_m3: number;
  planned_delivery_at: string;
  status: "confirmed" | "completed" | "cancelled";
  verified_accepted_m3: number;
  verified_rejected_m3: number;
  pending_review: number;
  receipts: DeliveryReceipt[];
  framework_id?: string;
  supplier_bid_id?: string;
  tdc_per_m3_snapshot?: number;
  quotation_ref_snapshot?: string | null;
  payment_terms_snapshot?: string | null;
  gate_snapshot?: Record<string, unknown>;
  created_by_name?: string;
  created_by_email?: string;
  create_reason?: string;
  created_at?: string;
  close_reason?: string | null;
  closed_at?: string | null;
};

export type EligibleSupplier = {
  id: string;
  role: "primary" | "backup";
  supplier_name: string;
  plant_location: string | null;
  valid_until: string | null;
  quotation_ref: string | null;
  payment_terms: string | null;
  tdc_per_m3: number;
};

export type EligibleCalloffSite = {
  batch_id: string;
  batch_code: string;
  batch_status: string;
  cluster_id: string;
  province: string;
  site_id: string;
  site_code: string;
  district: string | null;
  confirmed_concrete_m3: number;
  reserved_or_verified_actual_m3: number;
  remaining_m3: number;
  framework: {
    id: string;
    agreement_no: string;
    calloff_notice_hours: number;
    effective_from: string | null;
    effective_to: string | null;
  };
  suppliers: EligibleSupplier[];
};

export type DeliveryOverview = {
  ok: boolean;
  label: string;
  viewer_role: DeliveryRole;
  can_manage: boolean;
  can_review: boolean;
  summary: {
    calloffs: number;
    open_calloffs: number;
    pending_reviews: number;
    verified_accepted_m3: number;
    verified_rejected_m3: number;
    eligible_sites: number;
  };
  eligible_sites: EligibleCalloffSite[];
  calloffs: DeliveryCalloff[];
  rule: string;
};

export type DeliveryIdentity = {
  actor_user_id: string;
  actor_email: string;
  actor_name: string;
  actor_role: DeliveryRole;
};

type LoadResult<T> =
  | { configured: true; data: T; error: null }
  | { configured: false; data: null; error: string }
  | { configured: true; data: null; error: string };

const API_URL =
  process.env.DRYING_YARD_DELIVERY_API_URL?.trim() ||
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-delivery-api";

async function callDeliveryApi<T>(
  action: "overview" | "create_calloff" | "submit_delivery" | "review_delivery" | "close_calloff",
  payload: Record<string, unknown> = {},
): Promise<LoadResult<T>> {
  const code = process.env.DRYING_YARD_ADMIN_ACCESS_CODE?.trim();
  if (!code) {
    return {
      configured: false,
      data: null,
      error: "Set DRYING_YARD_ADMIN_ACCESS_CODE in the server environment. The access code is never sent to the browser.",
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
        error: body.message || body.detail || body.error || `Delivery API returned HTTP ${response.status}`,
      };
    }
    return { configured: true, data: body, error: null };
  } catch (error) {
    return {
      configured: true,
      data: null,
      error: error instanceof Error ? error.message : "Unable to load delivery controls",
    };
  }
}

export function getDeliveryOverview(viewerRole: DeliveryRole) {
  return callDeliveryApi<DeliveryOverview>("overview", { viewer_role: viewerRole });
}

export function createSupplierCalloff(input: DeliveryIdentity & {
  request_id: string;
  batch_id: string;
  site_id: string;
  supplier_bid_id: string;
  calloff_ref: string;
  requested_m3: number;
  planned_delivery_at: string;
  reason: string;
}) {
  return callDeliveryApi<{ ok: boolean; result?: Record<string, unknown> }>("create_calloff", input);
}

export function submitDeliveryReceipt(input: DeliveryIdentity & {
  request_id: string;
  calloff_id: string;
  do_ref: string;
  truck_no?: string;
  delivered_m3: number;
  accepted_m3: number;
  rejected_m3: number;
  slump_mm?: number | null;
  concrete_temp_c?: number | null;
  cube_sample_ref?: string;
  evidence_ref: string;
  note?: string;
}) {
  return callDeliveryApi<{ ok: boolean; result?: Record<string, unknown> }>("submit_delivery", input);
}

export function reviewDeliveryReceipt(input: Omit<DeliveryIdentity, "actor_role"> & {
  actor_role: "EXECUTIVE" | "ADMIN";
  request_id: string;
  submission_id: string;
  decision: "accepted" | "rejected";
  review_reason: string;
}) {
  return callDeliveryApi<{ ok: boolean; result?: Record<string, unknown> }>("review_delivery", input);
}

export function closeSupplierCalloff(input: Omit<DeliveryIdentity, "actor_role"> & {
  actor_role: "EXECUTIVE" | "ADMIN";
  request_id: string;
  calloff_id: string;
  status: "completed" | "cancelled";
  reason: string;
}) {
  return callDeliveryApi<{ ok: boolean; result?: Record<string, unknown> }>("close_calloff", input);
}
