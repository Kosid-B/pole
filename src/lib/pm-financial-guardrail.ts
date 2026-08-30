import "server-only";

export type FinancialSettings = {
  contract_mode: "unknown" | "private" | "public_procurement";
  advance_target_pct: number;
  client_payment_lag_days: number;
  claim_cycle_days: number;
  retention_pct: number;
  supplier_credit_days_default: number;
  safety_buffer_pct: number;
  batch_size_sites: number;
  batch_start_interval_days: number;
};

export type FinancialGuardrail = {
  ok: boolean;
  label: string;
  pass: boolean;
  gm_gate: {
    pass: boolean;
    target_gm: number;
    forecast_gm: number;
    forecast_eac: number;
    commitment_overrun: number;
    awarded_procurement_saving: number;
    max_incremental_cost_before_breach: number;
    required_cost_recovery: number;
    trigger: string;
  };
  cash_gate: {
    pass: boolean;
    min_cash: number;
    min_cash_day: number;
    safety_reserve: number;
    cash_buffer_above_reserve: number;
    funding_gap: number;
    closing_cash: number;
    trigger: string;
  };
  triggers: {
    minimum_safe_advance_pct: number;
    max_safe_client_payment_lag_days: number;
    max_safe_claim_cycle_days: number;
    max_safe_batch_size_sites: number;
    safety_reserve_pct: number;
    safety_reserve_amount: number;
    confirmed_customer_direct_funding_pct: number;
    note: string;
  };
  cashflow: {
    min_cash: number;
    min_cash_day: number;
    safety_reserve: number;
    cash_buffer_above_reserve: number;
    funding_gap: number;
    closing_cash: number;
    project_days: number;
    direct_customer_funding: number;
    weekly: Array<{
      week: number;
      inflow: number;
      outflow: number;
      closing_cash: number;
    }>;
  };
  settings: FinancialSettings;
  model_status: {
    total_sites: number;
    bac: number;
    sale_pre_vat: number;
    base_gm: number;
    awarded_volume_m3: number;
    total_volume_m3: number;
    awarded_procurement_saving: number;
  };
};

type LoadResult<T> =
  | { configured: true; data: T; error: null }
  | { configured: false; data: null; error: string }
  | { configured: true; data: null; error: string };

const API_URL =
  process.env.DRYING_YARD_PM_GUARDRAIL_API_URL?.trim() ||
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-pm-guardrail-api";

async function callGuardrail(
  action: "overview" | "simulate" | "apply",
  overrides: Partial<FinancialSettings> = {},
): Promise<LoadResult<FinancialGuardrail>> {
  const code = process.env.DRYING_YARD_ADMIN_ACCESS_CODE?.trim();

  if (!code) {
    return {
      configured: false,
      data: null,
      error:
        "Set DRYING_YARD_ADMIN_ACCESS_CODE in the server environment. The access code is never sent to the browser.",
    };
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, action, ...overrides }),
      cache: "no-store",
    });

    const payload = (await response.json()) as FinancialGuardrail & {
      error?: string;
      detail?: string;
      message?: string;
    };

    if (!response.ok) {
      return {
        configured: true,
        data: null,
        error:
          payload.message ||
          payload.detail ||
          payload.error ||
          `PM guardrail API returned HTTP ${response.status}`,
      };
    }

    return { configured: true, data: payload, error: null };
  } catch (error) {
    return {
      configured: true,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unable to load PM financial guardrails",
    };
  }
}

export function getPmFinancialGuardrail(
  overrides: Partial<FinancialSettings> = {},
) {
  const action = Object.keys(overrides).length > 0 ? "simulate" : "overview";
  return callGuardrail(action, overrides);
}

export function applyPmFinancialStructure(
  overrides: Partial<FinancialSettings>,
) {
  return callGuardrail("apply", overrides);
}
