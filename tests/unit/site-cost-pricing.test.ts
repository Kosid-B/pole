import { describe, expect, it } from "vitest";
import { calculateSellingPrice } from "@/lib/site-cost/pricing";

describe("calculateSellingPrice", () => {
  it("uses Gross Margin rather than markup", () => {
    const result = calculateSellingPrice({
      fixedCost: 128148,
      concreteCost: 66060,
      rb19MaterialCost: 3478.592,
      rb19LaborCost: 405.479256,
      freightCost: 1000,
      grossMargin: 0.32,
      vatRate: 0.07,
    });

    expect(result.costBase).toBeCloseTo(199092.071256, 3);
    expect(result.salePreVat).toBeCloseTo(292782.457729, 3);
    expect(result.finalPriceVat).toBeCloseTo(313277.229770, 3);
  });

  it("rejects GM outside 25-32%", () => {
    expect(() =>
      calculateSellingPrice({
        fixedCost: 1,
        concreteCost: 1,
        rb19MaterialCost: 1,
        rb19LaborCost: 1,
        freightCost: 1,
        grossMargin: 0.4,
        vatRate: 0.07,
      }),
    ).toThrow(RangeError);
  });
});
