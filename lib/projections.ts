export interface ProjectionAssumptions {
  // Funnel inputs
  ad_spend_monthly: number[];           // length 12, naira
  cpl: number;                          // cost per lead
  challenge_conversion_pct: number;     // % leads → challenge buyers
  academy_conversion_pct: number;       // % challenge buyers → academy

  // Prices
  challenge_price: number;              // ₦10,000
  academy_price: number;                // ₦120,000

  // Leadash SaaS
  leadash_starting_mrr: number;         // current MRR
  leadash_monthly_growth_pct: number;   // % MRR growth per month

  // Costs
  ops_cost_monthly: number;             // fixed monthly ops

  // Year 2/3 growth (applied as multiplier to Year 1 totals)
  year2_growth_pct: number;             // e.g. 80 → Year 2 = Year 1 × 1.8
  year3_growth_pct: number;             // e.g. 60 → Year 3 = Year 2 × 1.6

  // Display
  show_on_homepage: boolean;
  disclaimer: string;
}

export const PROJECTION_DEFAULTS: ProjectionAssumptions = {
  ad_spend_monthly: [
    5_000_000,
    7_000_000,
    10_000_000,
    12_000_000,
    15_000_000,
    15_000_000,
    20_000_000,
    20_000_000,
    25_000_000,
    25_000_000,
    30_000_000,
    30_000_000,
  ],
  cpl: 800,
  challenge_conversion_pct: 4,
  academy_conversion_pct: 8,
  challenge_price: 10_000,
  academy_price: 120_000,
  leadash_starting_mrr: 400_000,
  leadash_monthly_growth_pct: 12,
  ops_cost_monthly: 1_500_000,
  year2_growth_pct: 80,
  year3_growth_pct: 60,
  show_on_homepage: true,
  disclaimer:
    "Projections are forward-looking estimates based on planned ad spend and historical funnel benchmarks. Actual results may vary. Past performance does not guarantee future results.",
};

export interface MonthProjection {
  month: number;
  ad_spend: number;
  leads: number;
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
  total_leads: number;
  total_challenge_buyers: number;
  total_academy_buyers: number;
  total_challenge_revenue: number;
  total_academy_revenue: number;
  total_leadash_revenue: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
}

export function computeMonthlyProjections(a: ProjectionAssumptions): MonthProjection[] {
  // Ensure exactly 12 months; pad with last value if shorter
  const ramp: number[] = [...a.ad_spend_monthly];
  while (ramp.length < 12) ramp.push(ramp[ramp.length - 1] ?? 0);
  const months = ramp.slice(0, 12);

  return months.map((adSpend, i) => {
    const leads = Math.floor(adSpend / Math.max(a.cpl, 1));
    const challengeBuyers = Math.floor(leads * a.challenge_conversion_pct / 100);
    const academyBuyers = Math.floor(challengeBuyers * a.academy_conversion_pct / 100);
    const challengeRev = challengeBuyers * a.challenge_price;
    const academyRev = academyBuyers * a.academy_price;
    const leadashMrr = Math.floor(a.leadash_starting_mrr * Math.pow(1 + a.leadash_monthly_growth_pct / 100, i));
    const totalRev = challengeRev + academyRev + leadashMrr;
    const totalExp = adSpend + a.ops_cost_monthly;

    return {
      month: i + 1,
      ad_spend: adSpend,
      leads,
      challenge_buyers: challengeBuyers,
      academy_buyers: academyBuyers,
      challenge_revenue: challengeRev,
      academy_revenue: academyRev,
      leadash_mrr: leadashMrr,
      total_revenue: totalRev,
      total_expenses: totalExp,
      net_profit: totalRev - totalExp,
    };
  });
}

function sumMonths(months: MonthProjection[]): Omit<YearSummary, "year"> {
  return {
    total_leads: months.reduce((s, m) => s + m.leads, 0),
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

function scaleYear(base: Omit<YearSummary, "year">, growthPct: number): Omit<YearSummary, "year"> {
  const m = 1 + growthPct / 100;
  return {
    total_leads: Math.floor(base.total_leads * m),
    total_challenge_buyers: Math.floor(base.total_challenge_buyers * m),
    total_academy_buyers: Math.floor(base.total_academy_buyers * m),
    total_challenge_revenue: Math.floor(base.total_challenge_revenue * m),
    total_academy_revenue: Math.floor(base.total_academy_revenue * m),
    total_leadash_revenue: Math.floor(base.total_leadash_revenue * m),
    total_revenue: Math.floor(base.total_revenue * m),
    total_expenses: Math.floor(base.total_expenses * m),
    net_profit: Math.floor(base.net_profit * m),
  };
}

export function computeYearSummaries(a: ProjectionAssumptions): YearSummary[] {
  const months = computeMonthlyProjections(a);
  const y1 = sumMonths(months);
  const y2 = scaleYear(y1, a.year2_growth_pct);
  const y3 = scaleYear(y2, a.year3_growth_pct);
  return [
    { year: 1, ...y1 },
    { year: 2, ...y2 },
    { year: 3, ...y3 },
  ];
}

/** Compact naira formatter shared across projection UI */
export function fmtN(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}K`;
  return `₦${n.toLocaleString("en-NG")}`;
}
