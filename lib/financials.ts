export const DIVISIONS = {
  learn_mizark: "Learn by Mizark",
  leadash: "Leadash",
  shared: "Shared",
} as const;

export type Division = keyof typeof DIVISIONS;

export const TYPES = {
  revenue: "Revenue",
  cogs: "Cost of Sales",
  opex: "Operating Expenses",
  tax: "Tax & Compliance",
} as const;

export type TxType = keyof typeof TYPES;

export const CATEGORIES: Record<TxType, Record<string, string>> = {
  revenue: {
    "revenue.challenge": "Challenge Sales",
    "revenue.academy": "Academy Sales",
    "revenue.leadash": "Leadash MRR",
    "revenue.other": "Other Revenue",
  },
  cogs: {
    "cogs.ad_spend": "Ad Spend",
    "cogs.payment_fees": "Payment Processing Fees",
    "cogs.affiliate": "Affiliate / Influencer",
    "cogs.platform_fees": "Platform Fees (Zoom, LMS)",
    "cogs.facilitator": "Facilitator Fees",
    "cogs.infrastructure": "Cloud Infrastructure",
    "cogs.third_party_apis": "Third-party APIs",
    "cogs.other": "Other COGS",
  },
  opex: {
    "opex.salary": "Salaries & Wages",
    "opex.contractor": "Contractor Payments",
    "opex.rent": "Rent / Office",
    "opex.legal": "Legal & Compliance",
    "opex.accounting": "Accounting & Audit",
    "opex.tools": "Software & Tools",
    "opex.bank_charges": "Bank Charges",
    "opex.other": "Other Expenses",
  },
  tax: {
    "tax.cit": "Company Income Tax (CIT)",
    "tax.education": "Education Tax (2%)",
    "tax.vat_output": "VAT Output (collected)",
    "tax.vat_input": "VAT Input (claimable)",
    "tax.wht": "Withholding Tax",
    "tax.paye": "PAYE",
  },
};

// Suggested default division for each category
export const CATEGORY_DIVISION_DEFAULTS: Record<string, Division> = {
  "revenue.challenge": "learn_mizark",
  "revenue.academy": "learn_mizark",
  "revenue.leadash": "leadash",
  "revenue.other": "shared",
  "cogs.ad_spend": "learn_mizark",
  "cogs.payment_fees": "learn_mizark",
  "cogs.affiliate": "learn_mizark",
  "cogs.platform_fees": "learn_mizark",
  "cogs.facilitator": "learn_mizark",
  "cogs.infrastructure": "leadash",
  "cogs.third_party_apis": "leadash",
  "cogs.other": "shared",
  "opex.salary": "shared",
  "opex.contractor": "shared",
  "opex.rent": "shared",
  "opex.legal": "shared",
  "opex.accounting": "shared",
  "opex.tools": "shared",
  "opex.bank_charges": "shared",
  "opex.other": "shared",
  "tax.cit": "shared",
  "tax.education": "shared",
  "tax.vat_output": "shared",
  "tax.vat_input": "shared",
  "tax.wht": "shared",
  "tax.paye": "shared",
};

export interface FinancialTransaction {
  id: string;
  date: string;          // ISO date e.g. "2026-05-01"
  division: Division;
  type: TxType;
  category: string;      // e.g. "revenue.challenge"
  amount: number;        // always positive; type determines sign in P&L
  description: string | null;
  reference: string | null;
  is_auto: boolean;
  created_at: string;
}

export type CategoryLine = Record<string, number>;

export interface DivisionSummary {
  revenue: CategoryLine;
  cogs: CategoryLine;
  opex: CategoryLine;
  tax: CategoryLine;
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
  total_opex: number;
  ebitda: number;
  // Tax breakdown
  tax_cit: number;
  tax_education: number;
  tax_wht: number;
  tax_paye: number;
  vat_output: number;
  vat_input: number;
  vat_net: number;       // vat_output - vat_input (liability)
  total_tax_expense: number; // cit + education + wht + paye (not VAT — VAT is pass-through)
  net_profit: number;    // ebitda - total_tax_expense
}

export interface PeriodSummary {
  divisions: {
    learn_mizark: DivisionSummary;
    leadash: DivisionSummary;
    shared: DivisionSummary;
    total: DivisionSummary;
  };
  transaction_count: number;
}

function emptyDiv(): DivisionSummary {
  return {
    revenue: {}, cogs: {}, opex: {}, tax: {},
    total_revenue: 0, total_cogs: 0, gross_profit: 0, gross_margin_pct: 0,
    total_opex: 0, ebitda: 0,
    tax_cit: 0, tax_education: 0, tax_wht: 0, tax_paye: 0,
    vat_output: 0, vat_input: 0, vat_net: 0,
    total_tax_expense: 0, net_profit: 0,
  };
}

function addLine(d: DivisionSummary, type: TxType, category: string, amount: number) {
  const bucket = d[type] as CategoryLine;
  bucket[category] = (bucket[category] ?? 0) + amount;
}

function rollup(d: DivisionSummary) {
  d.total_revenue = Object.values(d.revenue).reduce((a, b) => a + b, 0);
  d.total_cogs = Object.values(d.cogs).reduce((a, b) => a + b, 0);
  d.gross_profit = d.total_revenue - d.total_cogs;
  d.gross_margin_pct = d.total_revenue > 0 ? (d.gross_profit / d.total_revenue) * 100 : 0;
  d.total_opex = Object.values(d.opex).reduce((a, b) => a + b, 0);
  d.ebitda = d.gross_profit - d.total_opex;
  d.tax_cit = d.tax["tax.cit"] ?? 0;
  d.tax_education = d.tax["tax.education"] ?? 0;
  d.tax_wht = d.tax["tax.wht"] ?? 0;
  d.tax_paye = d.tax["tax.paye"] ?? 0;
  d.vat_output = d.tax["tax.vat_output"] ?? 0;
  d.vat_input = d.tax["tax.vat_input"] ?? 0;
  d.vat_net = d.vat_output - d.vat_input;
  d.total_tax_expense = d.tax_cit + d.tax_education + d.tax_wht + d.tax_paye;
  d.net_profit = d.ebitda - d.total_tax_expense;
}

export function computePeriodSummary(transactions: FinancialTransaction[]): PeriodSummary {
  const divs: PeriodSummary["divisions"] = {
    learn_mizark: emptyDiv(),
    leadash: emptyDiv(),
    shared: emptyDiv(),
    total: emptyDiv(),
  };

  for (const tx of transactions) {
    addLine(divs[tx.division], tx.type, tx.category, tx.amount);
    addLine(divs.total, tx.type, tx.category, tx.amount);
  }

  for (const d of Object.values(divs)) rollup(d);

  return { divisions: divs, transaction_count: transactions.length };
}

// Nigerian tax estimates (for the Tax tab advisory panel)
export function estimateCIT(annualisedEbitda: number, annualisedRevenue: number): number {
  if (annualisedRevenue < 25_000_000) return 0;
  const rate = annualisedRevenue < 100_000_000 ? 0.20 : 0.30;
  return Math.max(0, annualisedEbitda) * rate;
}

export function estimateEducationTax(annualisedEbitda: number): number {
  return Math.max(0, annualisedEbitda) * 0.02;
}

export function estimateVATOutput(revenue: number): number {
  return revenue * 0.075;
}
