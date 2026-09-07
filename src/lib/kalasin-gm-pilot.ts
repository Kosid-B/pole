import "server-only";

type LoadResult<T> =
  | { configured: true; data: T; error: null }
  | { configured: false; data: null; error: string }
  | { configured: true; data: null; error: string };

export type KalasinSavingsRow = {
  material_group: string;
  item_code: string;
  source_ref: string;
  qty: number;
  unit: string;
  baseline_unit_cost_pre_vat: number;
  quoted_unit_cost_pre_vat: number;
  potential_saving_pre_vat: number;
  evidence_status: "market_reference" | "candidate_spec_review" | "confirmed";
  note: string | null;
};

export type KalasinSpecReview = {
  id: string;
  material_group: string;
  quotation_ref: string;
  supplier_name: string;
  required_spec: string;
  offered_spec: string;
  review_status: "pending" | "approved" | "rejected";
  evidence_ref: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
};

export type KalasinCluster = {
  id: string;
  material_group: string;
  cluster_name: string;
  forecast_sites: number;
  forecast_volume_m3: number;
  rfq_status: string;
  target_gm: number;
  note: string | null;
};

export type KalasinBid = {
  id: string;
  cluster_id: string;
  supplier_slot: string;
  supplier_directory_id: string | null;
  supplier_name: string | null;
  plant_location: string | null;
  base_rate: number;
  quotation_ref: string | null;
  valid_until: string | null;
  bid_status: string;
  note: string | null;
};

export type KalasinPilot = {
  ok: true;
  province: string;
  summary: {
    sites: number;
    gate_counts: Record<string, number>;
    active_quote_groups_min: number;
    market_reference_lines_min: number;
    spec_review_required_sites: number;
    evidence_backed_saving_pre_vat: number;
    candidate_saving_pre_vat: number;
  };
  reviews: KalasinSpecReview[];
  savings: KalasinSavingsRow[];
  clusters: KalasinCluster[];
  bids: KalasinBid[];
  sites: Array<Record<string, unknown>>;
  rule: string;
};

const GM_API_URL =
  process.env.DRYING_YARD_GM_API_URL?.trim() ||
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-gm-api";

export async function getKalasinGmPilot(): Promise<LoadResult<KalasinPilot>> {
  const code = process.env.DRYING_YARD_ADMIN_ACCESS_CODE?.trim();
  if (!code) {
    return { configured: false, data: null, error: "Set DRYING_YARD_ADMIN_ACCESS_CODE in the server environment." };
  }
  try {
    const response = await fetch(GM_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, action: "kalasin_pilot" }),
      cache: "no-store",
    });
    const body = (await response.json()) as KalasinPilot & { error?: string; detail?: string };
    if (!response.ok) {
      return { configured: true, data: null, error: body.detail || body.error || `GM API returned HTTP ${response.status}` };
    }
    return { configured: true, data: body, error: null };
  } catch (error) {
    return { configured: true, data: null, error: error instanceof Error ? error.message : "Unable to load Kalasin GM pilot" };
  }
}
