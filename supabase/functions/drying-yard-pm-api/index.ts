import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import {
  authorizeProjectRequest,
  type SiteCostRequiredModule,
} from "../_shared/sitecost-project-auth.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: cors });
const num = (value: unknown) => Number(value ?? 0);
const effectiveDeliveredCost = (bid: any) =>
  num(bid?.base_rate) +
  num(bid?.freight_per_m3) +
  num(bid?.pump_per_m3) +
  num(bid?.waiting_per_m3) +
  num(bid?.short_load_per_m3) -
  num(bid?.cash_discount_per_m3) -
  num(bid?.volume_rebate_per_m3) -
  num(bid?.schedule_discount_per_m3) +
  num(bid?.other_adjustment_per_m3);

const pmActions = new Set(["overview", "update_settings", "update_term"]);
const procurementActions = new Set([
  "procurement_overview",
  "update_cluster",
  "update_bid",
  "update_funding",
  "award_bid",
]);

function requiredModuleForAction(action: string): SiteCostRequiredModule | null {
  if (pmActions.has(action)) return "pm";
  if (procurementActions.has(action)) return "procurement";
  return null;
}

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
    const requiredModule = requiredModuleForAction(action);

    if (!requiredModule) return json({ error: "UNKNOWN_ACTION" }, 400);

    const auth = await authorizeProjectRequest(db, request, body, requiredModule);
    if (!auth.ok) return json({ error: auth.error }, auth.status);

    const pid = auth.projectId;
    const scope = {
      project_id: pid,
      auth_mode: auth.authMode,
    };

    if (action === "overview") {
      const [packageResult, termResult, settingsResult, pricingResult, quoteResult] =
        await Promise.all([
          db
            .from("drying_yard_pm_package_budget")
            .select("package_code,package_name,budget_amount,material_amount,labor_service_amount,planned_work_week")
            .eq("project_id", pid)
            .order("planned_work_week"),
          db
            .from("drying_yard_pm_commitment_terms")
            .select("package_code,package_name,supplier_name,po_no,planned_work_week,supplier_credit_days,deposit_pct,lead_time_days,actual_committed_amount,actual_paid_amount,status,note,updated_at")
            .eq("project_id", pid)
            .order("planned_work_week"),
          db
            .from("drying_yard_pm_cashflow_settings")
            .select("project_id,contract_mode,advance_target_pct,client_payment_lag_days,claim_cycle_days,retention_pct,supplier_credit_days_default,safety_buffer_pct,batch_size_sites,batch_start_interval_days,updated_at")
            .eq("project_id", pid)
            .maybeSingle(),
          db
            .from("drying_yard_internal_pricing")
            .select("cost_base,sale_pre_vat,gross_profit,vat_amount,final_price_vat,concrete_cost")
            .eq("project_id", pid),
          db
            .from("drying_yard_customer_quotes")
            .select("final_price_vat,quote_status")
            .eq("project_id", pid),
        ]);

      for (const result of [
        packageResult,
        termResult,
        settingsResult,
        pricingResult,
        quoteResult,
      ]) {
        if (result.error) throw result.error;
      }

      const packages = packageResult.data || [];
      const terms = termResult.data || [];
      const pricingRows = pricingResult.data || [];
      const totals = pricingRows.reduce(
        (acc: any, row: any) => {
          acc.cost += num(row.cost_base);
          acc.sale += num(row.sale_pre_vat);
          acc.gp += num(row.gross_profit);
          acc.vat += num(row.vat_amount);
          acc.final += num(row.final_price_vat);
          acc.concrete += num(row.concrete_cost);
          return acc;
        },
        { cost: 0, sale: 0, gp: 0, vat: 0, final: 0, concrete: 0 },
      );
      totals.gm = totals.sale ? totals.gp / totals.sale : 0;

      const quoteRows = quoteResult.data || [];
      const quoteSummary = {
        count: quoteRows.length,
        published_count: quoteRows.filter((row: any) => row.quote_status === "published").length,
        value_vat: quoteRows.reduce((sum: number, row: any) => sum + num(row.final_price_vat), 0),
      };
      const termMap = new Map(terms.map((row: any) => [row.package_code, row]));
      const mergedPackages = packages.map((pkg: any) => ({
        ...pkg,
        ...(termMap.get(pkg.package_code) || {}),
        budget_amount: num(pkg.budget_amount),
        material_amount: num(pkg.material_amount),
        labor_service_amount: num(pkg.labor_service_amount),
      }));

      return json({
        ok: true,
        ...scope,
        totals,
        quote_summary: quoteSummary,
        settings: settingsResult.data || null,
        packages: mergedPackages,
        assumption_note:
          "Package budgets are derived from the live project pricing model. Supplier terms are PM-entered planning data until confirmed by quotation/PO.",
      });
    }

    if (action === "procurement_overview") {
      const [clusterResult, bidResult, agreementResult, fundingResult] = await Promise.all([
        db
          .from("drying_yard_procurement_clusters")
          .select("id,material_group,cluster_name,province,forecast_sites,forecast_volume_m3,benchmark_delivered_rate,target_saving_per_m3,customer_payment_mode,customer_funded_pct,rfq_status,awarded_supplier_name,awarded_effective_rate,primary_share_pct,backup_share_pct,forecast_window_days,calloff_notice_hours,note,updated_at")
          .eq("project_id", pid)
          .order("forecast_volume_m3", { ascending: false }),
        db
          .from("drying_yard_procurement_bids")
          .select("id,cluster_id,supplier_slot,supplier_name,plant_location,base_rate,freight_per_m3,pump_per_m3,waiting_per_m3,short_load_per_m3,cash_discount_per_m3,volume_rebate_per_m3,schedule_discount_per_m3,other_adjustment_per_m3,capacity_m3_day,lead_time_days,payment_terms,quotation_ref,valid_until,bid_status,note,updated_at")
          .eq("project_id", pid)
          .order("supplier_slot"),
        db
          .from("drying_yard_framework_agreements")
          .select("id,cluster_id,agreement_no,primary_bid_id,backup_bid_id,primary_share_pct,backup_share_pct,effective_from,effective_to,calloff_notice_hours,rolling_forecast_days,price_review_trigger_per_m3,payment_mode,status,note,updated_at")
          .eq("project_id", pid),
        db
          .from("drying_yard_customer_material_funding")
          .select("id,cluster_id,funding_mode,funded_pct,payment_trigger,settlement_days,approved_ceiling,status,note,updated_at")
          .eq("project_id", pid),
      ]);

      for (const result of [clusterResult, bidResult, agreementResult, fundingResult]) {
        if (result.error) throw result.error;
      }

      const bids = (bidResult.data || []).map((bid: any) => ({
        ...bid,
        effective_delivered_cost: effectiveDeliveredCost(bid),
      }));
      const bidMap = new Map<string, any[]>();
      for (const bid of bids) {
        const rows = bidMap.get(bid.cluster_id) || [];
        rows.push(bid);
        bidMap.set(bid.cluster_id, rows);
      }
      const agreementMap = new Map(
        (agreementResult.data || []).map((row: any) => [row.cluster_id, row]),
      );
      const fundingMap = new Map(
        (fundingResult.data || []).map((row: any) => [row.cluster_id, row]),
      );

      const clusters = (clusterResult.data || []).map((cluster: any) => {
        const volume = num(cluster.forecast_volume_m3);
        const benchmark = num(cluster.benchmark_delivered_rate);
        const awardedRate =
          cluster.awarded_effective_rate == null ? null : num(cluster.awarded_effective_rate);

        return {
          ...cluster,
          forecast_sites: num(cluster.forecast_sites),
          forecast_volume_m3: volume,
          benchmark_delivered_rate: benchmark,
          target_saving_per_m3: num(cluster.target_saving_per_m3),
          target_rate: Math.max(0, benchmark - num(cluster.target_saving_per_m3)),
          target_saving_total: volume * num(cluster.target_saving_per_m3),
          awarded_effective_rate: awardedRate,
          awarded_saving_per_m3: awardedRate == null ? 0 : benchmark - awardedRate,
          awarded_saving_total: awardedRate == null ? 0 : (benchmark - awardedRate) * volume,
          bids: bidMap.get(cluster.id) || [],
          agreement: agreementMap.get(cluster.id) || null,
          funding: fundingMap.get(cluster.id) || null,
        };
      });

      const summary = clusters.reduce(
        (acc: any, cluster: any) => {
          acc.clusters += 1;
          acc.sites += cluster.forecast_sites;
          acc.volume += cluster.forecast_volume_m3;
          acc.target_saving += cluster.target_saving_total;
          if (cluster.awarded_effective_rate != null) {
            acc.awarded_clusters += 1;
            acc.awarded_volume += cluster.forecast_volume_m3;
            acc.awarded_saving += cluster.awarded_saving_total;
          }
          return acc;
        },
        {
          clusters: 0,
          sites: 0,
          volume: 0,
          target_saving: 0,
          awarded_clusters: 0,
          awarded_volume: 0,
          awarded_saving: 0,
        },
      );
      summary.coverage_pct = summary.volume ? (summary.awarded_volume / summary.volume) * 100 : 0;
      summary.weighted_awarded_saving_per_m3 = summary.awarded_volume
        ? summary.awarded_saving / summary.awarded_volume
        : 0;

      return json({ ok: true, ...scope, summary, clusters });
    }

    if (action === "update_settings") {
      const allowedModes = ["unknown", "private", "public_procurement"];
      const payload: any = { updated_at: new Date().toISOString() };

      if (body.contract_mode !== undefined) {
        const value = String(body.contract_mode);
        if (!allowedModes.includes(value)) return json({ error: "INVALID_CONTRACT_MODE" }, 400);
        payload.contract_mode = value;
      }

      const ranges: Record<string, [number, number]> = {
        advance_target_pct: [0, 100],
        client_payment_lag_days: [0, 180],
        claim_cycle_days: [1, 90],
        retention_pct: [0, 20],
        supplier_credit_days_default: [0, 180],
        safety_buffer_pct: [0, 50],
        batch_size_sites: [1, 446],
        batch_start_interval_days: [1, 60],
      };
      for (const [key, [low, high]] of Object.entries(ranges)) {
        if (body[key] !== undefined) {
          const value = Number(body[key]);
          if (!Number.isFinite(value) || value < low || value > high) {
            return json({ error: "INVALID_SETTING", field: key }, 400);
          }
          payload[key] = value;
        }
      }

      const { data, error } = await db
        .from("drying_yard_pm_cashflow_settings")
        .upsert({ project_id: pid, ...payload }, { onConflict: "project_id" })
        .select()
        .single();
      if (error) throw error;
      return json({ ok: true, ...scope, settings: data });
    }

    if (action === "update_term") {
      const packageCode = String(body.package_code || "");
      if (!packageCode) return json({ error: "PACKAGE_REQUIRED" }, 400);

      const { data: existing, error: existingError } = await db
        .from("drying_yard_pm_commitment_terms")
        .select("id")
        .eq("project_id", pid)
        .eq("package_code", packageCode)
        .maybeSingle();
      if (existingError) throw existingError;
      if (!existing) return json({ error: "PACKAGE_NOT_FOUND" }, 404);

      const payload: any = { updated_at: new Date().toISOString() };
      for (const key of ["supplier_name", "po_no", "note"]) {
        if (body[key] !== undefined) {
          payload[key] = body[key] === null ? null : String(body[key]).trim() || null;
        }
      }
      const allowedStatuses = [
        "planning",
        "rfq",
        "approved",
        "po_issued",
        "in_progress",
        "closed",
      ];
      if (body.status !== undefined) {
        const value = String(body.status);
        if (!allowedStatuses.includes(value)) return json({ error: "INVALID_STATUS" }, 400);
        payload.status = value;
      }
      const numericRanges: Record<string, [number, number]> = {
        planned_work_week: [0, 52],
        supplier_credit_days: [0, 180],
        deposit_pct: [0, 100],
        lead_time_days: [0, 365],
        actual_committed_amount: [0, 1e12],
        actual_paid_amount: [0, 1e12],
      };
      for (const [key, [low, high]] of Object.entries(numericRanges)) {
        if (body[key] !== undefined) {
          if (body[key] === null || body[key] === "") {
            payload[key] = null;
          } else {
            const value = Number(body[key]);
            if (!Number.isFinite(value) || value < low || value > high) {
              return json({ error: "INVALID_TERM", field: key }, 400);
            }
            payload[key] = value;
          }
        }
      }

      const { data, error } = await db
        .from("drying_yard_pm_commitment_terms")
        .update(payload)
        .eq("project_id", pid)
        .eq("package_code", packageCode)
        .select()
        .single();
      if (error) throw error;
      return json({ ok: true, ...scope, term: data });
    }

    if (action === "update_cluster") {
      const clusterId = String(body.cluster_id || "");
      if (!clusterId) return json({ error: "CLUSTER_REQUIRED" }, 400);

      const payload: any = { updated_at: new Date().toISOString() };
      for (const key of ["customer_payment_mode", "rfq_status", "note"]) {
        if (body[key] !== undefined) {
          payload[key] = body[key] === null ? null : String(body[key]).trim();
        }
      }
      const ranges: Record<string, [number, number]> = {
        target_saving_per_m3: [0, 1000],
        customer_funded_pct: [0, 100],
        primary_share_pct: [0, 100],
        backup_share_pct: [0, 100],
        forecast_window_days: [1, 90],
        calloff_notice_hours: [1, 336],
      };
      for (const [key, [low, high]] of Object.entries(ranges)) {
        if (body[key] !== undefined) {
          const value = Number(body[key]);
          if (!Number.isFinite(value) || value < low || value > high) {
            return json({ error: "INVALID_CLUSTER_FIELD", field: key }, 400);
          }
          payload[key] = value;
        }
      }
      if (
        payload.primary_share_pct !== undefined &&
        payload.backup_share_pct !== undefined &&
        payload.primary_share_pct + payload.backup_share_pct > 100
      ) {
        return json({ error: "INVALID_SHARE_SPLIT" }, 400);
      }

      const { data, error } = await db
        .from("drying_yard_procurement_clusters")
        .update(payload)
        .eq("project_id", pid)
        .eq("id", clusterId)
        .select()
        .single();
      if (error) throw error;
      return json({ ok: true, ...scope, cluster: data });
    }

    if (action === "update_bid") {
      const clusterId = String(body.cluster_id || "");
      const slot = String(body.supplier_slot || "").toUpperCase();
      if (!clusterId || !["A", "B", "C"].includes(slot)) {
        return json({ error: "INVALID_BID_KEY" }, 400);
      }

      const { data: cluster, error: clusterError } = await db
        .from("drying_yard_procurement_clusters")
        .select("id")
        .eq("project_id", pid)
        .eq("id", clusterId)
        .maybeSingle();
      if (clusterError) throw clusterError;
      if (!cluster) return json({ error: "CLUSTER_NOT_FOUND" }, 404);

      const payload: any = { updated_at: new Date().toISOString() };
      for (const key of [
        "supplier_name",
        "plant_location",
        "payment_terms",
        "quotation_ref",
        "bid_status",
        "note",
      ]) {
        if (body[key] !== undefined) {
          payload[key] = body[key] === null ? null : String(body[key]).trim() || null;
        }
      }
      if (body.valid_until !== undefined) {
        payload.valid_until = body.valid_until ? String(body.valid_until) : null;
      }
      const numericKeys = [
        "base_rate",
        "freight_per_m3",
        "pump_per_m3",
        "waiting_per_m3",
        "short_load_per_m3",
        "cash_discount_per_m3",
        "volume_rebate_per_m3",
        "schedule_discount_per_m3",
        "other_adjustment_per_m3",
        "capacity_m3_day",
        "lead_time_days",
      ];
      for (const key of numericKeys) {
        if (body[key] !== undefined) {
          if (body[key] === null || body[key] === "") {
            payload[key] = null;
          } else {
            const value = Number(body[key]);
            if (!Number.isFinite(value) || (key !== "other_adjustment_per_m3" && value < 0)) {
              return json({ error: "INVALID_BID_FIELD", field: key }, 400);
            }
            payload[key] = value;
          }
        }
      }

      const { data, error } = await db
        .from("drying_yard_procurement_bids")
        .update(payload)
        .eq("project_id", pid)
        .eq("cluster_id", clusterId)
        .eq("supplier_slot", slot)
        .select()
        .single();
      if (error) throw error;
      return json({
        ok: true,
        ...scope,
        bid: { ...data, effective_delivered_cost: effectiveDeliveredCost(data) },
      });
    }

    if (action === "update_funding") {
      const clusterId = String(body.cluster_id || "");
      if (!clusterId) return json({ error: "CLUSTER_REQUIRED" }, 400);

      const payload: any = { updated_at: new Date().toISOString() };
      for (const key of ["funding_mode", "payment_trigger", "status", "note"]) {
        if (body[key] !== undefined) {
          payload[key] = body[key] === null ? null : String(body[key]).trim() || null;
        }
      }
      for (const key of ["funded_pct", "settlement_days", "approved_ceiling"]) {
        if (body[key] !== undefined) {
          if (body[key] === null || body[key] === "") {
            payload[key] = null;
          } else {
            const value = Number(body[key]);
            if (!Number.isFinite(value) || value < 0 || (key === "funded_pct" && value > 100)) {
              return json({ error: "INVALID_FUNDING_FIELD", field: key }, 400);
            }
            payload[key] = value;
          }
        }
      }

      const { data, error } = await db
        .from("drying_yard_customer_material_funding")
        .update(payload)
        .eq("project_id", pid)
        .eq("cluster_id", clusterId)
        .select()
        .single();
      if (error) throw error;

      await db
        .from("drying_yard_procurement_clusters")
        .update({
          customer_payment_mode: data.funding_mode,
          customer_funded_pct: data.funded_pct,
          updated_at: new Date().toISOString(),
        })
        .eq("project_id", pid)
        .eq("id", clusterId);

      return json({ ok: true, ...scope, funding: data });
    }

    if (action === "award_bid") {
      const clusterId = String(body.cluster_id || "");
      const primarySlot = String(body.primary_slot || "").toUpperCase();
      const backupSlot = body.backup_slot ? String(body.backup_slot).toUpperCase() : "";
      if (
        !clusterId ||
        !["A", "B", "C"].includes(primarySlot) ||
        (backupSlot && !["A", "B", "C"].includes(backupSlot))
      ) {
        return json({ error: "INVALID_AWARD" }, 400);
      }

      const [{ data: cluster, error: clusterError }, { data: bids, error: bidError }] =
        await Promise.all([
          db
            .from("drying_yard_procurement_clusters")
            .select("id,benchmark_delivered_rate,primary_share_pct,backup_share_pct")
            .eq("project_id", pid)
            .eq("id", clusterId)
            .maybeSingle(),
          db
            .from("drying_yard_procurement_bids")
            .select("*")
            .eq("project_id", pid)
            .eq("cluster_id", clusterId)
            .in("supplier_slot", backupSlot ? [primarySlot, backupSlot] : [primarySlot]),
        ]);
      if (clusterError) throw clusterError;
      if (bidError) throw bidError;
      if (!cluster) return json({ error: "CLUSTER_NOT_FOUND" }, 404);

      const primary = (bids || []).find((row: any) => row.supplier_slot === primarySlot);
      const backup = backupSlot
        ? (bids || []).find((row: any) => row.supplier_slot === backupSlot)
        : null;
      if (!primary?.supplier_name || num(primary.base_rate) <= 0) {
        return json({ error: "PRIMARY_BID_INCOMPLETE" }, 400);
      }
      if (backupSlot && (!backup?.supplier_name || num(backup.base_rate) <= 0)) {
        return json({ error: "BACKUP_BID_INCOMPLETE" }, 400);
      }

      const primaryEffective = effectiveDeliveredCost(primary);
      const backupEffective = backup ? effectiveDeliveredCost(backup) : 0;
      const primaryShare = backup ? num(cluster.primary_share_pct) : 100;
      const backupShare = backup ? num(cluster.backup_share_pct) : 0;
      const weightedRate =
        (primaryEffective * primaryShare + backupEffective * backupShare) /
        Math.max(1, primaryShare + backupShare);
      const supplierLabel = backup
        ? `${primary.supplier_name} ${primaryShare}% / ${backup.supplier_name} ${backupShare}%`
        : primary.supplier_name;
      const now = new Date().toISOString();

      const { error: clusterUpdateError } = await db
        .from("drying_yard_procurement_clusters")
        .update({
          awarded_supplier_name: supplierLabel,
          awarded_effective_rate: weightedRate,
          rfq_status: "awarded",
          updated_at: now,
        })
        .eq("project_id", pid)
        .eq("id", clusterId);
      if (clusterUpdateError) throw clusterUpdateError;

      await db
        .from("drying_yard_procurement_bids")
        .update({ bid_status: "not_awarded", updated_at: now })
        .eq("project_id", pid)
        .eq("cluster_id", clusterId);
      await db
        .from("drying_yard_procurement_bids")
        .update({ bid_status: "awarded_primary", updated_at: now })
        .eq("project_id", pid)
        .eq("id", primary.id);
      if (backup) {
        await db
          .from("drying_yard_procurement_bids")
          .update({ bid_status: "awarded_backup", updated_at: now })
          .eq("project_id", pid)
          .eq("id", backup.id);
      }

      const { data: agreement, error: agreementError } = await db
        .from("drying_yard_framework_agreements")
        .update({
          primary_bid_id: primary.id,
          backup_bid_id: backup?.id || null,
          primary_share_pct: primaryShare,
          backup_share_pct: backupShare,
          payment_mode: "customer_direct_pay",
          status: "active",
          updated_at: now,
        })
        .eq("project_id", pid)
        .eq("cluster_id", clusterId)
        .select()
        .single();
      if (agreementError) throw agreementError;

      return json({
        ok: true,
        ...scope,
        award: {
          supplier_label: supplierLabel,
          effective_rate: weightedRate,
          saving_per_m3: num(cluster.benchmark_delivered_rate) - weightedRate,
          agreement,
        },
      });
    }

    return json({ error: "UNKNOWN_ACTION" }, 400);
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
