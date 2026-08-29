export type DryingYardReservation = {
  id: string;
  site_id: string;
  team_name: string | null;
  area_m2: number | null;
  requested_install_date: string | null;
  installation_fee_total: number | null;
  status: string;
};

export type DryingYardPricing = {
  cost_base: number | null;
  sale_pre_vat: number | null;
  gross_profit: number | null;
  vat_amount: number | null;
  final_price_vat: number | null;
};

export type DryingYardSite = {
  id: string;
  site_code: string;
  installation_type: "G63" | "G64" | string;
  province: string;
  district: string;
  tier: "A" | "B" | "C" | string;
  concrete_unit_cost: number | null;
  reservation: DryingYardReservation | null;
  pricing: DryingYardPricing | null;
};

export type DryingYardPricingSettings = {
  gross_margin: number | null;
  vat_rate: number | null;
  updated_at: string | null;
};

export type DryingYardOverview = {
  ok: boolean;
  sites: DryingYardSite[];
  reservations: DryingYardReservation[];
  pricing_settings: DryingYardPricingSettings | null;
};

export type DryingYardLoadResult =
  | { configured: true; data: DryingYardOverview; error: null }
  | { configured: false; data: null; error: string }
  | { configured: true; data: null; error: string };

const DEFAULT_ADMIN_API_URL =
  "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-admin-api";

export async function getDryingYardOverview(): Promise<DryingYardLoadResult> {
  const username = process.env.DRYING_YARD_ADMIN_USERNAME?.trim();
  const password = process.env.DRYING_YARD_ADMIN_PASSWORD;
  const apiUrl =
    process.env.DRYING_YARD_ADMIN_API_URL?.trim() || DEFAULT_ADMIN_API_URL;

  if (!username || !password) {
    return {
      configured: false,
      data: null,
      error:
        "Drying-yard integration is not configured. Set DRYING_YARD_ADMIN_USERNAME and DRYING_YARD_ADMIN_PASSWORD in the server environment.",
    };
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, action: "overview" }),
      cache: "no-store",
    });

    const payload = (await response.json()) as
      | DryingYardOverview
      | { error?: string; detail?: string };

    if (!response.ok || !("sites" in payload)) {
      const message =
        ("detail" in payload && payload.detail) ||
        ("error" in payload && payload.error) ||
        `Drying-yard API returned HTTP ${response.status}`;

      return { configured: true, data: null, error: message };
    }

    return { configured: true, data: payload, error: null };
  } catch (error) {
    return {
      configured: true,
      data: null,
      error: error instanceof Error ? error.message : "Unable to load drying-yard data",
    };
  }
}

export function summarizeDryingYard(sites: DryingYardSite[]) {
  const summary = {
    siteCount: sites.length,
    g63: 0,
    g64: 0,
    pending: 0,
    approved: 0,
    free: 0,
    provinceCount: new Set<string>(),
    districtCount: new Set<string>(),
    cost: 0,
    salePreVat: 0,
    vat: 0,
    finalPrice: 0,
    profit: 0,
  };

  for (const site of sites) {
    if (site.installation_type === "G63") summary.g63 += 1;
    if (site.installation_type === "G64") summary.g64 += 1;

    if (site.province) summary.provinceCount.add(site.province);
    if (site.province && site.district) {
      summary.districtCount.add(`${site.province}|${site.district}`);
    }

    const reservationStatus = site.reservation?.status;
    if (reservationStatus === "pending") summary.pending += 1;
    else if (reservationStatus === "approved") summary.approved += 1;
    else summary.free += 1;

    summary.cost += Number(site.pricing?.cost_base || 0);
    summary.salePreVat += Number(site.pricing?.sale_pre_vat || 0);
    summary.vat += Number(site.pricing?.vat_amount || 0);
    summary.finalPrice += Number(site.pricing?.final_price_vat || 0);
    summary.profit += Number(site.pricing?.gross_profit || 0);
  }

  return {
    ...summary,
    provinceCount: summary.provinceCount.size,
    districtCount: summary.districtCount.size,
  };
}

export function getProvinceRollup(sites: DryingYardSite[]) {
  const provinces = new Map<
    string,
    {
      province: string;
      sites: number;
      g63: number;
      g64: number;
      pending: number;
      approved: number;
      cost: number;
      finalPrice: number;
      profit: number;
    }
  >();

  for (const site of sites) {
    const province = site.province || "ไม่ระบุจังหวัด";
    const row = provinces.get(province) || {
      province,
      sites: 0,
      g63: 0,
      g64: 0,
      pending: 0,
      approved: 0,
      cost: 0,
      finalPrice: 0,
      profit: 0,
    };

    row.sites += 1;
    if (site.installation_type === "G63") row.g63 += 1;
    if (site.installation_type === "G64") row.g64 += 1;
    if (site.reservation?.status === "pending") row.pending += 1;
    if (site.reservation?.status === "approved") row.approved += 1;
    row.cost += Number(site.pricing?.cost_base || 0);
    row.finalPrice += Number(site.pricing?.final_price_vat || 0);
    row.profit += Number(site.pricing?.gross_profit || 0);

    provinces.set(province, row);
  }

  return [...provinces.values()].sort(
    (a, b) => b.finalPrice - a.finalPrice || b.sites - a.sites,
  );
}
