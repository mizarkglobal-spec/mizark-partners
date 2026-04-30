export interface ProjectionAssumptions {
  // Funnel inputs — cost per challenge buyer (direct acquisition cost)
  ad_spend_monthly: number[];           // length 36, naira (May 2026 – Apr 2029)
  cpc: number;                          // cost per challenge buyer
  academy_conversion_pct: number;       // % challenge buyers → academy

  // Prices
  challenge_price: number;              // ₦10,000
  academy_price: number;                // ₦120,000

  // Leadash SaaS — MRR proportional to ad spend, with churn
  leadash_mrr_per_million: number;      // ₦ of new MRR generated per ₦1M ad spend (default 174,000)
  leadash_churn_pct: number;            // % of cumulative MRR lost each month (default 5)

  // Costs
  ops_cost_monthly: number;             // fixed monthly ops

  // Display
  show_on_homepage: boolean;
  disclaimer: string;
}

// Default 36-month ad spend ramp (May 2026 – Apr 2029)
export const PROJECTION_DEFAULTS: ProjectionAssumptions = {
  ad_spend_monthly: [
    // Year 1: May 2026 – Apr 2027
    5_000_000, 7_000_000, 10_000_000, 12_000_000, 15_000_000, 15_000_000,
    20_000_000, 20_000_000, 25_000_000, 25_000_000, 30_000_000, 30_000_000,
    // Year 2: May 2027 – Apr 2028
    35_000_000, 35_000_000, 40_000_000, 40_000_000, 45_000_000, 45_000_000,
    50_000_000, 50_000_000, 55_000_000, 55_000_000, 60_000_000, 60_000_000,
    // Year 3: May 2028 – Apr 2029
    65_000_000, 65_000_000, 70_000_000, 70_000_000, 75_000_000, 75_000_000,
    80_000_000, 80_000_000, 85_000_000, 85_000_000, 90_000_000, 90_000_000,
  ],
  cpc: 7_500,
  academy_conversion_pct: 8,
  challenge_price: 10_000,
  academy_price: 120_000,
  leadash_mrr_per_million: 174_000,   // ₦870K MRR from ₦5M ad spend → 870K/5M × 1M = 174K
  leadash_churn_pct: 5,
  ops_cost_monthly: 1_500_000,
  show_on_homepage: true,
  disclaimer:
    "Projections are forward-looking estimates based on planned ad spend and historical funnel benchmarks. Actual results may vary. Past performance does not guarantee future results.",
};

export interface MonthProjection {
  month: number;
  ad_spend: number;
  challenge_buyers: number;
  academy_buyers: number;
  challenge_revenue: number;
  academy_revenue: number;
  leadash_mrr: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
}

export interface YearSummary {
  year: number;
  total_challenge_buyers: number;
  total_academy_buyers: number;
  total_challenge_revenue: number;
  total_academy_revenue: number;
  total_leadash_revenue: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
}

// Generates all 36 months continuously.
// Leadash MRR is proportional to ad spend (new subscribers) minus monthly churn on existing MRR.
export function computeMonthlyProjections(a: ProjectionAssumptions): MonthProjection[] {
  const ramp: number[] = [...a.ad_spend_monthly];
  while (ramp.length < 36) ramp.push(ramp[ramp.length - 1] ?? 0);
  const adSpends = ramp.slice(0, 36);

  let cumulativeMrr = 0;
  return adSpends.map((adSpend, i) => {
    const challengeBuyers = Math.floor(adSpend / Math.max(a.cpc, 1));
    const academyBuyers = Math.floor(challengeBuyers * a.academy_conversion_pct / 100);
    const challengeRev = challengeBuyers * a.challenge_price;
    const academyRev = academyBuyers * a.academy_price;

    // New MRR from this month's ad spend, minus churn on existing base
    const newMrr = (adSpend / 1_000_000) * a.leadash_mrr_per_million;
    cumulativeMrr = Math.floor(cumulativeMrr * (1 - a.leadash_churn_pct / 100) + newMrr);

    const totalRev = challengeRev + academyRev + cumulativeMrr;
    const totalExp = adSpend + a.ops_cost_monthly;

    return {
      month: i + 1,
      ad_spend: adSpend,
      challenge_buyers: challengeBuyers,
      academy_buyers: academyBuyers,
      challenge_revenue: challengeRev,
      academy_revenue: academyRev,
      leadash_mrr: cumulativeMrr,
      total_revenue: totalRev,
      total_expenses: totalExp,
      net_profit: totalRev - totalExp,
    };
  });
}

function sumMonths(months: MonthProjection[]): Omit<YearSummary, "year"> {
  return {
    total_challenge_buyers: months.reduce((s, m) => s + m.challenge_buyers, 0),
    total_academy_buyers: months.reduce((s, m) => s + m.academy_buyers, 0),
    total_challenge_revenue: months.reduce((s, m) => s + m.challenge_revenue, 0),
    total_academy_revenue: months.reduce((s, m) => s + m.academy_revenue, 0),
    total_leadash_revenue: months.reduce((s, m) => s + m.leadash_mrr, 0),
    total_revenue: months.reduce((s, m) => s + m.total_revenue, 0),
    total_expenses: months.reduce((s, m) => s + m.total_expenses, 0),
    net_profit: months.reduce((s, m) => s + m.net_profit, 0),
  };
}

// Year summaries derived by summing actual monthly data — no scaling, no resets
export function computeYearSummaries(a: ProjectionAssumptions): YearSummary[] {
  const months = computeMonthlyProjections(a);
  return [0, 1, 2].map((y) => ({ year: y + 1, ...sumMonths(months.slice(y * 12, (y + 1) * 12)) }));
}

// Calendar label: month index i (0-based) → "May '26", "Jun '26", …, "Apr '29"
const _MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export function monthLabel(i: number): string {
  const abs = 4 + i; // May 2026 = index 4
  return `${_MN[abs % 12]} '${String(2026 + Math.floor(abs / 12)).slice(2)}`;
}

/** Compact naira formatter shared across projection UI */
export function fmtN(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}K`;
  return `₦${n.toLocaleString("en-NG")}`;
}
