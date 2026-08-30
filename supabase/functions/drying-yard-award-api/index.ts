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
const n = (v: unknown) => Number(v ?? 0);

async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function authenticateAdmin(db: any, code: string) {
  const codeHash = await sha256(code);
  const { data: admins, error } = await db
    .from("drying_yard_booking_access")
    .select("id,project_id,label,role,active,code_hash,temp_code_hash,temp_code_expires_at")
    .eq("active", true)
    .eq("role", "admin");
  if (error) throw error;

  const now = Date.now();
  return (admins || []).find(
    (x: any) =>
      x.code_hash === codeHash ||
      (x.temp_code_hash === codeHash &&
        x.temp_code_expires_at &&
        new Date(x.temp_code_expires_at).getTime() > now),
  ) || null;
}

function tdc(row: Record<string, unknown>) {
  return (
    n(row.base_rate) +
    n(row.freight_per_m3) +
    n(row.pump_per_m3) +
    n(row.waiting_per_m3) +
    n(row.short_load_per_m3) -
    n(row.cash_discount_per_m3) -
    n(row.volume_rebate_per_m3) -
    n(row.schedule_discount_per_m3) +
    n(row.other_adjustment_per_m3)
  );
}

function quoteValidUntil(value: unknown) {
  if (!value) return false;
  const raw = String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  return raw >= new Date().toISOString().slice(0, 10);
}

function bidReadiness(row: Record<string, unknown>) {
  const effective = tdc(row);
  const missing = [
    String(row.bid_status || "") !== "confirmed" ? "bid_not_confirmed" : null,
    !String(row.supplier_name || "").trim() ? "supplier_name" : null,
    n(row.base_rate) <= 0 ? "base_rate" : null,
    !String(row.quotation_ref || "").trim() ? "quotation_ref" : null,
    !quoteValidUntil(row.valid_until) ? "quote_expired_or_invalid" : null,
    row.capacity_m3_day == null || n(row.capacity_m3_day) <= 0 ? "capacity" : null,
    row.lead_time_days == null ? "lead_time" : null,
    !String(row.payment_terms || "").trim() ? "payment_terms" : null,
  ].filter(Boolean) as string[];

  return {
    effective_delivered_cost: effective,
    award_ready: missing.length === 0 && effective > 0,
    missing,
  };
}

async function loadFinancial(code: string) {
  const baseUrl = Deno.env.get("SUPABASE_URL")!;
  const response = await fetch(`${baseUrl}/functions/v1/drying-yard-pm-guardrail-api`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, action: "overview" }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || payload?.detail || payload?.error || `PM_GUARDRAIL_HTTP_${response.status}`);
  }
  return payload;
}

async function loadClusterContext(db: any, pid: string, clusterId: string) {
  const [clusterR, bidsR, fundingR, frameworkR, auditR] = await Promise.all([
    db.from("drying_yard_procurement_clusters")
      .select("id,project_id,cluster_name,province,forecast_sites,forecast_volume_m3,benchmark_delivered_rate,target_saving_per_m3,rfq_status,awarded_supplier_name,awarded_effective_rate,primary_share_pct,backup_share_pct")
      .eq("project_id", pid).eq("id", clusterId).maybeSingle(),
    db.from("drying_yard_procurement_bids")
      .select("id,cluster_id,supplier_slot,supplier_name,plant_location,base_rate,freight_per_m3,pump_per_m3,waiting_per_m3,short_load_per_m3,cash_discount_per_m3,volume_rebate_per_m3,schedule_discount_per_m3,other_adjustment_per_m3,capacity_m3_day,lead_time_days,payment_terms,quotation_ref,valid_until,bid_status,note,updated_at")
      .eq("project_id", pid).eq("cluster_id", clusterId).order("supplier_slot"),
    db.from("drying_yard_customer_material_funding")
      .select("id,funding_mode,funded_pct,payment_trigger,settlement_days,approved_ceiling,status,note,updated_at")
      .eq("project_id", pid).eq("cluster_id", clusterId),
    db.from("drying_yard_framework_agreements")
      .select("id,cluster_id,agreement_no,primary_bid_id,backup_bid_id,primary_share_pct,backup_share_pct,effective_from,effective_to,calloff_notice_hours,rolling_forecast_days,price_review_trigger_per_m3,payment_mode,status,note,updated_at")
      .eq("project_id", pid).eq("cluster_id", clusterId).maybeSingle(),
    db.from("drying_yard_award_approval_audit")
      .select("id,request_id,action,approved_by_email,approved_by_name,approved_by_role,approval_reason,primary_supplier_name,backup_supplier_name,primary_tdc_per_m3,backup_tdc_per_m3,forecast_gm,gm_floor,min_rolling_cash,safety_reserve,confirmed_customer_funding_pct,created_at")
      .eq("project_id", pid).eq("cluster_id", clusterId).order("created_at", { ascending: false }).limit(20),
  ]);
  for (const r of [clusterR, bidsR, fundingR, frameworkR, auditR]) if (r.error) throw r.error;
  if (!clusterR.data) return null;

  const bids = (bidsR.data || []).map((row: any) => ({ ...row, ...bidReadiness(row) }));
  const ready = bids.filter((b: any) => b.award_ready).sort((a: any, b: any) => a.effective_delivered_cost - b.effective_delivered_cost);
  const confirmedStatuses = new Set(["approved", "active", "confirmed"]);
  const funding = fundingR.data || [];
  const confirmedFundingPct = Math.min(100, funding.reduce((sum: number, row: any) => {
    if (!confirmedStatuses.has(String(row.status || "").toLowerCase())) return sum;
    if (!["customer_direct_pay", "material_advance"].includes(String(row.funding_mode || ""))) return sum;
    return sum + Math.max(0, Math.min(100, n(row.funded_pct)));
  }, 0));

  return {
    cluster: {
      ...clusterR.data,
      forecast_sites: n(clusterR.data.forecast_sites),
      forecast_volume_m3: n(clusterR.data.forecast_volume_m3),
      benchmark_delivered_rate: n(clusterR.data.benchmark_delivered_rate),
      target_saving_per_m3: n(clusterR.data.target_saving_per_m3),
    },
    bids,
    award_ready_bids: ready,
    funding,
    confirmed_funding_pct: confirmedFundingPct,
    funding_gate_pass: confirmedFundingPct > 0,
    framework: frameworkR.data,
    audit: auditR.data || [],
  };
}

async function overview(db: any, pid: string, code: string, label: string) {
  const [financial, clustersR] = await Promise.all([
    loadFinancial(code),
    db.from("drying_yard_procurement_clusters")
      .select("id,cluster_name,province,forecast_sites,forecast_volume_m3,rfq_status,awarded_supplier_name,awarded_effective_rate")
      .eq("project_id", pid).order("forecast_volume_m3", { ascending: false }),
  ]);
  if (clustersR.error) throw clustersR.error;

  const clusters = [];
  for (const c of clustersR.data || []) {
    const context = await loadClusterContext(db, pid, c.id);
    if (!context) continue;
    clusters.push({
      ...context.cluster,
      award_ready_count: context.award_ready_bids.length,
      primary_candidate: context.award_ready_bids[0] || null,
      backup_candidate: context.award_ready_bids[1] || null,
      supplier_pair_pass: context.award_ready_bids.length >= 2,
      confirmed_funding_pct: context.confirmed_funding_pct,
      funding_gate_pass: context.funding_gate_pass,
      framework: context.framework,
      latest_audit: context.audit[0] || null,
    });
  }

  const gmPass = Boolean(financial?.gm_gate?.pass) && n(financial?.gm_gate?.forecast_gm) >= 0.32;
  const cashPass = Boolean(financial?.cash_gate?.pass) && n(financial?.cash_gate?.min_cash) >= n(financial?.cash_gate?.safety_reserve);

  return json({
    ok: true,
    label,
    financial,
    gates: { gm: gmPass, rolling_cash: cashPass },
    summary: {
      clusters: clusters.length,
      supplier_pair_ready: clusters.filter((x: any) => x.supplier_pair_pass).length,
      cluster_funding_ready: clusters.filter((x: any) => x.funding_gate_pass).length,
      award_approved: clusters.filter((x: any) => x.framework?.status === "award_approved" || x.framework?.status === "active").length,
      framework_active: clusters.filter((x: any) => x.framework?.status === "active").length,
    },
    clusters,
    rule: "Per-cluster manual award requires two award-ready confirmed bids + GM >= 32% + rolling cash >= safety reserve + confirmed cluster funding. Framework activation additionally requires an agreement number and effective date. No auto-award.",
  });
}

function approverFrom(body: Record<string, unknown>) {
  const role = String(body.approved_by_role || "");
  const userId = String(body.approved_by_user_id || "").trim();
  const email = String(body.approved_by_email || "").trim().toLowerCase();
  const name = String(body.approved_by_name || "").trim();
  const reason = String(body.approval_reason || "").trim();
  if (!["EXECUTIVE", "ADMIN"].includes(role)) return { error: "APPROVER_ROLE_BLOCK" };
  if (!userId || !email || !name) return { error: "APPROVER_IDENTITY_REQUIRED" };
  if (reason.length < 8 || reason.length > 2000) return { error: "APPROVAL_REASON_REQUIRED" };
  return { role, userId, email, name, reason };
}

async function approveAward(db: any, access: any, code: string, body: Record<string, unknown>) {
  const clusterId = String(body.cluster_id || "").trim();
  const primaryBidId = String(body.primary_bid_id || "").trim();
  const backupBidId = String(body.backup_bid_id || "").trim();
  const requestId = String(body.request_id || "").trim();
  if (!clusterId || !primaryBidId || !backupBidId || !requestId) return json({ error: "AWARD_REQUEST_INCOMPLETE" }, 400);
  const approver = approverFrom(body);
  if ("error" in approver) return json({ error: approver.error }, 403);

  const [financial, context] = await Promise.all([
    loadFinancial(code),
    loadClusterContext(db, access.project_id, clusterId),
  ]);
  if (!context) return json({ error: "CLUSTER_NOT_FOUND" }, 404);

  const readyIds = new Set(context.award_ready_bids.map((x: any) => x.id));
  if (!readyIds.has(primaryBidId) || !readyIds.has(backupBidId) || primaryBidId === backupBidId) {
    return json({ error: "PRIMARY_BACKUP_NOT_AWARD_READY" }, 409);
  }

  const gmPass = Boolean(financial?.gm_gate?.pass) && n(financial?.gm_gate?.forecast_gm) >= 0.32;
  const cashPass = Boolean(financial?.cash_gate?.pass) && n(financial?.cash_gate?.min_cash) >= n(financial?.cash_gate?.safety_reserve);
  if (!gmPass) return json({ error: "GM_GATE_BLOCK", financial }, 409);
  if (!cashPass) return json({ error: "CASH_GATE_BLOCK", financial }, 409);
  if (!context.funding_gate_pass) return json({ error: "CLUSTER_FUNDING_GATE_BLOCK", confirmed_funding_pct: context.confirmed_funding_pct }, 409);

  const primary = context.award_ready_bids.find((x: any) => x.id === primaryBidId)!;
  const backup = context.award_ready_bids.find((x: any) => x.id === backupBidId)!;
  const snapshot = {
    captured_at: new Date().toISOString(),
    cluster: context.cluster,
    primary,
    backup,
    funding: context.funding,
    financial: {
      gm_gate: financial.gm_gate,
      cash_gate: financial.cash_gate,
      triggers: financial.triggers,
      model_status: financial.model_status,
      settings: financial.settings,
    },
  };

  const { data, error } = await db.rpc("drying_yard_apply_manual_award", {
    p_request_id: requestId,
    p_project_id: access.project_id,
    p_cluster_id: clusterId,
    p_primary_bid_id: primaryBidId,
    p_backup_bid_id: backupBidId,
    p_approved_by_user_id: approver.userId,
    p_approved_by_email: approver.email,
    p_approved_by_name: approver.name,
    p_approved_by_role: approver.role,
    p_approval_reason: approver.reason,
    p_forecast_gm: n(financial.gm_gate.forecast_gm),
    p_gm_floor: Math.max(0.32, n(financial.gm_gate.target_gm)),
    p_min_rolling_cash: n(financial.cash_gate.min_cash),
    p_safety_reserve: n(financial.cash_gate.safety_reserve),
    p_confirmed_customer_funding_pct: context.confirmed_funding_pct,
    p_precheck_snapshot: snapshot,
  });
  if (error) throw error;
  return json({ ok: true, result: data, snapshot });
}

async function activateFramework(db: any, access: any, code: string, body: Record<string, unknown>) {
  const clusterId = String(body.cluster_id || "").trim();
  const requestId = String(body.request_id || "").trim();
  const agreementNo = String(body.agreement_no || "").trim();
  const effectiveFrom = String(body.effective_from || "").trim();
  const effectiveTo = String(body.effective_to || "").trim();
  if (!clusterId || !requestId || !agreementNo || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) return json({ error: "FRAMEWORK_ACTIVATION_INCOMPLETE" }, 400);
  if (effectiveTo && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveTo)) return json({ error: "INVALID_EFFECTIVE_TO" }, 400);
  const approver = approverFrom(body);
  if ("error" in approver) return json({ error: approver.error }, 403);

  const [financial, context] = await Promise.all([
    loadFinancial(code),
    loadClusterContext(db, access.project_id, clusterId),
  ]);
  if (!context) return json({ error: "CLUSTER_NOT_FOUND" }, 404);
  if (!context.framework || context.framework.status !== "award_approved") return json({ error: "AWARD_APPROVAL_REQUIRED" }, 409);

  const gmPass = Boolean(financial?.gm_gate?.pass) && n(financial?.gm_gate?.forecast_gm) >= 0.32;
  const cashPass = Boolean(financial?.cash_gate?.pass) && n(financial?.cash_gate?.min_cash) >= n(financial?.cash_gate?.safety_reserve);
  if (!gmPass) return json({ error: "GM_GATE_BLOCK", financial }, 409);
  if (!cashPass) return json({ error: "CASH_GATE_BLOCK", financial }, 409);
  if (!context.funding_gate_pass) return json({ error: "CLUSTER_FUNDING_GATE_BLOCK", confirmed_funding_pct: context.confirmed_funding_pct }, 409);

  const snapshot = {
    captured_at: new Date().toISOString(),
    cluster: context.cluster,
    framework_before: context.framework,
    funding: context.funding,
    financial: {
      gm_gate: financial.gm_gate,
      cash_gate: financial.cash_gate,
      triggers: financial.triggers,
      model_status: financial.model_status,
      settings: financial.settings,
    },
  };

  const { data, error } = await db.rpc("drying_yard_activate_framework_agreement", {
    p_request_id: requestId,
    p_project_id: access.project_id,
    p_cluster_id: clusterId,
    p_agreement_no: agreementNo,
    p_effective_from: effectiveFrom,
    p_effective_to: effectiveTo || null,
    p_approved_by_user_id: approver.userId,
    p_approved_by_email: approver.email,
    p_approved_by_name: approver.name,
    p_approved_by_role: approver.role,
    p_approval_reason: approver.reason,
    p_forecast_gm: n(financial.gm_gate.forecast_gm),
    p_gm_floor: Math.max(0.32, n(financial.gm_gate.target_gm)),
    p_min_rolling_cash: n(financial.cash_gate.min_cash),
    p_safety_reserve: n(financial.cash_gate.safety_reserve),
    p_confirmed_customer_funding_pct: context.confirmed_funding_pct,
    p_precheck_snapshot: snapshot,
  });
  if (error) throw error;
  return json({ ok: true, result: data, snapshot });
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
    if (!code) return json({ error: "ACCESS_CODE_REQUIRED" }, 401);

    const access = await authenticateAdmin(db, code);
    if (!access) return json({ error: "INVALID_ACCESS_CODE" }, 401);

    if (action === "overview") return await overview(db, access.project_id, code, access.label);
    if (action === "approve_award") return await approveAward(db, access, code, body);
    if (action === "activate_framework") return await activateFramework(db, access, code, body);
    return json({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: "SERVER_ERROR", detail: error instanceof Error ? error.message : String(error) }, 500);
  }
});
