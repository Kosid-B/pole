export type SiteCostInput = {
  fixedCost: number;
  concreteCost: number;
  rb19MaterialCost: number;
  rb19LaborCost: number;
  freightCost: number;
  grossMargin: number;
  vatRate: number;
};

export type SiteCostResult = {
  costBase: number;
  salePreVat: number;
  grossProfit: number;
  vatAmount: number;
  finalPriceVat: number;
};

export function calculateSellingPrice(input: SiteCostInput): SiteCostResult {
  if (input.grossMargin < 0.25 || input.grossMargin > 0.32) {
    throw new RangeError("grossMargin must be between 0.25 and 0.32");
  }

  if (input.vatRate < 0 || input.vatRate > 1) {
    throw new RangeError("vatRate must be between 0 and 1");
  }

  const costBase =
    input.fixedCost +
    input.concreteCost +
    input.rb19MaterialCost +
    input.rb19LaborCost +
    input.freightCost;

  const salePreVat = costBase / (1 - input.grossMargin);
  const grossProfit = salePreVat - costBase;
  const vatAmount = salePreVat * input.vatRate;
  const finalPriceVat = salePreVat + vatAmount;

  return { costBase, salePreVat, grossProfit, vatAmount, finalPriceVat };
}
