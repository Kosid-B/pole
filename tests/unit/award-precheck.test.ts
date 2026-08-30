import { buildAwardPrecheck } from "@/lib/award-precheck";
import type { FinancialGuardrail } from "@/lib/pm-financial-guardrail";
import type { ProcurementRfqOverview } from "@/lib/supplier-sourcing";

function financial(overrides: Partial<FinancialGuardrail> = {}): FinancialGuardrail {
  return {
    ok: true,
    label: "test",
    pass: true,
    gm_gate: {
      pass: true,
      target_gm: 0.32,
      forecast_gm: 0.32,
      forecast_eac: 68,
      commitment_overrun: 0,
      awarded_procurement_saving: 0,
      max_incremental_cost_before_breach: 0,
      required_cost_recovery: 0,
      trigger: "GM >= 32%",
    },
    cash_gate: {
      pass: true,
      min_cash: 12,
      min_cash_day: 7,
      safety_reserve: 10,
      cash_buffer_above_reserve: 2,
      funding_gap: 0,
      closing_cash: 20,
      trigger: "cash >= reserve",
    },
    triggers: {
      minimum_safe_advance_pct: 25,
      max_safe_client_payment_lag_days: 14,
      max_safe_claim_cycle_days: 14,
      max_safe_batch_size_sites: 25,
      safety_reserve_pct: 10,
      safety_reserve_amount: 10,
      confirmed_customer_direct_funding_pct: 25,
      note: "test",
    },
    cashflow: {
      min_cash: 12,
      min_cash_day: 7,
      safety_reserve: 10,
      cash_buffer_above_reserve: 2,
      funding_gap: 0,
      closing_cash: 20,
      project_days: 30,
      direct_customer_funding: 25,
      weekly: [],
    },
    settings: {
      contract_mode: "private",
      advance_target_pct: 25,
      client_payment_lag_days: 14,
      claim_cycle_days: 14,
      retention_pct: 5,
      supplier_credit_days_default: 0,
      safety_buffer_pct: 10,
      batch_size_sites: 25,
      batch_start_interval_days: 7,
    },
    model_status: {
      total_sites: 1,
      bac: 68,
      sale_pre_vat: 100,
      base_gm: 0.32,
      awarded_volume_m3: 0,
      total_volume_m3: 10,
      awarded_procurement_saving: 0,
    },
    ...overrides,
  };
}

function rfq(readyCount = 2): ProcurementRfqOverview {
  const bids = [
    { slot: "A", tdc: 2000 },
    { slot: "B", tdc: 2100 },
    { slot: "C", tdc: 2200 },
  ].map((item, index) => ({
    id: `bid-${item.slot}`,
    cluster_id: "cluster-1",
    supplier_slot: item.slot as "A" | "B" | "C",
    supplier_name: `Supplier ${item.slot}`,
    plant_location: "Plant",
    base_rate: item.tdc,
    freight_per_m3: 0,
    pump_per_m3: 0,
    waiting_per_m3: 0,
    short_load_per_m3: 0,
    cash_discount_per_m3: 0,
    volume_rebate_per_m3: 0,
    schedule_discount_per_m3: 0,
    other_adjustment_per_m3: 0,
    capacity_m3_day: 100,
    lead_time_days: 1,
    payment_terms: "30 days",
    quotation_ref: `Q-${item.slot}`,
    valid_until: "2099-12-31",
    bid_status: "confirmed",
    note: null,
    effective_delivered_cost: item.tdc,
    quote_valid: true,
    award_ready: index < readyCount,
    rfq_missing: index < readyCount ? [] : ["capacity"],
  }));

  return {
    ok: true,
    label: "test",
    summary: {
      clusters: 1,
      bid_slots: 3,
      rfq_sent: 0,
      quoted: 3,
      confirmed: 3,
      award_ready: readyCount,
    },
    clusters: [
      {
        id: "cluster-1",
        material_group: "CONCRETE_240KSC",
        cluster_name: "Cluster 1",
        province: "เชียงใหม่",
        forecast_sites: 10,
        forecast_volume_m3: 100,
        benchmark_delivered_rate: 2300,
        target_saving_per_m3: 100,
        target_rate: 2200,
        rfq_status: "quoted",
        awarded_supplier_name: null,
        awarded_effective_rate: null,
        quoted_count: 3,
        confirmed_count: 3,
        award_ready_count: readyCount,
        bids,
      },
    ],
    formula: "TDC",
  };
}

describe("buildAwardPrecheck", () => {
  it("passes only when supplier pair, GM, cash and customer funding all pass", () => {
    const result = buildAwardPrecheck(rfq(2), financial());

    expect(result.pass).toBe(true);
    expect(result.status).toBe("READY_FOR_MANUAL_APPROVAL");
    expect(result.clusters[0].primary_candidate?.supplier_name).toBe("Supplier A");
    expect(result.clusters[0].backup_candidate?.supplier_name).toBe("Supplier B");
    expect(result.clusters[0].candidate_spread_per_m3).toBe(100);
  });

  it("blocks when a cluster does not have both primary and backup candidates", () => {
    const result = buildAwardPrecheck(rfq(1), financial());

    expect(result.pass).toBe(false);
    expect(result.gates.supplier_pair).toBe(false);
    expect(result.blockers.join(" ")).toContain("Primary + Backup");
  });

  it("blocks inactive customer funding even when GM and rolling cash pass", () => {
    const base = financial();
    const result = buildAwardPrecheck(
      rfq(2),
      financial({
        triggers: {
          ...base.triggers,
          confirmed_customer_direct_funding_pct: 0,
        },
      }),
    );

    expect(result.pass).toBe(false);
    expect(result.gates.customer_funding).toBe(false);
    expect(result.gates.framework_activation).toBe(false);
  });

  it("blocks GM below the 32% hard floor even if the upstream pass flag is true", () => {
    const base = financial();
    const result = buildAwardPrecheck(
      rfq(2),
      financial({
        gm_gate: {
          ...base.gm_gate,
          pass: true,
          forecast_gm: 0.3199,
        },
      }),
    );

    expect(result.gates.gm).toBe(false);
    expect(result.pass).toBe(false);
  });
});
