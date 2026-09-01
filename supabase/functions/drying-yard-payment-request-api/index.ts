import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: cors });
const n = (value: unknown) => Number(value ?? 0);

async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function authenticateAdmin(db: any, code: string) {
  const codeHash = await sha256(code);
  const { data, error } = await db
    .from("drying_yard_booking_access")
    .select("id,project_id,label,role,active,code_hash,temp_code_hash,temp_code_expires_at")
    .eq("active", true)
    .eq("role", "admin");
  if (error) throw error;
  const now = Date.now();
  return (
    (data || []).find(
      (row: any) =>
        row.code_hash === codeHash ||
        (row.temp_code_hash === codeHash &&
          row.temp_code_expires_at &&
          new Date(row.temp_code_expires_at).getTime() > now),
    ) || null
  );
}

function identity(body: Record<string, unknown>) {
  const role = String(body.actor_role || "");
  const userId = String(body.actor_user_id || "").trim();
  const email = String(body.actor_email || "").trim().toLowerCase();
  const name = String(body.actor_name || "").trim();
  if (!["EXECUTIVE", "ADMIN"].includes(role)) return { error: "APPROVER_ROLE_BLOCK" };
  if (!userId || !email || !name) return { error: "ACTOR_IDENTITY_REQUIRED" };
  return { role, userId, email, name };
}

async function loadFinancialGuardrail(code: string) {
  const baseUrl = Deno.env.get("SUPABASE_URL")!;
  const response = await fetch(`${baseUrl}/functions/v1/drying-yard-pm-guardrail-api`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, action: "overview" }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || data.error || "FINANCIAL_GUARDRAIL_UNAVAILABLE");
  return data;
}

async function overview(db: any, projectId: string, label: string, viewerRole: string, code: string) {
  if (!["EXECUTIVE", "ADMIN"].includes(viewerRole)) return json({ error: "VIEWER_ROLE_BLOCK" }, 403);

  const [invoiceR, invoiceReviewR, requestR, requestReviewR, financial] = await Promise.all([
    db.from("drying_yard_supplier_invoices").select("*").eq("project_id", projectId).eq("status", "payment_eligible").order("submitted_at", { ascending: false }),
    db.from("drying_yard_supplier_invoice_reviews").select("invoice_id,decision,match_pass,reviewed_at").eq("project_id", projectId).eq("decision", "payment_eligible"),
    db.from("drying_yard_supplier_payment_requests").select("*").eq("project_id", projectId).order("submitted_at", { ascending: false }),
    db.from("drying_yard_supplier_payment_request_reviews").select("*").eq("project_id", projectId).order("reviewed_at", { ascending: false }),
    loadFinancialGuardrail(code),
  ]);
  for (const result of [invoiceR, invoiceReviewR, requestR, requestReviewR]) {
    if (result.error) throw result.error;
  }

  const eligibleInvoiceIds = new Set(
    (invoiceReviewR.data || []).filter((row: any) => row.match_pass).map((row: any) => row.invoice_id),
  );
  const activeInvoiceIds = new Set(
    (requestR.data || [])
      .filter((row: any) => ["pending_approval", "cash_reserved"].includes(row.status))
      .map((row: any) => row.invoice_id),
  );
  const reviewByRequest = new Map((requestReviewR.data || []).map((row: any) => [row.payment_request_id, row]));
  const requests = (requestR.data || []).map((row: any) => ({ ...row, review: reviewByRequest.get(row.id) || null }));
  const eligibleInvoices = (invoiceR.data || []).filter(
    (row: any) => eligibleInvoiceIds.has(row.id) && !activeInvoiceIds.has(row.id),
  );
  const reserved = requests
    .filter((row: any) => row.status === "cash_reserved")
    .reduce((sum: number, row: any) => sum + n(row.requested_gross_amount), 0);
  const minCash = n(financial.cash_gate?.min_cash);
  const reserve = n(financial.cash_gate?.safety_reserve);

  return json({
    ok: true,
    label,
    viewer_role: viewerRole,
    can_submit: true,
    can_review: viewerRole === "EXECUTIVE",
    financial_gate: {
      gm_pass: Boolean(financial.gm_gate?.pass),
      forecast_gm: n(financial.gm_gate?.forecast_gm),
      gm_floor: n(financial.gm_gate?.target_gm),
      live_min_cash: minCash,
      existing_cash_reserved: reserved,
      available_cash_buffer: minCash - reserve - reserved,
      safety_reserve: reserve,
    },
    summary: {
      eligible_invoices: eligibleInvoices.length,
      requests: requests.length,
      pending_approval: requests.filter((row: any) => row.status === "pending_approval").length,
      cash_reserved: requests.filter((row: any) => row.status === "cash_reserved").length,
      rejected: requests.filter((row: any) => row.status === "rejected").length,
      reserved_gross: reserved,
    },
    eligible_invoices: eligibleInvoices,
    requests,
    rule: "Payment Eligible Invoice → Payment Request → live GM/Cash re-check → EXECUTIVE manual Cash Reservation. Cash Reservation is not payment execution, paid status, bank instruction, accounting journal, WHT posting, settlement or customer claim.",
  });
}

async function submitRequest(db: any, access: any, body: Record<string, unknown>) {
  const actor = identity(body);
  if ("error" in actor) return json({ error: actor.error }, 403);
  const reason = String(body.request_reason || "").trim();
  if (reason.length < 8) return json({ error: "REQUEST_REASON_REQUIRED" }, 400);
  const { data, error } = await db.rpc("drying_yard_submit_supplier_payment_request", {
    p_request_id: String(body.request_id || "").trim(),
    p_project_id: access.project_id,
    p_invoice_id: String(body.invoice_id || "").trim(),
    p_due_date: String(body.due_date || "").trim(),
    p_evidence_ref: String(body.evidence_ref || "").trim(),
    p_request_reason: reason,
    p_actor_user_id: actor.userId,
    p_actor_email: actor.email,
    p_actor_name: actor.name,
    p_actor_role: actor.role,
  });
  if (error) throw error;
  return json({ ok: true, result: data });
}

async function reviewRequest(db: any, access: any, body: Record<string, unknown>, code: string) {
  const actor = identity(body);
  if ("error" in actor) return json({ error: actor.error }, 403);
  if (actor.role !== "EXECUTIVE") return json({ error: "EXECUTIVE_REVIEW_REQUIRED" }, 403);
  const reason = String(body.review_reason || "").trim();
  if (reason.length < 8) return json({ error: "REVIEW_REASON_REQUIRED" }, 400);

  const [financial, settingsR] = await Promise.all([
    loadFinancialGuardrail(code),
    db.from("drying_yard_pm_cashflow_settings").select("updated_at").eq("project_id", access.project_id).single(),
  ]);
  if (settingsR.error) throw settingsR.error;

  const { data, error } = await db.rpc("drying_yard_review_supplier_payment_request", {
    p_request_id: String(body.request_id || "").trim(),
    p_payment_request_id: String(body.payment_request_id || "").trim(),
    p_decision: String(body.decision || "").trim(),
    p_live_forecast_gm: n(financial.gm_gate?.forecast_gm),
    p_gm_floor: n(financial.gm_gate?.target_gm),
    p_live_min_cash: n(financial.cash_gate?.min_cash),
    p_safety_reserve: n(financial.cash_gate?.safety_reserve),
    p_settings_updated_at: settingsR.data.updated_at,
    p_financial_snapshot: financial,
    p_review_reason: reason,
    p_actor_user_id: actor.userId,
    p_actor_email: actor.email,
    p_actor_name: actor.name,
    p_actor_role: actor.role,
  });
  if (error) throw error;
  return json({ ok: true, result: data });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const code = String(body.code || "").trim();
    const action = String(body.action || "overview");
    const viewerRole = String(body.viewer_role || "ADMIN");
    if (!code) return json({ error: "ACCESS_CODE_REQUIRED" }, 401);
    const access = await authenticateAdmin(db, code);
    if (!access) return json({ error: "INVALID_ACCESS_CODE" }, 401);
    if (action === "overview") return await overview(db, access.project_id, access.label, viewerRole, code);
    if (action === "submit_request") return await submitRequest(db, access, body);
    if (action === "review_request") return await reviewRequest(db, access, body, code);
    return json({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: "SERVER_ERROR", detail: error instanceof Error ? error.message : String(error) }, 500);
  }
});
