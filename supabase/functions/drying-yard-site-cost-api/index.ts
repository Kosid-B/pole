import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: cors });

async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function authenticateAdmin(db: any, code: string) {
  const codeHash = await sha256(code);
  const { data, error } = await db.from("drying_yard_booking_access")
    .select("id,project_id,label,role,active,code_hash,temp_code_hash,temp_code_expires_at")
    .eq("active", true).eq("role", "admin");
  if (error) throw error;
  const now = Date.now();
  return (data || []).find((x: any) => x.code_hash === codeHash || (
    x.temp_code_hash === codeHash && x.temp_code_expires_at && new Date(x.temp_code_expires_at).getTime() > now
  )) || null;
}

async function overview(db: any, pid: string, label: string) {
  const [summaryResult, gmResult] = await Promise.all([
    db.from("drying_yard_site_cost_summary_v")
      .select("project_id,site_id,site_code,installation_type,province,district,subdistrict,material_cost,freight_cost,equipment_cost,labor_cost,total_site_cost,final_price_vat,selling_price_pre_vat,target_gross_margin,unconfirmed_cost_lines,gross_margin,cost_confirmation_status,commercial_gate")
      .eq("project_id", pid).order("site_code"),
    db.from("drying_yard_site_dynamic_gm_v")
      .select("site_id,recommended_gm,financial_risk_tier,dynamic_gm_gate,confirmed_quotes,confirmed_quote_groups,min_quotes,modeled_safety_reserve,recommended_selling_price_pre_vat")
      .eq("project_id", pid),
  ]);
  if (summaryResult.error) throw summaryResult.error;
  if (gmResult.error) throw gmResult.error;
  const gmBySite = new Map((gmResult.data || []).map((r: any) => [r.site_id, r]));
  const rows = (summaryResult.data || []).map((r: any) => ({ ...r, dynamic_gm: gmBySite.get(r.site_id) || null }));
  return json({
    ok: true,
    label,
    summary: {
      sites: rows.length,
      go: rows.filter((r: any) => r.commercial_gate === "GO").length,
      hold: rows.filter((r: any) => r.commercial_gate !== "GO").length,
      confirmed: rows.filter((r: any) => String(r.cost_confirmation_status).toUpperCase() === "CONFIRMED").length,
      unconfirmed: rows.filter((r: any) => String(r.cost_confirmation_status).toUpperCase() !== "CONFIRMED").length,
      dynamic_review_eligible: rows.filter((r: any) => r.dynamic_gm?.dynamic_gm_gate === "ELIGIBLE_FOR_GM_REVIEW").length,
    },
    sites: rows,
    rule: "Dynamic GM is advisory and fail-closed. It never lowers the approved target while site cost evidence, RFQ coverage, or cash terms are incomplete.",
  });
}

async function siteDetail(db: any, pid: string, body: Record<string, unknown>) {
  const siteId = String(body.site_id || "").trim();
  if (!siteId) return json({ error: "SITE_REQUIRED" }, 400);
  const [summary, dynamicGm, materials, freight, equipment, labor, suppliers] = await Promise.all([
    db.from("drying_yard_site_cost_summary_v").select("*").eq("project_id", pid).eq("site_id", siteId).maybeSingle(),
    db.from("drying_yard_site_dynamic_gm_v").select("*").eq("project_id", pid).eq("site_id", siteId).maybeSingle(),
    db.from("drying_yard_site_material_costs").select("id,item_code,material_group,item_name,qty,unit,unit_price,surcharge_amount,discount_amount,pricing_status,valid_until,evidence_ref,supplier_quote_id").eq("project_id", pid).eq("site_id", siteId).order("item_code"),
    db.from("drying_yard_site_freight_costs").select("id,supplier_quote_id,material_group,origin_name,distance_km,vehicle_type,amount,pricing_status,valid_until,evidence_ref").eq("project_id", pid).eq("site_id", siteId).order("created_at"),
    db.from("drying_yard_site_equipment_costs").select("id,equipment_code,equipment_name,qty,unit,unit_rate,mobilization_amount,demobilization_amount,pricing_status,valid_until,evidence_ref").eq("project_id", pid).eq("site_id", siteId).order("equipment_name"),
    db.from("drying_yard_site_labor_costs").select("id,labor_code,labor_name,qty,unit,unit_rate,pricing_status,valid_until,evidence_ref").eq("project_id", pid).eq("site_id", siteId).order("labor_name"),
    db.from("drying_yard_supplier_directory").select("id,material_group,supplier_name,plant_location,commercial_status,procurement_zone_code,service_provinces").eq("project_id", pid).order("material_group").order("priority_rank"),
  ]);
  for (const r of [summary, dynamicGm, materials, freight, equipment, labor, suppliers]) if (r.error) throw r.error;
  if (!summary.data) return json({ error: "SITE_NOT_FOUND" }, 404);
  const province = summary.data.province;
  const siteSuppliers = (suppliers.data || []).filter((s: any) => !Array.isArray(s.service_provinces) || s.service_provinces.length === 0 || s.service_provinces.includes(province));
  return json({ ok: true, summary: summary.data, dynamic_gm: dynamicGm.data || null, materials: materials.data || [], freight: freight.data || [], equipment: equipment.data || [], labor: labor.data || [], suppliers: siteSuppliers });
}

async function sensitivity(db: any, pid: string, body: Record<string, unknown>) {
  const scopeName = String(body.scope_name || "").trim();
  let query = db.from("drying_yard_gm_sensitivity_v")
    .select("scope_type,scope_name,source_ref,source_date,gm,implied_cost_pre_vat,selling_price_pre_vat,selling_price_vat,gross_profit_pre_vat,cost_overrun_buffer_pct_of_cost,break_even_overrun_amount,modeled_advance_cash_vat,modeled_safety_reserve,modeled_funding_gap_days,evidence_status")
    .eq("project_id", pid).order("scope_type").order("scope_name").order("gm");
  if (scopeName) query = query.eq("scope_name", scopeName);
  const { data, error } = await query;
  if (error) throw error;
  return json({ ok: true, scenarios: data || [], rule: "Scenario values use implied cost derived from the current customer quote and the current 32% system target. They are decision support only and never replace confirmed site cost evidence." });
}

async function applyMaterialQuote(db: any, pid: string, body: Record<string, unknown>) {
  const { data, error } = await db.rpc("sitecost_apply_site_material_quote", {
    p_project_id: pid,
    p_site_id: body.site_id,
    p_supplier_id: body.supplier_id,
    p_material_group: body.material_group,
    p_quotation_ref: body.quotation_ref,
    p_valid_until: body.valid_until,
    p_lines: body.lines,
    p_quoted_at: body.quoted_at || null,
    p_payment_terms: body.payment_terms || null,
    p_evidence_ref: body.evidence_ref || null,
    p_procurement_bid_id: body.procurement_bid_id || null,
    p_freight: body.freight || null,
  });
  if (error) throw error;
  return json(data);
}

async function applyRateBatch(db: any, pid: string, body: Record<string, unknown>) {
  const { data, error } = await db.rpc("sitecost_apply_site_rate_batch", {
    p_project_id: pid,
    p_site_id: body.site_id,
    p_rate_type: body.rate_type,
    p_evidence_ref: body.evidence_ref,
    p_valid_until: body.valid_until,
    p_lines: body.lines,
  });
  if (error) throw error;
  return json(data);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const code = String(body.code || "").trim();
    const action = String(body.action || "overview");
    if (!code) return json({ error: "ACCESS_CODE_REQUIRED" }, 401);
    const access = await authenticateAdmin(db, code);
    if (!access) return json({ error: "INVALID_ACCESS_CODE" }, 401);
    if (action === "overview") return await overview(db, access.project_id, access.label);
    if (action === "site_detail") return await siteDetail(db, access.project_id, body);
    if (action === "gm_sensitivity") return await sensitivity(db, access.project_id, body);
    if (action === "apply_material_quote") return await applyMaterialQuote(db, access.project_id, body);
    if (action === "apply_rate_batch") return await applyRateBatch(db, access.project_id, body);
    return json({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    const conflict = message.includes("SITECOST_");
    return json({ error: conflict ? "EVIDENCE_GATE_REJECTED" : "SERVER_ERROR", detail: message }, conflict ? 409 : 500);
  }
});