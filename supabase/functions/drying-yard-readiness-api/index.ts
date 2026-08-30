import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: cors });
const n = (v: unknown) => Number(v ?? 0);

async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function authenticateAdmin(db: any, code: string) {
  const codeHash = await sha256(code);
  const { data: admins, error } = await db.from("drying_yard_booking_access")
    .select("id,project_id,label,role,active,code_hash,temp_code_hash,temp_code_expires_at")
    .eq("active", true).eq("role", "admin");
  if (error) throw error;
  const now = Date.now();
  return (admins || []).find((x: any) => x.code_hash === codeHash ||
    (x.temp_code_hash === codeHash && x.temp_code_expires_at && new Date(x.temp_code_expires_at).getTime() > now)) || null;
}

function identity(body: Record<string, unknown>, review = false) {
  const role = String(body.actor_role || "");
  const userId = String(body.actor_user_id || "").trim();
  const email = String(body.actor_email || "").trim().toLowerCase();
  const name = String(body.actor_name || "").trim();
  const allowed = review ? ["EXECUTIVE", "ADMIN"] : ["EXECUTIVE", "ADMIN", "FIELD_LEADER"];
  if (!allowed.includes(role)) return { error: review ? "REVIEWER_ROLE_BLOCK" : "SUBMITTER_ROLE_BLOCK" };
  if (!userId || !email || !name) return { error: "ACTOR_IDENTITY_REQUIRED" };
  return { role, userId, email, name };
}

async function overview(db: any, pid: string, label: string, viewerRole: string) {
  const [bR, bsR, sR, subR, revR] = await Promise.all([
    db.from("drying_yard_batch_releases").select("id,batch_code,batch_no,cluster_id,province,planned_site_count,planned_volume_m3,planned_start_at,status").eq("project_id", pid).order("batch_code"),
    db.from("drying_yard_batch_release_sites").select("id,batch_id,site_id,sequence_no,readiness_status,quantity_confirmed,drawing_confirmed,site_condition_confirmed,access_ready,confirmed_area_m2,confirmed_concrete_m3,evidence_ref,readiness_note,readiness_checked_by_email,readiness_checked_at").order("sequence_no"),
    db.from("core_installation_sites").select("id,site_code,status,location_id,metadata").eq("project_id", pid),
    db.from("drying_yard_site_readiness_submissions").select("id,request_id,batch_id,site_id,submitted_by_email,submitted_by_name,submitted_by_role,quantity_confirmed,drawing_confirmed,site_condition_confirmed,access_ready,confirmed_area_m2,confirmed_concrete_m3,evidence_ref,note,candidate_ready,submitted_at").eq("project_id", pid).order("submitted_at", { ascending: false }),
    db.from("drying_yard_site_readiness_reviews").select("id,submission_id,batch_id,site_id,decision,reviewed_by_email,reviewed_by_name,reviewed_by_role,review_reason,reviewed_at").eq("project_id", pid).order("reviewed_at", { ascending: false }),
  ]);
  for (const r of [bR, bsR, sR, subR, revR]) if (r.error) throw r.error;

  const locationIds = Array.from(new Set((sR.data || []).map((x: any) => x.location_id).filter(Boolean)));
  const lR = locationIds.length ? await db.from("core_locations").select("id,province,district,subdistrict,address").in("id", locationIds) : { data: [], error: null };
  if (lR.error) throw lR.error;
  const siteMap = new Map((sR.data || []).map((x: any) => [x.id, x]));
  const locMap = new Map((lR.data || []).map((x: any) => [x.id, x]));
  const reviewBySubmission = new Map((revR.data || []).map((x: any) => [x.submission_id, x]));
  const latestSubmissionBySite = new Map<string, any>();
  for (const x of subR.data || []) if (!latestSubmissionBySite.has(x.site_id)) latestSubmissionBySite.set(x.site_id, { ...x, review: reviewBySubmission.get(x.id) || null });

  const sitesByBatch = new Map<string, any[]>();
  for (const row of bsR.data || []) {
    const site = siteMap.get(row.site_id) as any;
    if (!site) continue;
    const latestSubmission = latestSubmissionBySite.get(row.site_id) || null;
    const baseVerified = ["ready", "released", "completed"].includes(String(row.readiness_status || ""));
    const item = {
      ...row,
      site_code: site.site_code,
      site_status: site.status,
      metadata: site.metadata,
      location: locMap.get(site.location_id) || null,
      latest_submission: latestSubmission,
      verified_ready: baseVerified && (!latestSubmission || Boolean(latestSubmission.review)),
    };
    const list = sitesByBatch.get(row.batch_id) || [];
    list.push(item); sitesByBatch.set(row.batch_id, list);
  }

  const batches = (bR.data || []).map((b: any) => {
    const sites = sitesByBatch.get(b.id) || [];
    return {
      ...b,
      sites,
      summary: {
        sites: sites.length,
        submitted: sites.filter((x: any) => x.latest_submission).length,
        pending_review: sites.filter((x: any) => x.latest_submission?.candidate_ready && !x.latest_submission?.review).length,
        verified_ready: sites.filter((x: any) => x.verified_ready).length,
      },
    };
  });

  return json({
    ok: true,
    label,
    viewer_role: viewerRole,
    can_review: viewerRole === "EXECUTIVE" || viewerRole === "ADMIN",
    summary: {
      batches: batches.length,
      sites: batches.reduce((sum: number, b: any) => sum + b.summary.sites, 0),
      submitted: batches.reduce((sum: number, b: any) => sum + b.summary.submitted, 0),
      pending_review: batches.reduce((sum: number, b: any) => sum + b.summary.pending_review, 0),
      verified_ready: batches.reduce((sum: number, b: any) => sum + b.summary.verified_ready, 0),
    },
    batches,
    rule: "FIELD_LEADER may submit evidence. Any newer unreviewed field submission makes prior READY verification stale. Only ADMIN/EXECUTIVE can verify the latest candidate and write READY. Batch release remains a separate ADMIN/EXECUTIVE action.",
  });
}

async function submit(db: any, access: any, body: Record<string, unknown>) {
  const actor = identity(body, false); if ("error" in actor) return json({ error: actor.error }, 403);
  const requestId = String(body.request_id || "").trim();
  const batchId = String(body.batch_id || "").trim();
  const siteId = String(body.site_id || "").trim();
  if (!requestId || !batchId || !siteId) return json({ error: "SUBMISSION_REQUEST_INCOMPLETE" }, 400);
  const { data, error } = await db.rpc("drying_yard_submit_site_readiness", {
    p_request_id: requestId,p_project_id: access.project_id,p_batch_id: batchId,p_site_id: siteId,
    p_submitted_by_user_id: actor.userId,p_submitted_by_email: actor.email,p_submitted_by_name: actor.name,p_submitted_by_role: actor.role,
    p_quantity_confirmed: Boolean(body.quantity_confirmed),p_drawing_confirmed: Boolean(body.drawing_confirmed),
    p_site_condition_confirmed: Boolean(body.site_condition_confirmed),p_access_ready: Boolean(body.access_ready),
    p_confirmed_area_m2: body.confirmed_area_m2 == null || body.confirmed_area_m2 === "" ? null : n(body.confirmed_area_m2),
    p_confirmed_concrete_m3: body.confirmed_concrete_m3 == null || body.confirmed_concrete_m3 === "" ? null : n(body.confirmed_concrete_m3),
    p_evidence_ref: String(body.evidence_ref || ""),p_note: String(body.note || ""),
  });
  if (error) throw error;
  return json({ ok: true, result: data });
}

async function review(db: any, access: any, body: Record<string, unknown>) {
  const actor = identity(body, true); if ("error" in actor) return json({ error: actor.error }, 403);
  const requestId = String(body.request_id || "").trim();
  const submissionId = String(body.submission_id || "").trim();
  const decision = String(body.decision || "").trim();
  const reason = String(body.review_reason || "").trim();
  if (!requestId || !submissionId || !["accepted", "rejected"].includes(decision) || reason.length < 8) return json({ error: "REVIEW_REQUEST_INCOMPLETE" }, 400);
  const { data, error } = await db.rpc("drying_yard_review_site_readiness", {
    p_request_id: requestId,p_project_id: access.project_id,p_submission_id: submissionId,p_decision: decision,
    p_reviewed_by_user_id: actor.userId,p_reviewed_by_email: actor.email,p_reviewed_by_name: actor.name,p_reviewed_by_role: actor.role,p_review_reason: reason,
  });
  if (error) throw error;
  return json({ ok: true, result: data });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  try {
    const body = await req.json() as Record<string, unknown>;
    const code = String(body.code || "").trim();
    const action = String(body.action || "overview");
    const viewerRole = String(body.viewer_role || "FIELD_LEADER");
    if (!code) return json({ error: "ACCESS_CODE_REQUIRED" }, 401);
    const access = await authenticateAdmin(db, code); if (!access) return json({ error: "INVALID_ACCESS_CODE" }, 401);
    if (action === "overview") return await overview(db, access.project_id, access.label, viewerRole);
    if (action === "submit") return await submit(db, access, body);
    if (action === "review") return await review(db, access, body);
    return json({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: "SERVER_ERROR", detail: error instanceof Error ? error.message : String(error) }, 500);
  }
});