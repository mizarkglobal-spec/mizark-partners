import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { HOMEPAGE_DEFAULTS } from "@/lib/homepage";
import { AGREEMENT_DEFAULTS } from "@/app/api/admin/agreement-template/route";
import type { Principal } from "@/app/api/admin/principals/route";
import { fmt } from "@/lib/format";
import HomeFAQ from "@/app/_components/HomeFAQ";
import HomeMobileMenu from "@/app/_components/HomeMobileMenu";
import MizarkLogo from "@/components/MizarkLogo";
import { PROJECTION_DEFAULTS, computeMonthlyProjections, computeYearSummaries, fmtN } from "@/lib/projections";
import ProjectionsTabs from "@/app/_components/ProjectionsTabs";
import InvestmentCalculator from "@/app/_components/InvestmentCalculator";

export const dynamic = "force-dynamic";

const DEFAULT_PRINCIPALS: Principal[] = [
  {
    id: "founder",
    name: "Malik Adelaja",
    role: "Founder & CEO",
    equity_pct: 80,
    bio: "Built Leadash to solve the client acquisition challenges students faced after going through Learn by Mizark — creating a self-reinforcing business ecosystem. Focused on building profitable, transparent, and Halal businesses that create real value for African professionals and investors.",
    is_founder: true,
  },
];

function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}K`;
  return `₦${n}`;
}

function equityForMin(minInv: number, pool: number, equityPct: number) {
  return ((minInv / pool) * equityPct).toFixed(1);
}

export default async function LandingPage() {
  // Fetch all config in one query
  let raw: Record<string, any> = {};
  try {
    const db = createAdminClient();
    const { data } = await db.from("program_config").select("settings").eq("id", 1).maybeSingle();
    raw = data?.settings ?? {};
  } catch {
    // falls back to all defaults
  }

  // Program settings
  const totalPool: number = raw.total_pool_amount ?? 20_000_000;
  const totalEquityPct: number = raw.total_equity_pct ?? 20;
  const termYears: number = raw.term_years ?? 3;
  const profitDistPct: number = raw.profit_dist_pct ?? 30;
  const minInvestment: number = raw.min_investment ?? 500_000;

  // Homepage content
  const hp = { ...HOMEPAGE_DEFAULTS, ...(raw.homepage ?? {}) };

  // Principals (team section)
  const principals: Principal[] = raw.principals?.length ? raw.principals : DEFAULT_PRINCIPALS;

  // Agreement template (for governing law in terms grid)
  const agmt = { ...AGREEMENT_DEFAULTS, ...(raw.agreement_template ?? {}) };

  // Financial projections
  const projAssumptions = { ...PROJECTION_DEFAULTS, ...(raw.projections ?? {}) };
  const showProjections: boolean = projAssumptions.show_on_homepage;
  const projYears = showProjections ? computeYearSummaries(projAssumptions) : [];
  const projMonthsRaw = showProjections ? computeMonthlyProjections(projAssumptions) : [];
  const projChartData = projMonthsRaw.map((m) => ({
    month: m.month,
    academy_funnel: m.challenge_revenue + m.academy_revenue,
    leadash: m.leadash_mrr,
    net_profit: m.net_profit,
  }));

  // Derived values
  const minEquity = equityForMin(minInvestment, totalPool, totalEquityPct);
  const maxEquity = equityForMin(hp.max_investment, totalPool, totalEquityPct);

  // Dynamic FAQ defaults — if admin hasn't customised FAQs, compute them from live program settings
  const faqs = (raw.homepage?.faqs as typeof hp.faqs | undefined) ?? [
    {
      q: "Is this investment Shariah-compliant?",
      a: "Yes. The structure is a Musharakah (equity partnership) — you share in real profits and losses proportionally. No riba (interest). Profits come only from actual business earnings. The agreement is drafted to comply with Islamic finance principles.",
    },
    {
      q: "What is the minimum investment?",
      a: `${fmtCompact(minInvestment)}. This gives you a ${minEquity}% equity stake. Slots available from ${fmtCompact(minInvestment)} up to ${fmtCompact(hp.max_investment)}. Total pool is ${fmtCompact(totalPool)} for ${totalEquityPct}% equity.`,
    },
    {
      q: "How are profits distributed?",
      a: `Quarterly, within 30 days of each quarter end (March, June, September, December). ${profitDistPct}% of net quarterly profit is shared proportionally across all partners. Payments go directly to your Nigerian bank account.`,
    },
    {
      q: "What if the business makes a loss?",
      a: "In a loss quarter, no distribution is made. Losses are shared proportionally. However, Mizark Global has been operationally profitable — we commit to full transparency so you can see the business health at all times in your dashboard.",
    },
    {
      q: "Can I exit before 3 years?",
      a: `Early exit requires board approval and a willing approved buyer. We facilitate introductions but do not guarantee liquidity before the ${termYears}-year term end. At Year ${termYears}, you may exit at the then-current valuation, roll over your stake, or negotiate a transfer.`,
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
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-geist), 'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Sticky Nav ─────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b border-white/[0.08] relative"
        style={{ background: "rgba(15,42,30,0.97)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[62px] flex items-center justify-between">
          <MizarkLogo subtitle="Partner Programme" />
          <HomeMobileMenu ctaLabel={hp.cta_label} />
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #081a11 0%, #0f2a1e 40%, #132d20 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, #40916c, transparent 70%)" }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #d4a843, transparent 70%)" }} />

        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-24 pb-0">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8 border"
            style={{ background: "rgba(64,145,108,0.12)", borderColor: "rgba(64,145,108,0.25)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#74c69d] animate-pulse" />
            <span className="text-[#74c69d] text-[11px] font-semibold uppercase tracking-[0.12em]">
              {hp.hero_badge}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-[42px] sm:text-[58px] lg:text-[70px] font-bold text-white leading-[1.05] tracking-[-0.03em] mb-6 max-w-[720px]">
            {hp.hero_headline_1}<br />
            <span style={{ color: "#74c69d" }}>{hp.hero_headline_2}</span>{" "}
            {hp.hero_headline_3}
          </h1>

          <p className="text-[17px] text-white/50 leading-[1.7] mb-10 max-w-[520px]">
            {hp.hero_subtext}
          </p>

          <div className="flex flex-wrap gap-3 mb-16">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[12px] font-bold text-[15px] transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg,#d4a843,#c49a38)",
                color: "#0f2a1e",
                boxShadow: "0 8px 24px rgba(212,168,67,0.25)",
              }}
            >
              {hp.cta_label}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a
              href="#opportunity"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[12px] font-semibold text-[15px] text-white/70 hover:text-white transition-colors border"
              style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
            >
              How it works
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)" }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {[
                { value: fmtCompact(totalPool), label: "Investment Pool" },
                { value: `${totalEquityPct}%`, label: "Equity Offered" },
                { value: `${termYears} Year${termYears !== 1 ? "s" : ""}`, label: "Partnership Term" },
                { value: "Quarterly", label: "Distributions" },
              ].map((s, i) => (
                <div key={i} className={`py-6 px-4 border-white/[0.07] ${
                  i === 0 ? "border-r border-b md:border-b-0" :
                  i === 1 ? "border-b md:border-b-0 md:border-r" :
                  i === 2 ? "border-r" : ""
                }`}>
                  <p className="text-[22px] sm:text-[26px] font-bold text-white tracking-[-0.02em]">{s.value}</p>
                  <p className="text-[11px] text-white/35 uppercase tracking-[0.12em] mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Businesses ─────────────────────────────────────────────────────── */}
      <section id="businesses" className="py-24 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#40916c] mb-3">What You're Investing In</p>
            <h2 className="text-[32px] sm:text-[40px] font-bold text-[#0f2a1e] tracking-[-0.025em] max-w-lg leading-tight">
              Two operating businesses. Real revenue.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Leadash */}
            <div className="rounded-[20px] border border-gray-100 p-8 hover:border-[#40916c]/40 hover:shadow-[0_8px_40px_rgba(64,145,108,0.08)] transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="w-11 h-11 rounded-[12px] flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0f2a1e,#1a3a2a)" }}>
                  <svg className="w-5 h-5 text-[#74c69d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>SaaS · Live</span>
              </div>
              <h3 className="text-[22px] font-bold text-[#0f2a1e] tracking-[-0.02em] mb-3">Leadash</h3>
              <p className="text-gray-500 text-[14px] leading-[1.7] mb-6">
                B2B outreach platform for lead scraping, email verification, AI enrichment, inbox management, and cold email sequencing. The complete tool for client acquisition — built for the African market.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-5 border-t border-gray-50">
                {[["Model", "Subscription SaaS"], ["Pricing", "₦5k–₦50k/month"], ["Market", "B2B Sales Teams"], ["Status", "Live & Growing"]].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-[10px] p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{k}</p>
                    <p className="text-[13px] font-semibold text-gray-700">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Learn by Mizark */}
            <div className="rounded-[20px] border border-gray-100 p-8 hover:border-[#40916c]/40 hover:shadow-[0_8px_40px_rgba(64,145,108,0.08)] transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="w-11 h-11 rounded-[12px] flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1a237e,#283593)" }}>
                  <svg className="w-5 h-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>Academy · Live</span>
              </div>
              <h3 className="text-[22px] font-bold text-[#0f2a1e] tracking-[-0.02em] mb-3">Learn by Mizark</h3>
              <p className="text-gray-500 text-[14px] leading-[1.7] mb-6">
                Professional training academy teaching high-ticket client acquisition, outreach strategy, and sales systems. Students become the primary users of Leadash — a powerful self-reinforcing flywheel.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-5 border-t border-gray-50">
                {[["Model", "Cohort + Digital"], ["Pricing", "₦50k–₦200k/cohort"], ["Market", "Freelancers & Agencies"], ["Status", "Live & Growing"]].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-[10px] p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{k}</p>
                    <p className="text-[13px] font-semibold text-gray-700">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Flywheel */}
          <div className="mt-5 rounded-[20px] p-8" style={{ background: "linear-gradient(135deg,#f0fdf4,#f7fee7)", border: "1px solid #bbf7d0" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#40916c] mb-4">The Flywheel Effect</p>
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              {["Academy trains professionals", "→", "Graduates need outreach tools", "→", "They use Leadash", "→", "Revenue funds both businesses", "→", "Better products attract more students"].map((item, i) =>
                item === "→"
                  ? <span key={i} className="text-[#40916c] font-bold text-lg">→</span>
                  : <span key={i} className="px-3 py-1.5 bg-white rounded-[8px] text-gray-700 font-medium shadow-sm border border-green-100">{item}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Opportunity ────────────────────────────────────────────────────── */}
      <section id="opportunity" className="py-24 px-5 sm:px-8" style={{ background: "#f8faf9" }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#40916c] mb-3">The Opportunity</p>
            <h2 className="text-[32px] sm:text-[40px] font-bold text-[#0f2a1e] tracking-[-0.025em] max-w-md leading-tight">How the partnership works.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              {
                n: "01",
                title: `Invest ${fmtCompact(minInvestment)}–${fmtCompact(hp.max_investment)}`,
                body: `Your capital buys a proportional equity stake in Mizark Global. ${fmtCompact(minInvestment)} → ${minEquity}% equity. ${fmtCompact(hp.max_investment)} → ${maxEquity}% equity. Total pool: ${fmtCompact(totalPool)} for ${totalEquityPct}% equity.`,
              },
              {
                n: "02",
                title: "Profits flow quarterly",
                body: `${profitDistPct}% of quarterly net profit is distributed to all partners. Payments go directly to your bank account within 30 days of quarter end.`,
              },
              {
                n: "03",
                title: "Total transparency",
                body: "Your private dashboard shows monthly financials, every distribution, and all reports — auto-generated from our accounting system.",
              },
            ].map((s) => (
              <div key={s.n} className="bg-white rounded-[20px] p-7 border border-gray-100 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-shadow">
                <p className="text-[48px] font-black leading-none mb-4" style={{ color: "#e8f5e9" }}>{s.n}</p>
                <h3 className="text-[17px] font-bold text-[#0f2a1e] mb-2 tracking-[-0.01em]">{s.title}</h3>
                <p className="text-gray-500 text-[13px] leading-[1.65]">{s.body}</p>
              </div>
            ))}
          </div>

          {/* Profit flow */}
          <div className="rounded-[20px] overflow-hidden">
            <div className="p-7 pb-5" style={{ background: "#0f2a1e" }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#74c69d] mb-5">Quarterly Profit Distribution Flow</p>
              <div className="grid sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Revenue", sub: "Leadash + Academy combined", bg: "rgba(45,106,79,0.5)", border: "rgba(64,145,108,0.4)" },
                  { label: "Operating Expenses", sub: "Salaries, infrastructure, marketing", bg: "rgba(26,58,42,0.5)", border: "rgba(64,145,108,0.2)" },
                  { label: "Net Profit", sub: "Revenue minus all expenses", bg: "rgba(64,145,108,0.4)", border: "rgba(116,198,157,0.4)" },
                  { label: `${profitDistPct}% Distributed`, sub: "To all partners proportionally", bg: "rgba(212,168,67,0.2)", border: "rgba(212,168,67,0.4)" },
                ].map((f, i) => (
                  <div key={i} className="rounded-[14px] px-4 py-4" style={{ background: f.bg, border: `1px solid ${f.border}` }}>
                    <p className={`font-bold text-[14px] ${i === 3 ? "text-[#d4a843]" : "text-white"}`}>{f.label}</p>
                    <p className="text-white/40 text-[11px] mt-1 leading-tight">{f.sub}</p>
                    {i < 3 && <p className="text-[#74c69d] font-bold text-lg mt-2">→</p>}
                  </div>
                ))}
              </div>
            </div>
            <div className="px-7 py-3.5 border-t" style={{ background: "#0a1f15", borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-white/25 text-[12px]">
                The remaining {100 - profitDistPct}% of net profit is reinvested into product development, marketing, and business growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Financial Projections ─────────────────────────────────────────── */}
      {showProjections && projYears.length > 0 && (
        <section className="py-24 px-5 sm:px-8" style={{ background: "#f8faf9" }}>
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#40916c] mb-3">Growth Trajectory</p>
              <h2 className="text-[32px] sm:text-[40px] font-bold text-[#0f2a1e] tracking-[-0.025em] max-w-xl leading-tight">
                The numbers behind the opportunity.
              </h2>
              <p className="text-gray-500 text-[14px] mt-4 max-w-lg">
                Projected from a proven ad-to-academy funnel. Revenue scales with ad spend across all African markets.
              </p>
            </div>

            <ProjectionsTabs
              years={projYears}
              y1Months={projChartData}
              disclaimer={projAssumptions.disclaimer}
            />
          </div>
        </section>
      )}

      {/* ── Investment Calculator ─────────────────────────────────────────── */}
      <section
        id="calculator"
        className="py-24 px-5 sm:px-8"
        style={{ background: "linear-gradient(160deg, #081a11 0%, #0f2a1e 60%, #132d20 100%)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#74c69d] mb-3">Model Your Returns</p>
            <h2 className="text-[32px] sm:text-[40px] font-bold text-white tracking-[-0.025em] max-w-xl mx-auto leading-tight">
              See what your stake could earn.
            </h2>
            <p className="text-white/40 text-[14px] mt-4 max-w-lg mx-auto">
              Use our projection model to estimate your share of quarterly distributions across the partnership term.
            </p>
          </div>
          <InvestmentCalculator
            totalPool={totalPool}
            totalEquityPct={totalEquityPct}
            profitDistPct={profitDistPct}
            projYears={projYears}
            minInvestment={minInvestment}
            maxInvestment={hp.max_investment}
            termYears={termYears}
          />
        </div>
      </section>

      {/* ── Terms ──────────────────────────────────────────────────────────── */}
      <section id="terms" className="py-24 px-5 sm:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#40916c] mb-3">Partnership Terms</p>
            <h2 className="text-[32px] sm:text-[40px] font-bold text-[#0f2a1e] tracking-[-0.025em] max-w-lg leading-tight">Clear terms. No hidden conditions.</h2>
            <p className="text-gray-500 text-[14px] mt-4 max-w-lg">The full Musharakah agreement is reviewed and signed digitally as part of the process. Here are the key terms upfront — no surprises.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {[
              ["Structure", "Musharakah — Equity Partnership"],
              ["Total Pool", fmt.naira(totalPool)],
              ["Equity Offered", `${totalEquityPct}% of Mizark Global`],
              ["Minimum Investment", `${fmt.naira(minInvestment)} (${minEquity}% stake)`],
              ["Maximum Investment", `${fmt.naira(hp.max_investment)} (${maxEquity}% stake)`],
              ["Term", `${termYears} Year${termYears !== 1 ? "s" : ""} from activation`],
              ["Profit Distribution", `Quarterly — ${profitDistPct}% of net profit`],
              ["Distribution Timeline", "Within 30 days of quarter end"],
              ["Loss Sharing", "Proportional to equity stake"],
              ["Early Exit", "Board approval + willing buyer"],
              [`Exit at Year ${termYears}`, "At current valuation or roll over"],
              ["Governing Law", agmt.governing_law],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 p-4 rounded-[14px] border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-[#40916c] mt-[7px] flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">{k}</p>
                  <p className="text-[13px] font-semibold text-gray-800">{v}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[16px] p-5 border flex gap-4" style={{ background: "#fffbeb", borderColor: "#fcd34d" }}>
            <span className="text-[20px] flex-shrink-0 mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold text-amber-900 text-[14px] mb-1">Investment Risk Disclosure</p>
              <p className="text-amber-800 text-[13px] leading-relaxed">
                This is an equity investment. Returns are not guaranteed and your capital is at risk. The value of your investment may go down as well as up. Past performance is not indicative of future results. Only invest capital you can afford to have locked for {termYears} years.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ───────────────────────────────────────────────────────────── */}
      <section id="team" className="py-24 px-5 sm:px-8" style={{ background: "#f8faf9" }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#40916c] mb-3">The Team</p>
            <h2 className="text-[32px] sm:text-[40px] font-bold text-[#0f2a1e] tracking-[-0.025em] leading-tight">Who you are partnering with.</h2>
          </div>

          <div className={`grid gap-5 ${principals.length > 1 ? "md:grid-cols-2" : "max-w-2xl"}`}>
            {principals.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-[20px] border border-gray-100 p-8 hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)] transition-shadow"
              >
                <div className="flex gap-5">
                  <div
                    className="w-16 h-16 rounded-[16px] flex items-center justify-center flex-shrink-0"
                    style={{ background: p.is_founder ? "linear-gradient(135deg,#0f2a1e,#1a3a2a)" : "linear-gradient(135deg,#1a3a2a,#2d6a4f)" }}
                  >
                    <span className="text-[#74c69d] font-black text-2xl">
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0f2a1e] text-[18px] tracking-[-0.01em]">{p.name}</p>
                    <p className="text-[#40916c] text-[13px] font-medium mb-3">{p.role}</p>
                    {p.bio && (
                      <p className="text-gray-500 text-[13px] leading-[1.7]">{p.bio}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {p.role.split(/[,&·]/).map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                          style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-5 sm:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="mb-14 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#40916c] mb-3">FAQ</p>
            <h2 className="text-[32px] sm:text-[40px] font-bold text-[#0f2a1e] tracking-[-0.025em]">Common questions.</h2>
          </div>
          <HomeFAQ faqs={faqs} />
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-5 sm:px-8" style={{ background: "linear-gradient(135deg,#081a11,#0f2a1e)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#74c69d] mb-5">Ready to Partner?</p>
          <h2 className="text-[32px] sm:text-[44px] font-bold text-white tracking-[-0.025em] leading-tight mb-5">
            Build something lasting.<br />Together.
          </h2>
          <p className="text-white/45 text-[15px] leading-[1.7] max-w-xl mx-auto mb-10">
            Applications are reviewed personally. You see our full financials and pitch materials before committing a single naira. No pressure, no shortcuts.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-9 py-4 rounded-[12px] font-bold text-[15px] transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg,#d4a843,#c49a38)",
              color: "#0f2a1e",
              boxShadow: "0 8px 32px rgba(212,168,67,0.3)",
            }}
          >
            {hp.cta_label}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="text-white/25 text-[12px] mt-5">No commitment required. Review everything before paying.</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#060f09", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(145deg,#0c2016,#132d20)", border: "1.5px solid rgba(212,168,67,0.35)" }}
            >
              <svg viewBox="0 0 26 20" fill="none" className="w-[13px] h-[10px]" aria-hidden="true">
                <path d="M2 18V2L13 11L24 2V18" stroke="#d4a843" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-white/60 text-[13px] font-semibold">{agmt.company_full_name}</p>
              <p className="text-white/25 text-[11px]">Registered in Nigeria</p>
            </div>
          </div>
          <p className="text-white/20 text-[11px] text-center max-w-sm">
            Private placement. Not a public offer. Investment involves risk. Past performance does not guarantee future results.
          </p>
          <div className="flex gap-5">
            <Link href="/apply" className="text-white/30 hover:text-white/60 text-[13px] transition-colors">Apply</Link>
            <Link href="/login" className="text-white/30 hover:text-white/60 text-[13px] transition-colors">Partner Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
