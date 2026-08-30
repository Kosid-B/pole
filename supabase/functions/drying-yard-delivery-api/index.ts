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

function identity(body: Record<string, unknown>, adminOnly = false) {
  const role = String(body.actor_role || "");
  const userId = String(body.actor_user_id || "").trim();
  const email = String(body.actor_email || "").trim().toLowerCase();
  const name = String(body.actor_name || "").trim();
  const allowed = adminOnly
    ? ["EXECUTIVE", "ADMIN"]
    : ["EXECUTIVE", "ADMIN", "FIELD_LEADER"];
  if (!allowed.includes(role)) {
    return { error: adminOnly ? "APPROVER_ROLE_BLOCK" : "SUBMITTER_ROLE_BLOCK" };
  }
  if (!userId || !email || !name) return { error: "ACTOR_IDENTITY_REQUIRED" };
  return { role, userId, email, name };
}

async function overview(db: any, projectId: string, label: string, viewerRole: string) {
  const [calloffR, submissionR, reviewR, batchR, batchSiteR, siteR, frameworkR, bidR] =
    await Promise.all([
      db.from("drying_yard_supplier_calloffs").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      db.from("drying_yard_delivery_receipt_submissions").select("*").eq("project_id", projectId).order("submitted_at", { ascending: false }),
      db.from("drying_yard_delivery_receipt_reviews").select("*").eq("project_id", projectId).order("reviewed_at", { ascending: false }),
      db.from("drying_yard_batch_releases").select("id,batch_code,batch_no,cluster_id,province,status,planned_start_at").eq("project_id", projectId).order("batch_code"),
      db.from("drying_yard_batch_release_sites").select("batch_id,site_id,readiness_status,confirmed_concrete_m3,confirmed_area_m2").order("sequence_no"),
      db.from("core_installation_sites").select("id,site_code,status,location_id,metadata").eq("project_id", projectId),
      db.from("drying_yard_framework_agreements").select("*").eq("project_id", projectId),
      db.from("drying_yard_procurement_bids").select("*").eq("project_id", projectId),
    ]);
  for (const result of [calloffR, submissionR, reviewR, batchR, batchSiteR, siteR, frameworkR, bidR]) {
    if (result.error) throw result.error;
  }

  const siteLocationIds = Array.from(
    new Set((siteR.data || []).map((row: any) => row.location_id).filter(Boolean)),
  );
  const locationR = siteLocationIds.length
    ? await db
        .from("core_locations")
        .select("id,province,district,subdistrict,address")
        .in("id", siteLocationIds)
    : { data: [], error: null };
  if (locationR.error) throw locationR.error;

  const batchMap = new Map((batchR.data || []).map((row: any) => [row.id, row]));
  const siteMap = new Map((siteR.data || []).map((row: any) => [row.id, row]));
  const locationMap = new Map((locationR.data || []).map((row: any) => [row.id, row]));
  const frameworkMap = new Map((frameworkR.data || []).map((row: any) => [row.cluster_id, row]));
  const bidMap = new Map((bidR.data || []).map((row: any) => [row.id, row]));
  const reviewBySubmission = new Map((reviewR.data || []).map((row: any) => [row.submission_id, row]));

  const submissionsByCalloff = new Map<string, any[]>();
  for (const submission of submissionR.data || []) {
    const list = submissionsByCalloff.get(submission.calloff_id) || [];
    list.push({ ...submission, review: reviewBySubmission.get(submission.id) || null });
    submissionsByCalloff.set(submission.calloff_id, list);
  }

  const acceptedByCalloff = new Map<string, number>();
  const rejectedByCalloff = new Map<string, number>();
  const pendingByCalloff = new Map<string, number>();
  for (const [calloffId, submissions] of submissionsByCalloff.entries()) {
    let accepted = 0;
    let rejected = 0;
    let pending = 0;
    for (const item of submissions) {
      if (!item.review) pending += 1;
      if (item.review?.decision === "accepted") {
        accepted += n(item.accepted_m3);
        rejected += n(item.rejected_m3);
      }
    }
    acceptedByCalloff.set(calloffId, accepted);
    rejectedByCalloff.set(calloffId, rejected);
    pendingByCalloff.set(calloffId, pending);
  }

  const calloffs = (calloffR.data || []).map((row: any) => {
    const batch: any = batchMap.get(row.batch_id) || null;
    const site: any = siteMap.get(row.site_id) || null;
    const bid: any = bidMap.get(row.supplier_bid_id) || null;
    const location = site ? locationMap.get(site.location_id) || null : null;
    const receipts = submissionsByCalloff.get(row.id) || [];
    const operational = {
      id: row.id,
      calloff_ref: row.calloff_ref,
      batch_id: row.batch_id,
      batch_code: batch?.batch_code || "-",
      batch_status: batch?.status || "-",
      site_id: row.site_id,
      site_code: site?.site_code || "-",
      province: batch?.province || location?.province || "-",
      district: location?.district || null,
      supplier_name: bid?.supplier_name || "-",
      supplier_role: row.supplier_role,
      requested_m3: n(row.requested_m3),
      planned_delivery_at: row.planned_delivery_at,
      status: row.status,
      verified_accepted_m3: acceptedByCalloff.get(row.id) || 0,
      verified_rejected_m3: rejectedByCalloff.get(row.id) || 0,
      pending_review: pendingByCalloff.get(row.id) || 0,
      receipts,
    };
    if (viewerRole === "FIELD_LEADER") return operational;
    return {
      ...operational,
      framework_id: row.framework_id,
      supplier_bid_id: row.supplier_bid_id,
      tdc_per_m3_snapshot: n(row.tdc_per_m3_snapshot),
      quotation_ref_snapshot: row.quotation_ref_snapshot,
      payment_terms_snapshot: row.payment_terms_snapshot,
      gate_snapshot: row.gate_snapshot,
      created_by_name: row.created_by_name,
      created_by_email: row.created_by_email,
      create_reason: row.create_reason,
      created_at: row.created_at,
      close_reason: row.close_reason,
      closed_at: row.closed_at,
    };
  });

  const usageBySite = new Map<string, number>();
  for (const calloff of calloffR.data || []) {
    const usage =
      calloff.status === "confirmed"
        ? n(calloff.requested_m3)
        : acceptedByCalloff.get(calloff.id) || 0;
    usageBySite.set(calloff.site_id, (usageBySite.get(calloff.site_id) || 0) + usage);
  }

  const eligibleSites = viewerRole === "FIELD_LEADER"
    ? []
    : (batchSiteR.data || [])
        .map((row: any) => {
          const batch: any = batchMap.get(row.batch_id) || null;
          const site: any = siteMap.get(row.site_id) || null;
          if (!batch || !site || !["released", "in_progress"].includes(String(batch.status))) return null;
          if (!["ready", "released", "completed"].includes(String(row.readiness_status))) return null;
          const framework: any = frameworkMap.get(batch.cluster_id) || null;
          if (!framework || framework.status !== "active" || !String(framework.agreement_no || "").trim()) return null;
          const primary: any = framework.primary_bid_id ? bidMap.get(framework.primary_bid_id) || null : null;
          const backup: any = framework.backup_bid_id ? bidMap.get(framework.backup_bid_id) || null : null;
          const used = usageBySite.get(row.site_id) || 0;
          const verified = n(row.confirmed_concrete_m3);
          const remaining = Math.max(0, verified - used);
          if (remaining <= 0.01) return null;
          const location = locationMap.get(site.location_id) || null;
          const toSupplier = (bid: any, role: string) =>
            bid && bid.bid_status === "confirmed"
              ? {
                  id: bid.id,
                  role,
                  supplier_name: bid.supplier_name,
                  plant_location: bid.plant_location,
                  valid_until: bid.valid_until,
                  quotation_ref: bid.quotation_ref,
                  payment_terms: bid.payment_terms,
                  tdc_per_m3:
                    n(bid.base_rate) +
                    n(bid.freight_per_m3) +
                    n(bid.pump_per_m3) +
                    n(bid.waiting_per_m3) +
                    n(bid.short_load_per_m3) -
                    n(bid.cash_discount_per_m3) -
                    n(bid.volume_rebate_per_m3) -
                    n(bid.schedule_discount_per_m3) +
                    n(bid.other_adjustment_per_m3),
                }
              : null;
          return {
            batch_id: batch.id,
            batch_code: batch.batch_code,
            batch_status: batch.status,
            cluster_id: batch.cluster_id,
            province: batch.province,
            site_id: site.id,
            site_code: site.site_code,
            district: location?.district || null,
            confirmed_concrete_m3: verified,
            reserved_or_verified_actual_m3: used,
            remaining_m3: remaining,
            framework: {
              id: framework.id,
              agreement_no: framework.agreement_no,
              calloff_notice_hours: framework.calloff_notice_hours,
              effective_from: framework.effective_from,
              effective_to: framework.effective_to,
            },
            suppliers: [toSupplier(primary, "primary"), toSupplier(backup, "backup")].filter(Boolean),
          };
        })
        .filter(Boolean);

  return json({
    ok: true,
    label,
    viewer_role: viewerRole,
    can_manage: viewerRole === "EXECUTIVE" || viewerRole === "ADMIN",
    can_review: viewerRole === "EXECUTIVE" || viewerRole === "ADMIN",
    summary: {
      calloffs: calloffs.length,
      open_calloffs: calloffs.filter((row: any) => row.status === "confirmed").length,
      pending_reviews: calloffs.reduce((sum: number, row: any) => sum + n(row.pending_review), 0),
      verified_accepted_m3: calloffs.reduce((sum: number, row: any) => sum + n(row.verified_accepted_m3), 0),
      verified_rejected_m3: calloffs.reduce((sum: number, row: any) => sum + n(row.verified_rejected_m3), 0),
      eligible_sites: eligibleSites.length,
    },
    eligible_sites: eligibleSites,
    calloffs,
    rule:
      "Released Batch only → Active Framework Primary/Backup → Manual Call-off → Field DO/QA evidence → ADMIN/EXECUTIVE verification → Verified Actual Quantity. No automatic PO, payment or invoice eligibility.",
  });
}

async function createCalloff(db: any, access: any, body: Record<string, unknown>) {
  const actor = identity(body, true);
  if ("error" in actor) return json({ error: actor.error }, 403);
  const reason = String(body.reason || "").trim();
  if (reason.length < 8) return json({ error: "REASON_REQUIRED" }, 400);
  const { data, error } = await db.rpc("drying_yard_create_supplier_calloff", {
    p_request_id: String(body.request_id || "").trim(),
    p_project_id: access.project_id,
    p_batch_id: String(body.batch_id || "").trim(),
    p_site_id: String(body.site_id || "").trim(),
    p_supplier_bid_id: String(body.supplier_bid_id || "").trim(),
    p_calloff_ref: String(body.calloff_ref || "").trim(),
    p_requested_m3: n(body.requested_m3),
    p_planned_delivery_at: String(body.planned_delivery_at || "").trim(),
    p_actor_user_id: actor.userId,
    p_actor_email: actor.email,
    p_actor_name: actor.name,
    p_actor_role: actor.role,
    p_reason: reason,
  });
  if (error) throw error;
  return json({ ok: true, result: data });
}

async function submitDelivery(db: any, access: any, body: Record<string, unknown>) {
  const actor = identity(body, false);
  if ("error" in actor) return json({ error: actor.error }, 403);
  const { data, error } = await db.rpc("drying_yard_submit_delivery_receipt", {
    p_request_id: String(body.request_id || "").trim(),
    p_project_id: access.project_id,
    p_calloff_id: String(body.calloff_id || "").trim(),
    p_do_ref: String(body.do_ref || "").trim(),
    p_truck_no: String(body.truck_no || "").trim(),
    p_delivered_m3: n(body.delivered_m3),
    p_accepted_m3: n(body.accepted_m3),
    p_rejected_m3: n(body.rejected_m3),
    p_slump_mm: body.slump_mm === "" || body.slump_mm == null ? null : n(body.slump_mm),
    p_concrete_temp_c:
      body.concrete_temp_c === "" || body.concrete_temp_c == null
        ? null
        : n(body.concrete_temp_c),
    p_cube_sample_ref: String(body.cube_sample_ref || "").trim(),
    p_evidence_ref: String(body.evidence_ref || "").trim(),
    p_note: String(body.note || "").trim(),
    p_submitted_by_user_id: actor.userId,
    p_submitted_by_email: actor.email,
    p_submitted_by_name: actor.name,
    p_submitted_by_role: actor.role,
  });
  if (error) throw error;
  return json({ ok: true, result: data });
}

async function reviewDelivery(db: any, access: any, body: Record<string, unknown>) {
  const actor = identity(body, true);
  if ("error" in actor) return json({ error: actor.error }, 403);
  const reason = String(body.review_reason || "").trim();
  if (reason.length < 8) return json({ error: "REVIEW_REASON_REQUIRED" }, 400);
  const { data, error } = await db.rpc("drying_yard_review_delivery_receipt", {
    p_request_id: String(body.request_id || "").trim(),
    p_project_id: access.project_id,
    p_submission_id: String(body.submission_id || "").trim(),
    p_decision: String(body.decision || "").trim(),
    p_reviewed_by_user_id: actor.userId,
    p_reviewed_by_email: actor.email,
    p_reviewed_by_name: actor.name,
    p_reviewed_by_role: actor.role,
    p_review_reason: reason,
  });
  if (error) throw error;
  return json({ ok: true, result: data });
}

async function closeCalloff(db: any, access: any, body: Record<string, unknown>) {
  const actor = identity(body, true);
  if ("error" in actor) return json({ error: actor.error }, 403);
  const reason = String(body.reason || "").trim();
  if (reason.length < 8) return json({ error: "REASON_REQUIRED" }, 400);
  const { data, error } = await db.rpc("drying_yard_close_supplier_calloff", {
    p_request_id: String(body.request_id || "").trim(),
    p_project_id: access.project_id,
    p_calloff_id: String(body.calloff_id || "").trim(),
    p_status: String(body.status || "").trim(),
    p_actor_user_id: actor.userId,
    p_actor_email: actor.email,
    p_actor_name: actor.name,
    p_actor_role: actor.role,
    p_reason: reason,
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
    const viewerRole = String(body.viewer_role || "FIELD_LEADER");
    if (!code) return json({ error: "ACCESS_CODE_REQUIRED" }, 401);
    const access = await authenticateAdmin(db, code);
    if (!access) return json({ error: "INVALID_ACCESS_CODE" }, 401);

    if (action === "overview") return await overview(db, access.project_id, access.label, viewerRole);
    if (action === "create_calloff") return await createCalloff(db, access, body);
    if (action === "submit_delivery") return await submitDelivery(db, access, body);
    if (action === "review_delivery") return await reviewDelivery(db, access, body);
    if (action === "close_calloff") return await closeCalloff(db, access, body);
    return json({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    console.error(error);
    return json(
      { error: "SERVER_ERROR", detail: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});
