import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export interface PitchContent {
  round_label: string;
  company_tagline: string;
  executive_summary: string;
  leadash_description: string;
  leadash_items: string[];
  academy_description: string;
  academy_items: string[];
  combined_strategy: string;
  financials_note: string;
  use_of_funds: { category: string; pct: string; amount: string; items: string[] }[];
  risk_factors: { title: string; desc: string }[];
  cta_heading: string;
  cta_body: string;
}

export const PITCH_DEFAULTS: PitchContent = {
  round_label: "Investment Proposal · Round 1",
  company_tagline: "Musharakah Equity Partnership Programme",
  executive_summary:
    "Mizark Global Limited is a Nigerian technology company building digital products that serve businesses and professionals across Africa. We operate two revenue-generating products: Leadash (a B2B sales automation SaaS platform) and Learn by Mizark (a professional online academy).\n\nWe are offering a Musharakah equity partnership — a Shariah-compliant joint venture structure where partners share in both the profits and risks of the business. This is genuine equity co-ownership, not a loan or guaranteed return product.",
  leadash_description: "B2B Sales Automation SaaS Platform",
  leadash_items: [
    "Monthly and annual subscription plans for sales teams",
    "CRM, lead tracking, email outreach, pipeline analytics",
    "Target: SMBs across Nigeria and West Africa",
    "Revenue model: recurring monthly SaaS fees",
    "Growth lever: sales team expansion, product-led growth",
  ],
  academy_description: "Professional Online Academy",
  academy_items: [
    "Online courses in sales, marketing, and technology",
    "Lifetime-access sales + cohort-based programmes",
    "Target: professionals and entrepreneurs in Africa",
    "Revenue model: course fees, bundle packages",
    "Growth lever: new course launches, marketing campaigns",
  ],
  combined_strategy:
    "Leadash users become academy customers, and academy graduates become Leadash users — a virtuous cycle that improves customer lifetime value for both products.",
  financials_note:
    "Detailed financials are shared after agreement signing and payment. Live data will be visible in your partner dashboard upon activation.",
  use_of_funds: [
    { category: "Product Development", pct: "35%", amount: "₦7,000,000", items: ["Leadash feature expansion", "Mobile app development", "Academy platform improvements", "API integrations"] },
    { category: "Sales & Marketing", pct: "30%", amount: "₦6,000,000", items: ["Digital marketing campaigns", "Sales team expansion", "Content creation", "Conference presence"] },
    { category: "Team & Operations", pct: "25%", amount: "₦5,000,000", items: ["Key hires (engineering, sales)", "Office & infrastructure", "Customer support", "Admin & legal"] },
    { category: "Reserve & Contingency", pct: "10%", amount: "₦2,000,000", items: ["Operating reserve", "Emergency fund", "Opportunity capital", "Working capital buffer"] },
  ],
  risk_factors: [
    { title: "Business Performance Risk", desc: "Both Leadash and Learn by Mizark are growing businesses but not guaranteed to maintain or increase revenue. Market conditions, competition, and execution challenges could reduce profits or cause losses." },
    { title: "Capital Loss Risk", desc: "In a Musharakah partnership, losses are shared. If the business experiences sustained losses, your invested capital may be partially or fully lost. This is not a guaranteed-return instrument." },
    { title: "Liquidity Risk", desc: "This is a 3-year lock-in. You cannot access your capital during this period. If you need liquidity before 3 years, this investment is not appropriate for you." },
    { title: "Regulatory & Operating Environment Risk", desc: "Changes in Nigerian tax law, technology regulations, or economic conditions (inflation, FX) could impact business performance and distributions." },
    { title: "Concentration Risk", desc: "This investment is in a single private company (Mizark Global Limited). It is not diversified. Only invest an amount that represents a reasonable portion of your overall wealth." },
  ],
  cta_heading: "Ready to Proceed?",
  cta_body: "If you have reviewed the pitch materials and are ready to move forward, the next step is to review and sign the Musharakah Partnership Agreement.",
};

async function getConfig(db: any) {
  try {
    const { data } = await db.from("program_config").select("settings").eq("id", 1).maybeSingle();
    return data?.settings ?? {};
  } catch { return {}; }
}
async function saveConfig(db: any, settings: any) {
  await db.from("program_config").upsert({ id: 1, settings, updated_at: new Date().toISOString() });
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;
  const config = await getConfig(db);
  const content: PitchContent = { ...PITCH_DEFAULTS, ...(config.pitch_content ?? {}) };
  return NextResponse.json({ content });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;
  const body = await req.json();
  const config = await getConfig(db);
  await saveConfig(db, { ...config, pitch_content: { ...(config.pitch_content ?? {}), ...body } });
  return NextResponse.json({ ok: true });
}
