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

async function overview(db: any, projectId: string, label: string, viewerRole: string) {
  if (!["EXECUTIVE", "ADMIN"].includes(viewerRole)) {
    return json({ error: "VIEWER_ROLE_BLOCK" }, 403);
  }

  const [invoiceR, reviewR, calloffR, submissionR, deliveryReviewR, bidR, batchR, siteR] =
    await Promise.all([
      db.from("drying_yard_supplier_invoices").select("*").eq("project_id", projectId).order("submitted_at", { ascending: false }),
      db.from("drying_yard_supplier_invoice_reviews").select("*").eq("project_id", projectId).order("reviewed_at", { ascending: false }),
      db.from("drying_yard_supplier_calloffs").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      db.from("drying_yard_delivery_receipt_submissions").select("*").eq("project_id", projectId),
      db.from("drying_yard_delivery_receipt_reviews").select("*").eq("project_id", projectId),
      db.from("drying_yard_procurement_bids").select("id,supplier_name,plant_location,payment_terms,quotation_ref").eq("project_id", projectId),
      db.from("drying_yard_batch_releases").select("id,batch_code,province,status").eq("project_id", projectId),
      db.from("core_installation_sites").select("id,site_code").eq("project_id", projectId),
    ]);

  for (const result of [invoiceR, reviewR, calloffR, submissionR, deliveryReviewR, bidR, batchR, siteR]) {
    if (result.error) throw result.error;
  }

  const invoiceIds = (invoiceR.data || []).map((row: any) => row.id);
  const lineR = invoiceIds.length
    ? await db
        .from("drying_yard_supplier_invoice_lines")
        .select("*")
        .in("invoice_id", invoiceIds)
        .order("created_at")
    : { data: [], error: null };
  if (lineR.error) throw lineR.error;

  const bidMap = new Map((bidR.data || []).map((row: any) => [row.id, row]));
  const batchMap = new Map((batchR.data || []).map((row: any) => [row.id, row]));
  const siteMap = new Map((siteR.data || []).map((row: any) => [row.id, row]));
  const deliveryReviewBySubmission = new Map(
    (deliveryReviewR.data || []).map((row: any) => [row.submission_id, row]),
  );
  const reviewByInvoice = new Map((reviewR.data || []).map((row: any) => [row.invoice_id, row]));

  const acceptedByCalloff = new Map<string, number>();
  for (const submission of submissionR.data || []) {
    const review: any = deliveryReviewBySubmission.get(submission.id) || null;
    if (review?.decision !== "accepted") continue;
    acceptedByCalloff.set(
      submission.calloff_id,
      (acceptedByCalloff.get(submission.calloff_id) || 0) + n(submission.accepted_m3),
    );
  }

  const linesByInvoice = new Map<string, any[]>();
  for (const line of lineR.data || []) {
    const list = linesByInvoice.get(line.invoice_id) || [];
    list.push(line);
    linesByInvoice.set(line.invoice_id, list);
  }

  const invoiceStatusById = new Map((invoiceR.data || []).map((row: any) => [row.id, row.status]));
  const reservedByCalloff = new Map<string, number>();
  for (const line of lineR.data || []) {
    const status = invoiceStatusById.get(line.invoice_id);
    if (status !== "pending_review" && status !== "payment_eligible") continue;
    reservedByCalloff.set(
      line.calloff_id,
      (reservedByCalloff.get(line.calloff_id) || 0) + n(line.invoiced_m3),
    );
  }

  const eligibleCalloffs = (calloffR.data || [])
    .map((calloff: any) => {
      if (calloff.status !== "completed") return null;
      const accepted = acceptedByCalloff.get(calloff.id) || 0;
      const reserved = reservedByCalloff.get(calloff.id) || 0;
      const remaining = Math.max(0, accepted - reserved);
      if (accepted <= 0 || remaining <= 0.001) return null;
      const bid: any = bidMap.get(calloff.supplier_bid_id) || null;
      const batch: any = batchMap.get(calloff.batch_id) || null;
      const site: any = siteMap.get(calloff.site_id) || null;
      return {
        id: calloff.id,
        calloff_ref: calloff.calloff_ref,
        batch_id: calloff.batch_id,
        batch_code: batch?.batch_code || "-",
        batch_status: batch?.status || "-",
        province: batch?.province || "-",
        site_id: calloff.site_id,
        site_code: site?.site_code || "-",
        supplier_bid_id: calloff.supplier_bid_id,
        supplier_name: bid?.supplier_name || "-",
        plant_location: bid?.plant_location || null,
        quotation_ref: calloff.quotation_ref_snapshot || bid?.quotation_ref || null,
        payment_terms: calloff.payment_terms_snapshot || bid?.payment_terms || null,
        tdc_per_m3: n(calloff.tdc_per_m3_snapshot),
        verified_accepted_m3: accepted,
        reserved_or_eligible_m3: reserved,
        remaining_invoice_m3: remaining,
        expected_remaining_net: Math.round(remaining * n(calloff.tdc_per_m3_snapshot) * 100) / 100,
        closed_at: calloff.closed_at,
      };
    })
    .filter(Boolean);

  const invoices = (invoiceR.data || []).map((invoice: any) => {
    const lines = linesByInvoice.get(invoice.id) || [];
    const review = reviewByInvoice.get(invoice.id) || null;
    const expectedNet = lines.reduce((sum: number, line: any) => sum + n(line.expected_net_snapshot), 0);
    const claimedNet = lines.reduce((sum: number, line: any) => sum + n(line.invoice_line_net), 0);
    const previewPass =
      Math.abs(expectedNet - claimedNet) <= 0.01 &&
      Math.abs(expectedNet - n(invoice.net_amount)) <= 0.01 &&
      Math.abs(n(invoice.gross_amount) - (n(invoice.net_amount) + n(invoice.vat_amount))) <= 0.01;
    return {
      ...invoice,
      lines,
      review,
      match_preview: {
        pass: previewPass,
        expected_net: Math.round(expectedNet * 100) / 100,
        claimed_line_net: Math.round(claimedNet * 100) / 100,
        delta: Math.round((n(invoice.net_amount) - expectedNet) * 100) / 100,
      },
    };
  });

  return json({
    ok: true,
    label,
    viewer_role: viewerRole,
    can_manage: true,
    can_review: true,
    summary: {
      eligible_calloffs: eligibleCalloffs.length,
      invoices: invoices.length,
      pending_review: invoices.filter((row: any) => row.status === "pending_review").length,
      payment_eligible: invoices.filter((row: any) => row.status === "payment_eligible").length,
      rejected: invoices.filter((row: any) => row.status === "rejected").length,
      payment_eligible_net: invoices
        .filter((row: any) => row.status === "payment_eligible")
        .reduce((sum: number, row: any) => sum + n(row.net_amount), 0),
    },
    eligible_calloffs: eligibleCalloffs,
    invoices,
    rule:
      "Completed Call-off → PM-Verified Accepted Actual → Supplier Invoice → server 3-Way Match at Call-off TDC snapshot → ADMIN/EXECUTIVE manual Payment Eligibility. No automatic payment, bank instruction, withholding-tax posting or settlement.",
  });
}

async function submitInvoice(db: any, access: any, body: Record<string, unknown>) {
  const actor = identity(body);
  if ("error" in actor) return json({ error: actor.error }, 403);
  const lines = Array.isArray(body.lines)
    ? body.lines
    : [
        {
          calloff_id: String(body.calloff_id || "").trim(),
          invoiced_m3: n(body.invoiced_m3),
          invoice_line_net: n(body.invoice_line_net),
        },
      ];

  const { data, error } = await db.rpc("drying_yard_submit_supplier_invoice", {
    p_request_id: String(body.request_id || "").trim(),
    p_project_id: access.project_id,
    p_supplier_bid_id: String(body.supplier_bid_id || "").trim(),
    p_invoice_ref: String(body.invoice_ref || "").trim(),
    p_tax_invoice_ref: String(body.tax_invoice_ref || "").trim(),
    p_invoice_date: String(body.invoice_date || "").trim(),
    p_net_amount: n(body.net_amount),
    p_vat_amount: n(body.vat_amount),
    p_gross_amount: n(body.gross_amount),
    p_evidence_ref: String(body.evidence_ref || "").trim(),
    p_note: String(body.note || "").trim(),
    p_lines: lines,
    p_actor_user_id: actor.userId,
    p_actor_email: actor.email,
    p_actor_name: actor.name,
    p_actor_role: actor.role,
  });
  if (error) throw error;
  return json({ ok: true, result: data });
}

async function reviewInvoice(db: any, _access: any, body: Record<string, unknown>) {
  const actor = identity(body);
  if ("error" in actor) return json({ error: actor.error }, 403);
  const reason = String(body.review_reason || "").trim();
  if (reason.length < 8) return json({ error: "REVIEW_REASON_REQUIRED" }, 400);

  const { data, error } = await db.rpc("drying_yard_review_supplier_invoice", {
    p_request_id: String(body.request_id || "").trim(),
    p_invoice_id: String(body.invoice_id || "").trim(),
    p_decision: String(body.decision || "").trim(),
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

    if (action === "overview") return await overview(db, access.project_id, access.label, viewerRole);
    if (action === "submit_invoice") return await submitInvoice(db, access, body);
    if (action === "review_invoice") return await reviewInvoice(db, access, body);
    return json({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    console.error(error);
    return json(
      { error: "SERVER_ERROR", detail: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});
