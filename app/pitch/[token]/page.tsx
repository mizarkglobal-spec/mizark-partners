import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { fmt } from "@/lib/format";
import { PITCH_DEFAULTS, type PitchContent } from "@/app/api/admin/pitch-content/route";
import { computeProgressiveMonths, computeProgressiveYearSummaries, fmtN } from "@/lib/projections";
import PitchProjectionsTabs from "@/app/_components/PitchProjectionsTabs";
import MizarkLogo from "@/components/MizarkLogo";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}K`;
  return `₦${n}`;
}

export default async function PitchPage({ params }: Props) {
  const { token } = await params;
  const db = createAdminClient();

  const [appResult, configResult] = await Promise.all([
    db.from("partner_applications").select("*").eq("pitch_token", token).maybeSingle(),
    db.from("program_config").select("settings").eq("id", 1).maybeSingle(),
  ]);

  const application = appResult.data;
  if (!application || application.status !== "approved") {
    notFound();
  }

  // Fetch the partner record to get the agreement_token
  const { data: partner } = await db
    .from("partners")
    .select("agreement_token")
    .eq("application_id", application.id)
    .maybeSingle();

  const rawSettings = (configResult.data as any)?.settings ?? {};

  // Program settings
  const totalPool = rawSettings.total_pool_amount ?? 20_000_000;
  const totalEquityPct = rawSettings.total_equity_pct ?? 20;
  const termYears = rawSettings.term_years ?? 3;

  // Pitch content — merge DB overrides with defaults
  const pitch: PitchContent = { ...PITCH_DEFAULTS, ...(rawSettings.pitch_content as Partial<PitchContent> ?? {}) };

  // Projections — continuous 30% monthly growth, May 2026 → Apr 2029
  const projMonths = computeProgressiveMonths();
  const projYears = computeProgressiveYearSummaries(projMonths);
  const profitDistPct: number = rawSettings.profit_dist_pct ?? 30;

  const equity = (application.amount_intent / totalPool) * totalEquityPct;

  return (
    <div className="min-h-screen bg-[#f4f6f4]">
      {/* Confidential banner */}
      <div
        className="text-white px-4 py-2.5 text-center"
        style={{ background: "linear-gradient(90deg, #081a11, #0f2a1e, #081a11)" }}
      >
        <p className="text-xs text-white/50 uppercase tracking-widest">
          Confidential — Prepared exclusively for{" "}
          <strong className="text-white">{application.name}</strong> · Do not share
        </p>
      </div>

      {/* Nav */}
      <nav
        className="px-4 sm:px-8 py-4 flex items-center justify-between border-b border-white/10"
        style={{ background: "#0f2a1e" }}
      >
        <MizarkLogo subtitle="Pitch Materials" />
        <div className="flex items-center gap-2 bg-[#1a3a2a] rounded-lg px-3 py-1.5 border border-white/10">
          <svg className="w-3.5 h-3.5 text-[#74c69d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-white/50 text-xs">Private &amp; Confidential</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        {/* Cover Hero */}
        <div
          className="rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #081a11, #0f2a1e, #1a3a2a)" }}
        >
          <div
            className="absolute top-0 right-0 pointer-events-none"
            style={{
              width: 400,
              height: 400,
              background: "radial-gradient(circle at top right, rgba(212,168,67,0.08), transparent 60%)",
            }}
          />
          <div className="relative">
            <div className="inline-block bg-[#d4a843]/10 border border-[#d4a843]/25 rounded-full px-4 py-1.5 text-[#d4a843] text-xs uppercase tracking-widest mb-6">
              {pitch.round_label}
            </div>
            <h1
              className="text-3xl sm:text-4xl font-bold mb-2"
              style={{ letterSpacing: "-0.03em" }}
            >
              Mizark Global Limited
            </h1>
            <p className="text-white/50 mb-8">{pitch.company_tagline}</p>

            <div className="inline-block bg-white/[0.07] border border-white/15 rounded-2xl px-6 py-4 backdrop-blur-sm">
              <div className="text-white/40 text-xs mb-1.5">Prepared exclusively for</div>
              <div className="text-xl font-semibold text-white" style={{ letterSpacing: "-0.02em" }}>
                {application.name}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[#d4a843] font-bold">{fmt.naira(application.amount_intent)}</span>
                <span className="text-white/30">·</span>
                <span className="text-[#74c69d]">{equity.toFixed(3)}% equity stake</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Total Pool", value: fmtCompact(totalPool), sub: "Max fundraise" },
            { label: "Equity Offered", value: `${totalEquityPct}%`, sub: "Of Mizark Global" },
            { label: "Partnership Term", value: `${termYears} Year${termYears !== 1 ? "s" : ""}`, sub: "From activation date" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-5 text-center"
              style={{ background: "#0f2a1e", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className="text-2xl font-bold text-[#d4a843] mb-1"
                style={{ letterSpacing: "-0.02em" }}
              >
                {s.value}
              </div>
              <div className="text-white/60 text-xs font-medium">{s.label}</div>
              <div className="text-white/30 text-xs mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Sections */}
        {([
          {
            num: "1",
            title: "Executive Summary",
            content: (
              <div className="space-y-4 text-gray-700 leading-relaxed text-sm">
                {pitch.executive_summary.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
                <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4 mt-2">
                  <p className="text-[#166534] text-sm">
                    <strong>Your specific terms:</strong> An investment of{" "}
                    <strong>{fmt.naira(application.amount_intent)}</strong> grants you a{" "}
                    <strong>{equity.toFixed(3)}%</strong> equity stake. Quarterly distributions equal{" "}
                    {equity.toFixed(3)}% × net quarterly profit.
                  </p>
                </div>
              </div>
            ),
          },
          {
            num: "2",
            title: "Business Model & Revenue",
            content: (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      abbr: "L",
                      name: pitch.leadash_description,
                      items: pitch.leadash_items,
                    },
                    {
                      abbr: "A",
                      name: pitch.academy_description,
                      items: pitch.academy_items,
                    },
                  ].map((p) => (
                    <div key={p.abbr} className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                        <span
                          className="w-7 h-7 rounded-lg text-white text-xs flex items-center justify-center font-bold"
                          style={{ background: "#0f2a1e" }}
                        >
                          {p.abbr}
                        </span>
                        {p.name}
                      </h3>
                      <ul className="space-y-1.5">
                        {p.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-[#40916c] mt-1 flex-shrink-0">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="bg-[#f0fdf4] rounded-xl p-4 border border-[#bbf7d0]">
                  <p className="text-sm text-[#166534]">
                    <strong>Combined Strategy:</strong> {pitch.combined_strategy}
                  </p>
                </div>
              </div>
            ),
          },
          {
            num: "3",
            title: `Use of Funds — ${fmtCompact(totalPool)} Deployment`,
            content: (
              <div className="grid sm:grid-cols-2 gap-4">
                {pitch.use_of_funds.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-gray-900 text-sm">{item.category}</h4>
                      <span
                        className="text-xl font-black"
                        style={{ color: "#0f2a1e" }}
                      >
                        {item.pct}
                      </span>
                    </div>
                    <div className="text-[#40916c] font-semibold text-sm mb-3">{item.amount}</div>
                    <ul className="space-y-1">
                      {item.items.map((i, j) => (
                        <li key={j} className="text-xs text-gray-500 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                          {i}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ),
          },
          {
            num: "4",
            title: "Partnership Terms Summary",
            content: (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    ["Structure", "Musharakah (Equity)"],
                    ["Total Pool", fmtCompact(totalPool)],
                    ["Equity Offered", `${totalEquityPct}% of Mizark Global`],
                    ["Minimum", "₦1,000,000"],
                    ["Maximum", "₦20,000,000 per partner"],
                    ["Term", `${termYears} Years`],
                    ["Distributions", "Quarterly from net profit"],
                    ["Loss Sharing", "Pro-rata to equity stake"],
                    ["Exit", `At term end (year ${termYears})`],
                    ["Governing Law", "Nigerian Law"],
                    ["Dispute Resolution", "Arbitration (Lagos)"],
                    ["Capital Return", "At term end if liquidity allows"],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="text-xs text-gray-400 mb-0.5">{k}</div>
                      <div className="text-sm font-semibold text-gray-900">{v}</div>
                    </div>
                  ))}
                </div>
                <div
                  className="rounded-2xl p-5 border"
                  style={{ background: "#0f2a1e", borderColor: "rgba(116,198,157,0.2)" }}
                >
                  <div className="text-[#74c69d] text-xs uppercase tracking-wider mb-2 font-medium">Your Specific Terms</div>
                  <p className="text-white text-sm">
                    Investment of <span className="font-bold text-[#d4a843]">{fmt.naira(application.amount_intent)}</span>{" "}
                    grants <span className="font-bold text-white">{equity.toFixed(3)}%</span> equity stake.
                    Quarterly distributions = {equity.toFixed(3)}% × net quarterly profit.
                  </p>
                </div>
              </div>
            ),
          },
          {
            num: "5",
            title: "Financial Projections",
            content: (
              <div className="space-y-5">
                {/* Growth model assumptions */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#40916c] mb-4">Growth Model</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    {[
                      ["Starting Revenue (May '26)", "₦5,000,000"],
                      ["Monthly Growth Rate", "30% (compounding)"],
                      ["Projection Period", "May 2026 – Apr 2029"],
                      ["Year 1 Revenue", fmtN(projYears[0]?.total_revenue ?? 0)],
                      ["Year 2 Revenue", fmtN(projYears[1]?.total_revenue ?? 0)],
                      ["Year 3 Revenue", fmtN(projYears[2]?.total_revenue ?? 0)],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-white rounded-xl p-3 border border-gray-100">
                        <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                        <p className="font-bold text-gray-900">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <PitchProjectionsTabs
                  years={projYears}
                  allMonths={projMonths}
                  equity={equity}
                  profitDistPct={profitDistPct}
                />

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-amber-800 text-xs leading-relaxed">Projections are forward-looking estimates based on a 30% monthly compound growth model starting May 2026. Actual results may vary. Past performance does not guarantee future results.</p>
                </div>
              </div>
            ),
          },
          {
            num: "6",
            title: "Risk Factors",
            accent: true,
            content: (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-amber-800 text-sm font-medium">
                    We disclose risks honestly. Please read these carefully before proceeding.
                  </p>
                </div>
                {pitch.risk_factors.map((risk, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm">{risk.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{risk.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ),
          },
        ] as any[]).map((section) => (
          <section key={section.num} className="bg-white rounded-3xl p-5 sm:p-8 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-sm flex-shrink-0 ${section.accent ? "bg-amber-500" : ""}`}
                style={!section.accent ? { background: "#0f2a1e" } : {}}
              >
                {section.num}
              </div>
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ letterSpacing: "-0.02em" }}
              >
                {section.title}
              </h2>
            </div>
            {section.content}
          </section>
        ))}

        {/* CTA */}
        <div
          className="rounded-3xl p-6 sm:p-10 text-white text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #081a11, #0f2a1e)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center top, rgba(212,168,67,0.08), transparent 60%)" }}
          />
          <div className="relative">
            <div className="inline-block bg-[#d4a843]/10 border border-[#d4a843]/20 rounded-full px-4 py-1 text-[#d4a843] text-xs uppercase tracking-widest mb-5">
              Next Step
            </div>
            <h3
              className="text-2xl font-bold mb-3"
              style={{ letterSpacing: "-0.02em" }}
            >
              {pitch.cta_heading}
            </h3>
            <p className="text-white/50 mb-8 max-w-md mx-auto text-sm leading-relaxed">
              {pitch.cta_body}
            </p>
            <Link
              href={partner?.agreement_token ? `/agreement/${partner.agreement_token}` : "#"}
              className="inline-block text-[#0f2a1e] font-bold px-8 py-4 rounded-2xl transition-all hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg,#d4a843,#c49a38)",
                boxShadow: "0 8px 24px rgba(212,168,67,0.3)",
              }}
            >
              Review & Sign Agreement →
            </Link>
            <p className="text-white/25 text-xs mt-4">You are not committed until you sign and complete payment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
