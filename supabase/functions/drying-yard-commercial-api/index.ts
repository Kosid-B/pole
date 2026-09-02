import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { authorizeProjectRequest } from "../_shared/sitecost-project-auth.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: cors });
const n = (value: unknown) => Number(value ?? 0);

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action || "overview");

    if (action !== "overview") return json({ error: "UNKNOWN_ACTION" }, 400);

    const auth = await authorizeProjectRequest(db, request, body, "commercial");
    if (!auth.ok) return json({ error: auth.error }, auth.status);

    const pid = auth.projectId;
    const [project, mods, g, tier, prov, sizes, pkg, pricing, quotes, sites, specs, ref] =
      await Promise.all([
        db
          .from("core_projects")
          .select("project_code,project_name")
          .eq("id", pid)
          .maybeSingle(),
        db
          .from("drying_yard_module_registry")
          .select("module_code,label_th,label_en,route,audience,sort_order,is_active,note")
          .eq("project_id", pid)
          .eq("is_active", true)
          .order("sort_order"),
        db
          .from("drying_yard_commercial_g_summary_v")
          .select("installation_type,site_count,total_price_vat,avg_price_vat")
          .eq("project_id", pid)
          .order("installation_type"),
        db
          .from("drying_yard_commercial_tier_summary_v")
          .select("tier,site_count,concrete_unit_cost,total_price_vat,avg_price_vat")
          .eq("project_id", pid)
          .order("tier"),
        db
          .from("drying_yard_commercial_province_summary_v")
          .select("province,site_count,district_count,total_price_vat,avg_price_vat,avg_concrete_unit_cost")
          .eq("project_id", pid)
          .order("total_price_vat", { ascending: false }),
        db
          .from("drying_yard_size_profiles")
          .select("code,name,width_m,length_m,is_standard,active")
          .eq("project_id", pid)
          .eq("active", true)
          .order("width_m"),
        db
          .from("drying_yard_commercial_package_catalog")
          .select("installation_type,display_name,components,pole_type,pole_qty,status,note")
          .eq("project_id", pid)
          .eq("status", "active")
          .order("installation_type"),
        db
          .from("drying_yard_pricing_settings")
          .select("gross_margin,vat_rate,rb19_base,rb19_labor,tier_b_markup,tier_c_markup,rates,updated_at")
          .eq("project_id", pid)
          .maybeSingle(),
        db
          .from("drying_yard_customer_quotes")
          .select("site_id,final_price_vat,quote_status,updated_at")
          .eq("project_id", pid),
        db
          .from("core_installation_sites")
          .select("id,installation_type,location_id")
          .eq("project_id", pid),
        db
          .from("drying_yard_site_specs")
          .select("site_id,tier,concrete_unit_cost")
          .eq("project_id", pid),
        db
          .from("drying_yard_commercial_reference_prices")
          .select("catalog_version,installation_type,area_m2,tier,reference_price_vat,source_type,source_note,approved_for_quote,updated_at")
          .eq("project_id", pid)
          .order("installation_type")
          .order("area_m2")
          .order("tier"),
      ]);

    for (const result of [project, mods, g, tier, prov, sizes, pkg, pricing, quotes, sites, specs, ref]) {
      if (result.error) throw result.error;
    }

    const quoteRows = quotes.data || [];
    const totalVat = quoteRows.reduce((sum: number, row: any) => sum + n(row.final_price_vat), 0);
    const published = quoteRows.filter((row: any) => row.quote_status === "published").length;
    const specMap = new Map((specs.data || []).map((row: any) => [row.site_id, row]));
    const quoteMap = new Map(quoteRows.map((row: any) => [row.site_id, row]));
    const matrix: any[] = [];

    for (const installationType of ["G63", "G64"]) {
      for (const tierCode of ["A", "B", "C"]) {
        const rows = (sites.data || []).filter(
          (site: any) =>
            site.installation_type === installationType &&
            (specMap.get(site.id) as any)?.tier === tierCode,
        );
        const values = rows
          .map((site: any) => n((quoteMap.get(site.id) as any)?.final_price_vat))
          .filter((value: number) => value > 0);

        matrix.push({
          installation_type: installationType,
          tier: tierCode,
          current_assigned_area_m2: 192,
          site_count: rows.length,
          avg_price_vat: values.length
            ? values.reduce((sum: number, value: number) => sum + value, 0) / values.length
            : null,
          source: "live_project_quotes",
        });
      }
    }

    const refRows = (ref.data || []).map((row: any) => ({
      ...row,
      reference_price_vat: n(row.reference_price_vat),
      approved_for_quote: Boolean(row.approved_for_quote),
    }));

    return json({
      ok: true,
      project_id: pid,
      auth_mode: auth.authMode,
      label: project.data?.project_name || project.data?.project_code || pid,
      modules: mods.data || [],
      summary: {
        site_count: (sites.data || []).length,
        quote_count: quoteRows.length,
        published_quotes: published,
        total_quote_vat: totalVat,
        gross_margin: n(pricing.data?.gross_margin),
        vat_rate: n(pricing.data?.vat_rate),
      },
      g_summary: g.data || [],
      tier_summary: tier.data || [],
      province_summary: prov.data || [],
      size_catalog: (sizes.data || []).map((row: any) => ({
        ...row,
        area_m2: n(row.width_m) * n(row.length_m),
      })),
      package_catalog: pkg.data || [],
      pricing_settings: pricing.data || null,
      live_matrix: matrix,
      reference_catalog: {
        catalog_version: refRows[0]?.catalog_version || null,
        approved_for_quote:
          refRows.length > 0 && refRows.every((row: any) => row.approved_for_quote),
        rows: refRows,
      },
      source_note:
        "Live Project Baseline remains the financial source of truth. The uploaded infographic price matrix is stored as a reference catalog and is not approved for automatic quotation.",
    });
  } catch (error) {
    console.error(error);
    return json(
      {
        error: "SERVER_ERROR",
        detail: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
