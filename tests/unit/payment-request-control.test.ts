// @vitest-environment node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260901011922_supplier_payment_request_cash_reservation.sql"),
  "utf8",
);
const edgeFunction = readFileSync(
  resolve(process.cwd(), "supabase/functions/drying-yard-payment-request-api/index.ts"),
  "utf8",
);

describe("supplier payment request cash reservation controls", () => {
  it("requires payment eligibility and reserves the exact gross invoice amount", () => {
    expect(migration).toContain("v_invoice.status <> 'payment_eligible'");
    expect(migration).toContain("match_pass = true");
    expect(migration).toContain("v_invoice.gross_amount");
    expect(migration).toContain("PAYMENT_REQUEST_AMOUNT_MISMATCH");
  });

  it("blocks cash reservation below the financial guardrails", () => {
    expect(migration).toContain("p_live_forecast_gm >= p_gm_floor");
    expect(migration).toContain("p_gm_floor >= 0.32");
    expect(migration).toContain("v_projected_min_cash >= p_safety_reserve");
    expect(migration).toContain("FINANCIAL_GUARDRAIL_BLOCK");
    expect(edgeFunction).toContain("drying-yard-pm-guardrail-api");
  });

  it("keeps review evidence append-only and service-role only", () => {
    expect(migration).toContain("PAYMENT_REQUEST_REVIEW_IMMUTABLE");
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("to service_role");
    expect(migration).toContain("'no_auto_pay',true");
  });
});
