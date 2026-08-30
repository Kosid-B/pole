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

async function loadFinancial(code: string) {
  const baseUrl = Deno.env.get("SUPABASE_URL")!;
  const response = await fetch(`${baseUrl}/functions/v1/drying-yard-pm-guardrail-api`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, action: "overview" }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.message || payload?.detail || payload?.error || `PM_GUARDRAIL_HTTP_${response.status}`);
  return payload;
}

function actorFrom(body: Record<string, unknown>) {
  const role = String(body.actor_role || "");
  const userId = String(body.actor_user_id || "").trim();
  const email = String(body.actor_email || "").trim().toLowerCase();
  const name = String(body.actor_name || "").trim();
  const reason = String(body.reason || "").trim();
  if (!["EXECUTIVE", "ADMIN"].includes(role)) return { error: "APPROVER_ROLE_BLOCK" };
  if (!userId || !email || !name) return { error: "ACTOR_IDENTITY_REQUIRED" };
  if (reason.length < 8 || reason.length > 2000) return { error: "REASON_REQUIRED" };
  return { role, userId, email, name, reason };
}

function financialGate(financial: any) {
  const gmPass = Boolean(financial?.gm_gate?.pass) && n(financial?.gm_gate?.forecast_gm) >= 0.32;
  const cashPass = Boolean(financial?.cash_gate?.pass) && n(financial?.cash_gate?.min_cash) >= n(financial?.cash_gate?.safety_reserve);
  const weekly = Array.isArray(financial?.cashflow?.weekly) ? financial.cashflow.weekly : [];
  const fourWeeks = weekly.filter((w: any) => n(w.week) >= 0 && n(w.week) < 4);
  const collectible = fourWeeks.reduce((sum: number, w: any) => sum + n(w.inflow), 0);
  const commitments = fourWeeks.reduce((sum: number, w: any) => sum + n(w.outflow), 0);
  const reserve = n(financial?.cash_gate?.safety_reserve);
  const coverageAfterReserve = collectible - commitments - reserve;
  const commitmentPass = fourWeeks.length > 0 && coverageAfterReserve >= -0.01;
  return {
    gm_pass: gmPass,
    forecast_gm: n(financial?.gm_gate?.forecast_gm),
    gm_floor: Math.max(0.32, n(financial?.gm_gate?.target_gm)),
    cash_pass: cashPass,
    min_cash: n(financial?.cash_gate?.min_cash),
    safety_reserve: reserve,
    commitment_pass: commitmentPass,
    four_week_collectible_cash: collectible,
    four_week_confirmed_commitments: commitments,
    four_week_coverage_after_reserve: coverageAfterReserve,
  };
}

function readiness(row: any) {
  return Boolean(row.quantity_confirmed && row.drawing_confirmed && row.site_condition_confirmed && row.access_ready && n(row.confirmed_concrete_m3) > 0);
}

async function buildOverview(db: any, pid: string, code: string, label: string) {
  const [financial, batchR, batchSiteR, siteR, frameworkR, bidR, fundingR, auditR, subR, revR] = await Promise.all([
    loadFinancial(code),
    db.from("drying_yard_batch_releases").select("*").eq("project_id", pid).order("batch_code"),
    db.from("drying_yard_batch_release_sites").select("*").order("sequence_no"),
    db.from("core_installation_sites").select("id,project_id,site_code,status,location_id,metadata").eq("project_id", pid),
    db.from("drying_yard_framework_agreements").select("*").eq("project_id", pid),
    db.from("drying_yard_procurement_bids").select("id,cluster_id,supplier_name,capacity_m3_day,lead_time_days,payment_terms,bid_status,valid_until").eq("project_id", pid),
    db.from("drying_yard_customer_material_funding").select("id,cluster_id,funding_mode,funded_pct,status,payment_trigger,settlement_days,approved_ceiling,updated_at").eq("project_id", pid),
    db.from("drying_yard_batch_release_audit").select("id,batch_id,action,decision,actor_name,actor_email,actor_role,reason,created_at").eq("project_id", pid).order("created_at", { ascending: false }).limit(200),
    db.from("drying_yard_site_readiness_submissions").select("id,batch_id,site_id,submitted_at,candidate_ready").eq("project_id", pid).order("submitted_at", { ascending: false }),
    db.from("drying_yard_site_readiness_reviews").select("submission_id,decision,reviewed_at").eq("project_id", pid),
  ]);
  for (const r of [batchR, batchSiteR, siteR, frameworkR, bidR, fundingR, auditR, subR, revR]) if (r.error) throw r.error;

  const locationIds = Array.from(new Set((siteR.data || []).map((s: any) => s.location_id).filter(Boolean)));
  const locR = locationIds.length ? await db.from("core_locations").select("id,province,district,subdistrict,address").in("id", locationIds) : { data: [], error: null };
  if (locR.error) throw locR.error;

  const reviewBySubmission = new Map((revR.data || []).map((x: any) => [x.submission_id, x]));
  const latestSubmissionBySite = new Map<string, any>();
  for (const x of subR.data || []) {
    if (!latestSubmissionBySite.has(x.site_id)) latestSubmissionBySite.set(x.site_id, x);
  }

  const siteMap = new Map((siteR.data || []).map((x: any) => [x.id, x]));
  const locMap = new Map((locR.data || []).map((x: any) => [x.id, x]));
  const sitesByBatch = new Map<string, any[]>();
  for (const row of batchSiteR.data || []) {
    const site = siteMap.get(row.site_id) as any;
    if (!site) continue;
    const latestSubmission = latestSubmissionBySite.get(row.site_id) || null;
    const fieldReviewPending = Boolean(latestSubmission && !reviewBySubmission.has(latestSubmission.id));
    const item = {
      ...row,
      site_code: site.site_code,
      site_status: site.status,
      metadata: site.metadata,
      location: locMap.get(site.location_id) || null,
      ready: readiness(row) && !fieldReviewPending,
      field_review_pending: fieldReviewPending,
      latest_field_submission_id: latestSubmission?.id || null,
    };
    const list = sitesByBatch.get(row.batch_id) || [];
    list.push(item); sitesByBatch.set(row.batch_id, list);
  }
  const frameworkMap = new Map((frameworkR.data || []).map((x: any) => [x.cluster_id, x]));
  const bidMap = new Map((bidR.data || []).map((x: any) => [x.id, x]));
  const fundingByCluster = new Map<string, any[]>();
  for (const row of fundingR.data || []) { const list = fundingByCluster.get(row.cluster_id) || []; list.push(row); fundingByCluster.set(row.cluster_id, list); }
  const auditByBatch = new Map<string, any[]>();
  for (const row of auditR.data || []) { const list = auditByBatch.get(row.batch_id) || []; list.push(row); auditByBatch.set(row.batch_id, list); }

  const fin = financialGate(financial);
  const now = Date.now();
  const confirmedStatuses = new Set(["approved", "active", "confirmed"]);
  const batches = (batchR.data || []).map((b: any) => {
    const sites = sitesByBatch.get(b.id) || [];
    const pendingFieldReviews = sites.filter((x: any) => x.field_review_pending).length;
    const readySites = sites.filter((x: any) => x.ready).length;
    const confirmedVolume = sites.reduce((sum: number, x: any) => sum + (x.ready ? n(x.confirmed_concrete_m3) : 0), 0);
    const sitePass = sites.length > 0 && readySites === sites.length && pendingFieldReviews === 0;
    const framework: any = frameworkMap.get(b.cluster_id) || null;
    const primary: any = framework?.primary_bid_id ? bidMap.get(framework.primary_bid_id) || null : null;
    const backup: any = framework?.backup_bid_id ? bidMap.get(framework.backup_bid_id) || null : null;
    const procurementPass = Boolean(framework && framework.status === "active" && String(framework.agreement_no || "").trim() && primary && backup && primary.bid_status === "confirmed" && backup.bid_status === "confirmed");
    const rollingDays = Math.max(1, n(framework?.rolling_forecast_days) || 14);
    const volumeForCapacity = confirmedVolume > 0 ? confirmedVolume : n(b.planned_volume_m3);
    const weightedCapacity = primary && backup ? n(primary.capacity_m3_day) * n(framework?.primary_share_pct) / 100 + n(backup.capacity_m3_day) * n(framework?.backup_share_pct) / 100 : 0;
    const requiredDaily = volumeForCapacity / rollingDays;
    const leadDays = Math.max(n(primary?.lead_time_days), n(backup?.lead_time_days));
    const capacityPass = procurementPass && weightedCapacity + 0.0001 >= requiredDaily && n(primary?.capacity_m3_day) > 0 && n(backup?.capacity_m3_day) > 0;
    const funding = fundingByCluster.get(b.cluster_id) || [];
    const confirmedFundingPct = Math.min(100, funding.reduce((sum: number, row: any) => {
      if (!confirmedStatuses.has(String(row.status || "").toLowerCase())) return sum;
      if (!["customer_direct_pay", "material_advance"].includes(String(row.funding_mode || ""))) return sum;
      return sum + Math.max(0, Math.min(100, n(row.funded_pct)));
    }, 0));
    const fundingPass = confirmedFundingPct > 0;
    const startMs = b.planned_start_at ? new Date(b.planned_start_at).getTime() : NaN;
    const noticeHours = Math.max(0, n(framework?.calloff_notice_hours) || 72);
    const noticePass = Number.isFinite(startMs) && startMs - now >= noticeHours * 3600000;
    const leadTimePass = Number.isFinite(startMs) && startMs - now >= leadDays * 86400000;
    const forecastPass = Number.isFinite(startMs) && startMs - now <= rollingDays * 86400000;
    const startDate = Number.isFinite(startMs) ? new Date(startMs).toISOString().slice(0, 10) : "";
    const effectivePass = Boolean(framework?.effective_from && startDate >= String(framework.effective_from) && (!framework.effective_to || startDate <= String(framework.effective_to)));
    const schedulePass = procurementPass && noticePass && leadTimePass && forecastPass && effectivePass;
    const blockers: string[] = [];
    if (!sitePass) blockers.push(`Site readiness ${readySites}/${sites.length}`);
    if (pendingFieldReviews > 0) blockers.push(`Field readiness PM review pending ${pendingFieldReviews} site(s)`);
    if (!procurementPass) blockers.push("Framework/Primary/Backup ยังไม่ Active และ Confirmed");
    if (!capacityPass) blockers.push(`Supplier capacity ${weightedCapacity.toFixed(1)} < required ${requiredDaily.toFixed(1)} m³/day`);
    if (!fundingPass) blockers.push("Customer Funding ยังไม่ Approved/Active/Confirmed");
    if (!fin.gm_pass) blockers.push("Forecast GM ต่ำกว่า 32%");
    if (!fin.cash_pass) blockers.push("Rolling Cash ต่ำกว่า Safety Reserve");
    if (!fin.commitment_pass) blockers.push("4-week Commitment Coverage ไม่ผ่าน");
    if (!schedulePass) blockers.push("Schedule ต้องอยู่ใน rolling forecast และเผื่อ Call-off/Lead time");
    const releaseReady = sitePass && procurementPass && capacityPass && fundingPass && fin.gm_pass && fin.cash_pass && fin.commitment_pass && schedulePass;
    return {
      ...b, sites,
      site_gate: { pass: sitePass, ready_sites: readySites, total_sites: sites.length, confirmed_volume_m3: confirmedVolume, pending_field_reviews: pendingFieldReviews },
      procurement_gate: { pass: procurementPass, framework, primary, backup },
      capacity_gate: { pass: capacityPass, weighted_capacity_m3_day: weightedCapacity, required_daily_m3: requiredDaily, volume_source: confirmedVolume > 0 ? "confirmed" : "planned", max_lead_time_days: leadDays },
      funding_gate: { pass: fundingPass, confirmed_funding_pct: confirmedFundingPct, funding },
      schedule_gate: { pass: schedulePass, notice_pass: noticePass, lead_time_pass: leadTimePass, forecast_pass: forecastPass, effective_period_pass: effectivePass, calloff_notice_hours: noticeHours, rolling_forecast_days: rollingDays },
      financial_gate: fin, release_ready: releaseReady, blockers,
      latest_audit: (auditByBatch.get(b.id) || [])[0] || null,
    };
  });
  return {
    ok: true, label, financial, financial_gate: fin,
    summary: {
      batches: batches.length,
      released: batches.filter((x: any) => x.status === "released" || x.status === "in_progress" || x.status === "completed").length,
      release_ready: batches.filter((x: any) => x.release_ready && x.status !== "released" && x.status !== "in_progress" && x.status !== "completed").length,
      site_ready: batches.filter((x: any) => x.site_gate.pass).length,
      procurement_ready: batches.filter((x: any) => x.procurement_gate.pass).length,
      funding_ready: batches.filter((x: any) => x.funding_gate.pass).length,
      total_sites: batches.reduce((sum: number, x: any) => sum + n(x.planned_site_count), 0),
    }, batches,
    rule: "Verified Site Readiness with no pending field review → Active Framework + Primary/Backup → Supplier Capacity/Lead Time → Confirmed Customer Funding → GM >=32% → Rolling Cash >= Safety Reserve → 4-week Commitment Coverage → Schedule/72h Call-off → Manual Batch Release. No automatic PO/DO or batch release.",
  };
}

async function setSchedule(db: any, access: any, body: Record<string, unknown>) {
  const actor = actorFrom(body); if ("error" in actor) return json({ error: actor.error }, 403);
  const batchId = String(body.batch_id || "").trim();
  const requestId = String(body.request_id || "").trim();
  const plannedStartAt = String(body.planned_start_at || "").trim();
  if (!batchId || !requestId || !plannedStartAt || !Number.isFinite(new Date(plannedStartAt).getTime())) return json({ error: "SCHEDULE_REQUEST_INCOMPLETE" }, 400);
  const { data, error } = await db.rpc("drying_yard_set_batch_schedule", {
    p_request_id: requestId, p_project_id: access.project_id, p_batch_id: batchId, p_planned_start_at: plannedStartAt,
    p_actor_user_id: actor.userId, p_actor_email: actor.email, p_actor_name: actor.name, p_actor_role: actor.role, p_reason: actor.reason,
  });
  if (error) throw error; return json({ ok: true, result: data });
}

async function setSiteReadiness(db: any, access: any, body: Record<string, unknown>) {
  const actor = actorFrom(body); if ("error" in actor) return json({ error: actor.error }, 403);
  const batchId = String(body.batch_id || "").trim(); const siteId = String(body.site_id || "").trim(); const requestId = String(body.request_id || "").trim();
  if (!batchId || !siteId || !requestId) return json({ error: "SITE_READINESS_REQUEST_INCOMPLETE" }, 400);
  const { data, error } = await db.rpc("drying_yard_set_batch_site_readiness", {
    p_request_id: requestId, p_project_id: access.project_id, p_batch_id: batchId, p_site_id: siteId,
    p_quantity_confirmed: Boolean(body.quantity_confirmed), p_drawing_confirmed: Boolean(body.drawing_confirmed),
    p_site_condition_confirmed: Boolean(body.site_condition_confirmed), p_access_ready: Boolean(body.access_ready),
    p_confirmed_area_m2: body.confirmed_area_m2 === "" || body.confirmed_area_m2 == null ? null : n(body.confirmed_area_m2),
    p_confirmed_concrete_m3: body.confirmed_concrete_m3 === "" || body.confirmed_concrete_m3 == null ? null : n(body.confirmed_concrete_m3),
    p_evidence_ref: String(body.evidence_ref || ""), p_readiness_note: String(body.readiness_note || ""),
    p_actor_user_id: actor.userId, p_actor_email: actor.email, p_actor_name: actor.name, p_actor_role: actor.role, p_reason: actor.reason,
  });
  if (error) throw error; return json({ ok: true, result: data });
}

async function releaseBatch(db: any, access: any, code: string, body: Record<string, unknown>) {
  const actor = actorFrom(body); if ("error" in actor) return json({ error: actor.error }, 403);
  const batchId = String(body.batch_id || "").trim(); const requestId = String(body.request_id || "").trim();
  if (!batchId || !requestId) return json({ error: "BATCH_RELEASE_REQUEST_INCOMPLETE" }, 400);
  const overview = await buildOverview(db, access.project_id, code, access.label);
  const batch = overview.batches.find((x: any) => x.id === batchId);
  if (!batch) return json({ error: "BATCH_NOT_FOUND" }, 404);
  if (!batch.release_ready) return json({ error: "BATCH_RELEASE_GATE_BLOCK", blockers: batch.blockers, batch, financial_gate: overview.financial_gate }, 409);
  const gateSnapshot = {
    captured_at: new Date().toISOString(),
    batch: { id: batch.id, batch_code: batch.batch_code, cluster_id: batch.cluster_id, province: batch.province, planned_start_at: batch.planned_start_at, planned_site_count: batch.planned_site_count, planned_volume_m3: batch.planned_volume_m3 },
    site: batch.site_gate, procurement: batch.procurement_gate, capacity: batch.capacity_gate, funding: batch.funding_gate, schedule: batch.schedule_gate,
    financial: overview.financial_gate,
    commitment: {
      pass: overview.financial_gate.commitment_pass,
      four_week_collectible_cash: overview.financial_gate.four_week_collectible_cash,
      four_week_confirmed_commitments: overview.financial_gate.four_week_confirmed_commitments,
      safety_reserve: overview.financial_gate.safety_reserve,
      four_week_coverage_after_reserve: overview.financial_gate.four_week_coverage_after_reserve,
    },
  };
  const { data, error } = await db.rpc("drying_yard_apply_batch_release", {
    p_request_id: requestId, p_project_id: access.project_id, p_batch_id: batchId,
    p_actor_user_id: actor.userId, p_actor_email: actor.email, p_actor_name: actor.name, p_actor_role: actor.role, p_reason: actor.reason,
    p_gate_snapshot: gateSnapshot,
  });
  if (error) throw error; return json({ ok: true, result: data, snapshot: gateSnapshot });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  try {
    const body = await req.json() as Record<string, unknown>;
    const code = String(body.code || "").trim(); const action = String(body.action || "overview");
    if (!code) return json({ error: "ACCESS_CODE_REQUIRED" }, 401);
    const access = await authenticateAdmin(db, code); if (!access) return json({ error: "INVALID_ACCESS_CODE" }, 401);
    if (action === "overview") return json(await buildOverview(db, access.project_id, code, access.label));
    if (action === "set_schedule") return await setSchedule(db, access, body);
    if (action === "set_site_readiness") return await setSiteReadiness(db, access, body);
    if (action === "release_batch") return await releaseBatch(db, access, code, body);
    return json({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: "SERVER_ERROR", detail: error instanceof Error ? error.message : String(error) }, 500);
  }
});