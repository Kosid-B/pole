import "server-only";

export type InvoiceRole = "EXECUTIVE" | "ADMIN";

export type EligibleInvoiceCalloff = {
  id: string;
  calloff_ref: string;
  batch_id: string;
  batch_code: string;
  batch_status: string;
  province: string;
  site_id: string;
  site_code: string;
  supplier_bid_id: string;
  supplier_name: string;
  plant_location: string | null;
  quotation_ref: string | null;
  payment_terms: string | null;
  tdc_per_m3: number;
  verified_accepted_m3: number;
  reserved_or_eligible_m3: number;
  remaining_invoice_m3: number;
  expected_remaining_net: number;
  closed_at: string | null;
};

export type SupplierInvoiceLine = {
  id: string;
  invoice_id: string;
  calloff_id: string;
  batch_id: string;
  site_id: string;
  calloff_ref_snapshot: string;
  invoiced_m3: number;
  tdc_per_m3_snapshot: number;
  verified_accepted_m3_snapshot: number;
  expected_net_snapshot: number;
  invoice_line_net: number;
  created_at: string;
};

export type SupplierInvoiceReview = {
  id: string;
  invoice_id: string;
  decision: "payment_eligible" | "rejected";
  match_pass: boolean;
  match_snapshot: Record<string, unknown>;
  review_reason: string;
  reviewed_by_name: string;
  reviewed_by_email: string;
  reviewed_by_role: InvoiceRole;
  reviewed_at: string;
};

export type SupplierInvoice = {
  id: string;
  project_id: string;
  supplier_bid_id: string;
  supplier_name_snapshot: string;
  invoice_ref: string;
  tax_invoice_ref: string | null;
  invoice_date: string;
  net_amount: number;
  vat_amount: number;
  gross_amount: number;
  evidence_ref: string;
  note: string | null;
  status: "pending_review" | "payment_eligible" | "rejected";
  submitted_by_name: string;
  submitted_by_email: string;
  submitted_by_role: InvoiceRole;
  submitted_at: string;
  lines: SupplierInvoiceLine[];
  review: SupplierInvoiceReview | null;
  match_preview: {
    pass: boolean;
    expected_net: number;
    claimed_line_net: number;
    delta: number;
  };
};

export type InvoiceOverview = {
  ok: boolean;
  label: string;
  viewer_role: InvoiceRole;
  can_manage: boolean;
  can_review: boolean;
  summary: {
    eligible_calloffs: number;
    invoices: number;
    pending_review: number;
    payment_eligible: number;
    rejected: number;
    payment_eligible_net: number;
  };
  eligible_calloffs: EligibleInvoiceCalloff[];
  invoices: SupplierInvoice[];
  rule: string;
};

export type InvoiceIdentity = {
  actor_user_id: string;
  actor_email: string;
  actor_name: string;
  actor_role: InvoiceRole;
};

type LoadResult<T> =
  | { configured: true; data: T; error: null }
  | { configured: false; data: null; error: string }
  | { configured: true; data: null; error: string };

const API_URL =
  process.env.DRYING_YARD_INVOICE_API_URL?.trim() ||
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-invoice-api";

async function callInvoiceApi<T>(
  action: "overview" | "submit_invoice" | "review_invoice",
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
        error: body.message || body.detail || body.error || `Invoice API returned HTTP ${response.status}`,
      };
    }
    return { configured: true, data: body, error: null };
  } catch (error) {
    return {
      configured: true,
      data: null,
      error: error instanceof Error ? error.message : "Unable to load supplier invoice controls",
    };
  }
}

export function getInvoiceOverview(viewerRole: InvoiceRole) {
  return callInvoiceApi<InvoiceOverview>("overview", { viewer_role: viewerRole });
}

export function submitSupplierInvoice(input: InvoiceIdentity & {
  request_id: string;
  supplier_bid_id: string;
  calloff_id: string;
  invoice_ref: string;
  tax_invoice_ref?: string;
  invoice_date: string;
  invoiced_m3: number;
  invoice_line_net: number;
  net_amount: number;
  vat_amount: number;
  gross_amount: number;
  evidence_ref: string;
  note?: string;
}) {
  return callInvoiceApi<{ ok: boolean; result?: string }>("submit_invoice", input);
}

export function reviewSupplierInvoice(input: InvoiceIdentity & {
  request_id: string;
  invoice_id: string;
  decision: "payment_eligible" | "rejected";
  review_reason: string;
}) {
  return callInvoiceApi<{ ok: boolean; result?: string }>("review_invoice", input);
}
