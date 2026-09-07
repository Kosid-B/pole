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
  const { data, error } = await db.from("drying_yard_site_cost_summary_v")
    .select("project_id,site_id,site_code,installation_type,province,district,subdistrict,material_cost,freight_cost,equipment_cost,labor_cost,total_site_cost,final_price_vat,selling_price_pre_vat,target_gross_margin,unconfirmed_cost_lines,gross_margin,cost_confirmation_status,commercial_gate")
    .eq("project_id", pid).order("site_code");
  if (error) throw error;
  const rows = data || [];
  return json({
    ok: true,
    label,
    summary: {
      sites: rows.length,
      go: rows.filter((r: any) => r.commercial_gate === "GO").length,
      hold: rows.filter((r: any) => r.commercial_gate !== "GO").length,
      confirmed: rows.filter((r: any) => r.cost_confirmation_status === "confirmed").length,
      unconfirmed: rows.filter((r: any) => r.cost_confirmation_status !== "confirmed").length,
    },
    sites: rows,
    rule: "GM is evaluated only when all site cost lines are confirmed. Target GM must be at least 32% (project setting).",
  });
}

async function siteDetail(db: any, pid: string, body: Record<string, unknown>) {
  const siteId = String(body.site_id || "").trim();
  if (!siteId) return json({ error: "SITE_REQUIRED" }, 400);
  const [summary, materials, freight, equipment, labor, suppliers] = await Promise.all([
    db.from("drying_yard_site_cost_summary_v").select("*").eq("project_id", pid).eq("site_id", siteId).maybeSingle(),
    db.from("drying_yard_site_material_costs").select("id,item_code,material_group,item_name,qty,unit,unit_price,surcharge_amount,discount_amount,pricing_status,valid_until,evidence_ref,supplier_quote_id").eq("project_id", pid).eq("site_id", siteId).order("item_code"),
    db.from("drying_yard_site_freight_costs").select("id,supplier_quote_id,material_group,origin_name,distance_km,vehicle_type,amount,pricing_status,valid_until,evidence_ref").eq("project_id", pid).eq("site_id", siteId).order("created_at"),
    db.from("drying_yard_site_equipment_costs").select("id,equipment_code,equipment_name,qty,unit,unit_rate,mobilization_amount,demobilization_amount,pricing_status,valid_until,evidence_ref").eq("project_id", pid).eq("site_id", siteId).order("equipment_name"),
    db.from("drying_yard_site_labor_costs").select("id,labor_code,labor_name,qty,unit,unit_rate,pricing_status,valid_until,evidence_ref").eq("project_id", pid).eq("site_id", siteId).order("labor_name"),
    db.from("drying_yard_supplier_directory").select("id,material_group,supplier_name,plant_location,commercial_status,procurement_zone_code").eq("project_id", pid).order("material_group").order("priority_rank"),
  ]);
  for (const r of [summary, materials, freight, equipment, labor, suppliers]) if (r.error) throw r.error;
  if (!summary.data) return json({ error: "SITE_NOT_FOUND" }, 404);
  return json({ ok: true, summary: summary.data, materials: materials.data || [], freight: freight.data || [], equipment: equipment.data || [], labor: labor.data || [], suppliers: suppliers.data || [] });
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