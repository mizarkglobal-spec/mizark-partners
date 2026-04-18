export interface HomepageFaq {
  q: string;
  a: string;
}

export interface HomepageSettings {
  hero_badge: string;
  hero_headline_1: string;
  hero_headline_2: string;
  hero_headline_3: string;
  hero_subtext: string;
  cta_label: string;
  max_investment: number;
  faqs: HomepageFaq[];
}

export const HOMEPAGE_DEFAULTS: HomepageSettings = {
  hero_badge: "Accepting Applications — Round 1",
  hero_headline_1: "Grow with Mizark.",
  hero_headline_2: "Halal equity",
  hero_headline_3: "in a tech company.",
  hero_subtext:
    "Musharakah partnership in Mizark Global Limited — the company behind Leadash (B2B SaaS) and Learn by Mizark (Academy). Real equity, real profits, quarterly distributions.",
  cta_label: "Apply to Partner",
  max_investment: 5_000_000,
  faqs: [
    {
      q: "Is this investment Shariah-compliant?",
      a: "Yes. The structure is a Musharakah (equity partnership) — you share in real profits and losses proportionally. No riba (interest). Profits come only from actual business earnings. The agreement is drafted to comply with Islamic finance principles.",
    },
    {
      q: "What is the minimum investment?",
      a: "₦500,000. This gives you a 0.5% equity stake. Slots are available at ₦500k, ₦1M, ₦2M, ₦5M, or a custom amount. Total pool is ₦20,000,000 for 20% equity across a maximum of 40 partners.",
    },
    {
      q: "How are profits distributed?",
      a: "Quarterly, within 30 days of each quarter end (March, June, September, December). 30% of net quarterly profit is shared proportionally across all partners. Payments go directly to your Nigerian bank account.",
    },
    {
      q: "What if the business makes a loss?",
      a: "In a loss quarter, no distribution is made. Losses are shared proportionally. However, Mizark Global has been operationally profitable — we commit to full transparency so you can see the business health at all times in your dashboard.",
    },
    {
      q: "Can I exit before 3 years?",
      a: "Early exit requires board approval and a willing approved buyer. We facilitate introductions but do not guarantee liquidity before term end. At Year 3, you may exit at the then-current valuation, roll over your stake, or negotiate a transfer.",
    },
    {
      q: "What oversight do partners have?",
      a: "Monthly financial snapshots, quarterly distribution reports, annual audited summaries — all auto-generated from our accounting system and accessible 24/7 on your partner dashboard. You also have the right to attend the annual partner meeting.",
    },
    {
      q: "How does the application process work?",
      a: "Apply here → we review personally within 2–3 business days → if approved you get a private link to our full pitch deck and financials → you review the Musharakah agreement → sign → pay. You see everything before committing a single naira.",
    },
    {
      q: "Is Mizark Global a registered company?",
      a: "Yes. Mizark Global is a registered business in Nigeria. All investment activities are subject to a legally drafted Musharakah agreement.",
    },
  ],
};
