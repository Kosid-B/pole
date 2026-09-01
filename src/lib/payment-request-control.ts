import "server-only";

export type PaymentRequestRole = "EXECUTIVE" | "ADMIN";

export type PaymentEligibleInvoice = {
  id: string;
  project_id: string;
  supplier_bid_id: string;
  supplier_name_snapshot: string;
  invoice_ref: string;
  invoice_date: string;
  net_amount: number;
  vat_amount: number;
  gross_amount: number;
  evidence_ref: string;
  submitted_at: string;
};

export type PaymentRequestReview = {
  id: string;
  decision: "cash_reserved" | "rejected";
  financial_gate_pass: boolean;
  financial_snapshot: Record<string, unknown>;
  review_reason: string;
  reviewed_by_name: string;
  reviewed_by_email: string;
  reviewed_by_role: "EXECUTIVE";
  reviewed_at: string;
};

export type SupplierPaymentRequest = {
  id: string;
  project_id: string;
  invoice_id: string;
  supplier_bid_id: string;
  supplier_name_snapshot: string;
  invoice_ref_snapshot: string;
  requested_gross_amount: number;
  currency: "THB";
  due_date: string;
  evidence_ref: string;
  request_reason: string;
  status: "pending_approval" | "cash_reserved" | "rejected";
  submitted_by_name: string;
  submitted_by_email: string;
  submitted_by_role: PaymentRequestRole;
  submitted_at: string;
  review: PaymentRequestReview | null;
};

export type PaymentRequestOverview = {
  ok: boolean;
  label: string;
  viewer_role: PaymentRequestRole;
  can_submit: boolean;
  can_review: boolean;
  financial_gate: {
    gm_pass: boolean;
    forecast_gm: number;
    gm_floor: number;
    live_min_cash: number;
    existing_cash_reserved: number;
    available_cash_buffer: number;
    safety_reserve: number;
  };
  summary: {
    eligible_invoices: number;
    requests: number;
    pending_approval: number;
    cash_reserved: number;
    rejected: number;
    reserved_gross: number;
  };
  eligible_invoices: PaymentEligibleInvoice[];
  requests: SupplierPaymentRequest[];
  rule: string;
};

export type PaymentRequestIdentity = {
  actor_user_id: string;
  actor_email: string;
  actor_name: string;
  actor_role: PaymentRequestRole;
};

type LoadResult<T> =
  | { configured: true; data: T; error: null }
  | { configured: false; data: null; error: string }
  | { configured: true; data: null; error: string };

const API_URL =
  process.env.DRYING_YARD_PAYMENT_REQUEST_API_URL?.trim() ||
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-payment-request-api";

async function callPaymentRequestApi<T>(
  action: "overview" | "submit_request" | "review_request",
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
    const body = (await response.json()) as T & { error?: string; detail?: string; message?: string };
    if (!response.ok) {
      return {
        configured: true,
        data: null,
        error: body.message || body.detail || body.error || `Payment Request API returned HTTP ${response.status}`,
      };
    }
    return { configured: true, data: body, error: null };
  } catch (error) {
    return {
      configured: true,
      data: null,
      error: error instanceof Error ? error.message : "Unable to load payment request control",
    };
  }
}

export function getPaymentRequestOverview(viewerRole: PaymentRequestRole) {
  return callPaymentRequestApi<PaymentRequestOverview>("overview", { viewer_role: viewerRole });
}

export function submitSupplierPaymentRequest(input: PaymentRequestIdentity & {
  request_id: string;
  invoice_id: string;
  due_date: string;
  evidence_ref: string;
  request_reason: string;
}) {
  return callPaymentRequestApi<{ ok: boolean; result?: Record<string, unknown> }>("submit_request", input);
}

export function reviewSupplierPaymentRequest(input: PaymentRequestIdentity & {
  request_id: string;
  payment_request_id: string;
  decision: "cash_reserved" | "rejected";
  review_reason: string;
}) {
  return callPaymentRequestApi<{ ok: boolean; result?: Record<string, unknown> }>("review_request", input);
}
