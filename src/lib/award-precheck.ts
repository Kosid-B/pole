import type { FinancialGuardrail } from "@/lib/pm-financial-guardrail";
import type {
  ProcurementRfqBid,
  ProcurementRfqOverview,
} from "@/lib/supplier-sourcing";

export type AwardCandidate = {
  bid_id: string;
  supplier_slot: string;
  supplier_name: string;
  tdc_per_m3: number;
  capacity_m3_day: number;
  lead_time_days: number;
  payment_terms: string;
  quotation_ref: string;
  valid_until: string;
};

export type ClusterAwardPrecheck = {
  cluster_id: string;
  cluster_name: string;
  province: string;
  forecast_sites: number;
  forecast_volume_m3: number;
  target_rate: number;
  confirmed_candidates: number;
  award_ready_candidates: number;
  supplier_gate_pass: boolean;
  primary_candidate: AwardCandidate | null;
  backup_candidate: AwardCandidate | null;
  candidate_spread_per_m3: number | null;
  blockers: string[];
};

export type AwardPrecheck = {
  pass: boolean;
  status: "BLOCKED" | "READY_FOR_MANUAL_APPROVAL";
  gates: {
    supplier_pair: boolean;
    gm: boolean;
    rolling_cash: boolean;
    customer_funding: boolean;
    framework_activation: boolean;
  };
  summary: {
    clusters: number;
    clusters_with_primary_backup: number;
    award_ready_bids: number;
    forecast_gm: number;
    target_gm: number;
    min_cash: number;
    safety_reserve: number;
    funding_gap: number;
    confirmed_customer_direct_funding_pct: number;
  };
  clusters: ClusterAwardPrecheck[];
  blockers: string[];
  rule: string;
};

function toCandidate(bid: ProcurementRfqBid): AwardCandidate {
  return {
    bid_id: bid.id,
    supplier_slot: bid.supplier_slot,
    supplier_name: bid.supplier_name || `Supplier ${bid.supplier_slot}`,
    tdc_per_m3: bid.effective_delivered_cost,
    capacity_m3_day: Number(bid.capacity_m3_day || 0),
    lead_time_days: Number(bid.lead_time_days || 0),
    payment_terms: bid.payment_terms || "",
    quotation_ref: bid.quotation_ref || "",
    valid_until: bid.valid_until || "",
  };
}

export function buildAwardPrecheck(
  rfq: ProcurementRfqOverview,
  financial: FinancialGuardrail,
): AwardPrecheck {
  const clusters = rfq.clusters.map<ClusterAwardPrecheck>((cluster) => {
    const ready = cluster.bids
      .filter((bid) => bid.award_ready)
      .sort((a, b) => a.effective_delivered_cost - b.effective_delivered_cost);

    const primary = ready[0] ? toCandidate(ready[0]) : null;
    const backup = ready[1] ? toCandidate(ready[1]) : null;
    const blockers: string[] = [];

    if (ready.length === 0) {
      blockers.push("ยังไม่มี Confirmed RFQ ที่ข้อมูลครบและใบเสนอราคายังมีผล");
    } else if (ready.length === 1) {
      blockers.push("มีผู้ขายพร้อมเพียง 1 ราย ต้องมี Primary + Backup อย่างน้อย 2 ราย");
    }

    return {
      cluster_id: cluster.id,
      cluster_name: cluster.cluster_name,
      province: cluster.province,
      forecast_sites: cluster.forecast_sites,
      forecast_volume_m3: cluster.forecast_volume_m3,
      target_rate: cluster.target_rate,
      confirmed_candidates: cluster.confirmed_count,
      award_ready_candidates: ready.length,
      supplier_gate_pass: ready.length >= 2,
      primary_candidate: primary,
      backup_candidate: backup,
      candidate_spread_per_m3:
        primary && backup ? backup.tdc_per_m3 - primary.tdc_per_m3 : null,
      blockers,
    };
  });

  const supplierPairPass =
    clusters.length > 0 && clusters.every((cluster) => cluster.supplier_gate_pass);
  const gmPass = financial.gm_gate.pass && financial.gm_gate.forecast_gm >= 0.32;
  const cashPass =
    financial.cash_gate.pass &&
    financial.cash_gate.min_cash >= financial.cash_gate.safety_reserve;
  const confirmedFundingPct =
    financial.triggers.confirmed_customer_direct_funding_pct || 0;
  const customerFundingPass = confirmedFundingPct > 0;
  const frameworkActivationPass =
    supplierPairPass && gmPass && cashPass && customerFundingPass;
  const pass = frameworkActivationPass;

  const blockers: string[] = [];
  if (!supplierPairPass) {
    blockers.push("Supplier Gate: ทุก Cluster ต้องมี Award-ready Primary + Backup อย่างน้อย 2 ราย");
  }
  if (!gmPass) {
    blockers.push("GM Gate: Forecast Gross Margin ต้องไม่ต่ำกว่า 32.00%");
  }
  if (!cashPass) {
    blockers.push("Cash Gate: Minimum Rolling Cash ต้องไม่ต่ำกว่า Safety Reserve");
  }
  if (!customerFundingPass) {
    blockers.push("Funding Gate: Customer Direct Pay / Material Advance ต้อง Active หรือ Confirmed ก่อนนับเป็นเงินทุน");
  }

  return {
    pass,
    status: pass ? "READY_FOR_MANUAL_APPROVAL" : "BLOCKED",
    gates: {
      supplier_pair: supplierPairPass,
      gm: gmPass,
      rolling_cash: cashPass,
      customer_funding: customerFundingPass,
      framework_activation: frameworkActivationPass,
    },
    summary: {
      clusters: clusters.length,
      clusters_with_primary_backup: clusters.filter((cluster) => cluster.supplier_gate_pass).length,
      award_ready_bids: rfq.summary.award_ready,
      forecast_gm: financial.gm_gate.forecast_gm,
      target_gm: financial.gm_gate.target_gm,
      min_cash: financial.cash_gate.min_cash,
      safety_reserve: financial.cash_gate.safety_reserve,
      funding_gap: financial.cash_gate.funding_gap,
      confirmed_customer_direct_funding_pct: confirmedFundingPct,
    },
    clusters,
    blockers,
    rule:
      "TDC → GM ≥ 32% → Rolling Cash ≥ Safety Reserve → Capacity/Lead Time → Payment Terms → Primary + Backup → Manual Approval. This pre-check never awards a supplier automatically.",
  };
}
