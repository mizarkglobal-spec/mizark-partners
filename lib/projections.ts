export interface ProjectionAssumptions {
  // Progressive growth model (drives all partner-facing projections)
  prog_starting_revenue: number;    // Month 1 revenue (May 2026)
  prog_monthly_growth_pct: number;  // % compounding growth per month
  prog_expense_ratio: number;       // expenses as % of revenue

  // Display
  show_on_homepage: boolean;
  disclaimer: string;
}

export const PROJECTION_DEFAULTS: ProjectionAssumptions = {
  prog_starting_revenue: 5_000_000,
  prog_monthly_growth_pct: 30,
  prog_expense_ratio: 40,
  show_on_homepage: true,
  disclaimer:
    "Projections are forward-looking estimates based on a 30% monthly compound growth model starting May 2026. Actual results may vary. Past performance does not guarantee future results.",
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

// 36 months of continuous compound growth: month i (0-indexed) = START × (1 + GROWTH)^i
export function computeProgressiveMonths(a?: Partial<ProjectionAssumptions>): MonthProjection[] {
  const START = a?.prog_starting_revenue ?? PROJECTION_DEFAULTS.prog_starting_revenue;
  const GROWTH = (a?.prog_monthly_growth_pct ?? PROJECTION_DEFAULTS.prog_monthly_growth_pct) / 100;
  const EXP_RATIO = (a?.prog_expense_ratio ?? PROJECTION_DEFAULTS.prog_expense_ratio) / 100;

  return Array.from({ length: 36 }, (_, i) => {
    const totalRev = Math.round(START * Math.pow(1 + GROWTH, i));
    const totalExp = Math.round(totalRev * EXP_RATIO);
    const leadashMrr = Math.round(totalRev * 0.25);
    const academyRev = Math.round(totalRev * 0.65);
    const challengeRev = totalRev - leadashMrr - academyRev;
    const academyBuyers = Math.max(1, Math.round(academyRev / 120_000));
    const challengeBuyers = Math.round(academyBuyers / 0.08);
    const leads = Math.round(challengeBuyers / 0.04);
    return {
      month: i + 1,
      ad_spend: Math.round(totalExp * 0.75),
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

export function computeProgressiveYearSummaries(months: MonthProjection[]): YearSummary[] {
  return [0, 1, 2].map((y) => ({ year: y + 1, ...sumMonths(months.slice(y * 12, (y + 1) * 12)) }));
}

// Calendar label for month i (0-indexed): i=0 → "May '26", i=12 → "May '27"
const _MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export function progressiveMonthLabel(i: number): string {
  const abs = 4 + i; // May = month index 4
  return `${_MONTH_NAMES[abs % 12]} '${String(2026 + Math.floor(abs / 12)).slice(2)}`;
}

/** Compact naira formatter shared across projection UI */
export function fmtN(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}K`;
  return `₦${n.toLocaleString("en-NG")}`;
}
