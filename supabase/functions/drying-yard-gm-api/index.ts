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

async function kalasinPilot(db: any, pid: string) {
  const [readiness, reviews, savings, clusters, bids] = await Promise.all([
    db.from("drying_yard_site_pricing_readiness_v")
      .select("site_id,site_code,province,district,active_quote_evidence,active_quote_groups,confirmed_quote_evidence,confirmed_quote_groups,nearest_valid_until,market_reference_material_lines,confirmed_material_lines,unconfirmed_material_lines,spec_review_required_lines,confirmed_labor_lines,unconfirmed_labor_lines,confirmed_equipment_lines,unconfirmed_equipment_lines,freight_lines,confirmed_freight_lines,unconfirmed_freight_lines,pricing_readiness_gate")
      .eq("project_id", pid).eq("province", "กาฬสินธุ์").order("site_code"),
    db.from("drying_yard_material_spec_reviews")
      .select("id,province,material_group,quotation_ref,supplier_name,required_spec,offered_spec,review_status,evidence_ref,reviewed_by,reviewed_at,review_note")
      .eq("project_id", pid).eq("province", "กาฬสินธุ์").order("created_at"),
    db.from("drying_yard_procurement_savings_scenarios")
      .select("material_group,item_code,source_ref,qty,unit,baseline_unit_cost_pre_vat,quoted_unit_cost_pre_vat,potential_saving_pre_vat,evidence_status,note")
      .eq("project_id", pid).eq("province", "กาฬสินธุ์").order("item_code"),
    db.from("drying_yard_procurement_clusters")
      .select("id,material_group,cluster_name,forecast_sites,forecast_volume_m3,rfq_status,target_gm,note")
      .eq("project_id", pid).eq("province", "กาฬสินธุ์").order("material_group"),
    db.from("drying_yard_procurement_bids")
      .select("id,cluster_id,supplier_slot,supplier_directory_id,supplier_name,plant_location,base_rate,quotation_ref,valid_until,bid_status,note")
      .eq("project_id", pid).order("supplier_slot"),
  ]);
  for (const r of [readiness, reviews, savings, clusters, bids]) if (r.error) throw r.error;
  const clusterRows = clusters.data || [];
  const clusterIds = new Set(clusterRows.map((c: any) => c.id));
  const bidRows = (bids.data || []).filter((b: any) => clusterIds.has(b.cluster_id));
  const sites = readiness.data || [];
  const gateCounts = sites.reduce((acc: Record<string, number>, row: any) => {
    acc[row.pricing_readiness_gate] = (acc[row.pricing_readiness_gate] || 0) + 1;
    return acc;
  }, {});
  const evidenceBackedSaving = (savings.data || [])
    .filter((r: any) => r.evidence_status === "market_reference" || r.evidence_status === "confirmed")
    .reduce((sum: number, r: any) => sum + Number(r.potential_saving_pre_vat || 0), 0);
  const candidateSaving = (savings.data || [])
    .filter((r: any) => r.evidence_status === "candidate_spec_review")
    .reduce((sum: number, r: any) => sum + Number(r.potential_saving_pre_vat || 0), 0);
  return json({
    ok: true,
    province: "กาฬสินธุ์",
    summary: {
      sites: sites.length,
      gate_counts: gateCounts,
      active_quote_groups_min: sites.length ? Math.min(...sites.map((r: any) => Number(r.active_quote_groups || 0))) : 0,
      market_reference_lines_min: sites.length ? Math.min(...sites.map((r: any) => Number(r.market_reference_material_lines || 0))) : 0,
      spec_review_required_sites: sites.filter((r: any) => Number(r.spec_review_required_lines || 0) > 0).length,
      evidence_backed_saving_pre_vat: Math.round(evidenceBackedSaving * 100) / 100,
      candidate_saving_pre_vat: Math.round(candidateSaving * 100) / 100,
    },
    reviews: reviews.data || [],
    savings: savings.data || [],
    clusters: clusterRows,
    bids: bidRows,
    sites,
    rule: "Quoted evidence and market references show procurement progress but never pass the award or Dynamic GM gate until site cost, independent RFQ coverage, freight/TDC and cash evidence are confirmed.",
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const code = String(body.code || "").trim();
    const action = String(body.action || "kalasin_pilot");
    if (!code) return json({ error: "ACCESS_CODE_REQUIRED" }, 401);
    const access = await authenticateAdmin(db, code);
    if (!access) return json({ error: "INVALID_ACCESS_CODE" }, 401);
    if (action === "kalasin_pilot") return await kalasinPilot(db, access.project_id);
    return json({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: "SERVER_ERROR", detail: error instanceof Error ? error.message : String(error) }, 500);
  }
});
