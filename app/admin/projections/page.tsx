"use client";
import { useEffect, useState, useMemo } from "react";
import {
  PROJECTION_DEFAULTS,
  computeMonthlyProjections,
  computeYearSummaries,
  fmtN,
  type ProjectionAssumptions,
  type MonthProjection,
  type YearSummary,
} from "@/lib/projections";

const inputCls =
  "w-full bg-[#0f2a1e] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#74c69d]/50 transition-colors";
const labelCls = "block text-white/50 text-xs mb-1";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function numFmt(n: number) {
  return n.toLocaleString("en-NG");
}

function scaleMonthsForYear(
  y1Months: MonthProjection[],
  y1: YearSummary,
  yN: YearSummary
): MonthProjection[] {
  const revRatio = y1.total_revenue > 0 ? yN.total_revenue / y1.total_revenue : 1;
  const profitRatio = y1.net_profit !== 0 ? yN.net_profit / y1.net_profit : 1;
  const expRatio = y1.total_expenses > 0 ? yN.total_expenses / y1.total_expenses : 1;
  return y1Months.map((m) => ({
    ...m,
    ad_spend: Math.round(m.ad_spend * expRatio),
    leads: Math.round(m.leads * revRatio),
    challenge_buyers: Math.round(m.challenge_buyers * revRatio),
    academy_buyers: Math.round(m.academy_buyers * revRatio),
    challenge_revenue: Math.round(m.challenge_revenue * revRatio),
    academy_revenue: Math.round(m.academy_revenue * revRatio),
    leadash_mrr: Math.round(m.leadash_mrr * revRatio),
    total_revenue: Math.round(m.total_revenue * revRatio),
    total_expenses: Math.round(m.total_expenses * expRatio),
    net_profit: Math.round(m.net_profit * profitRatio),
  }));
}

const YEAR_CFG = [
  { accent: "#74c69d", border: "rgba(116,198,157,0.3)", activeBorder: "rgba(116,198,157,0.7)" },
  { accent: "#d4a843", border: "rgba(212,168,67,0.3)", activeBorder: "rgba(212,168,67,0.7)" },
  { accent: "#a78bfa", border: "rgba(167,139,250,0.3)", activeBorder: "rgba(167,139,250,0.7)" },
];

export default function ProjectionsAdminPage() {
  const [proj, setProj] = useState<ProjectionAssumptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"assumptions" | "preview">("assumptions");
  const [selectedYear, setSelectedYear] = useState(0); // 0=Y1, 1=Y2, 2=Y3

  useEffect(() => {
    fetch("/api/admin/projections")
      .then((r) => r.json())
      .then((d) => { setProj(d.projections); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!proj) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/projections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proj),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof ProjectionAssumptions>(key: K, val: ProjectionAssumptions[K]) {
    setProj((p) => (p ? { ...p, [key]: val } : p));
  }

  function setAdSpend(i: number, val: number) {
    setProj((p) => {
      if (!p) return p;
      const arr = [...p.ad_spend_monthly];
      arr[i] = val;
      return { ...p, ad_spend_monthly: arr };
    });
  }

  const months = useMemo(() => proj ? computeMonthlyProjections(proj) : [], [proj]);
  const years = useMemo(() => proj ? computeYearSummaries(proj) : [], [proj]);

  const displayMonths = useMemo(() => {
    if (selectedYear === 0 || !years[0] || !years[selectedYear]) return months;
    return scaleMonthsForYear(months, years[0], years[selectedYear]);
  }, [selectedYear, months, years]);

  // Live funnel preview from assumptions
  const funnelPreview = useMemo(() => {
    if (!proj) return null;
    const exSpend = proj.ad_spend_monthly[0] ?? 0;
    const leads = Math.floor(exSpend / Math.max(proj.cpl, 1));
    const challenge = Math.floor(leads * proj.challenge_conversion_pct / 100);
    const academy = Math.floor(challenge * proj.academy_conversion_pct / 100);
    return { exSpend, leads, challenge, academy };
  }, [proj]);

  if (loading)
    return (
      <div className="p-8 flex justify-center pt-20">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  if (!proj) return null;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Financial Projections</h1>
          <p className="text-white/50 text-sm">
            Set funnel assumptions and ad spend ramp. Projections are computed live — no manual data entry.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => { if (confirm("Reset all projections to defaults?")) setProj(PROJECTION_DEFAULTS); }}
            className="text-white/30 hover:text-white/60 text-xs transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#74c69d] hover:bg-[#5dbc89] disabled:opacity-50 text-[#0f2a1e] font-bold text-sm transition-colors"
          >
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0a1f15] rounded-xl p-1 w-fit">
        {(["assumptions", "preview"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              activeTab === t ? "bg-[#1a3a2a] text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            {t === "assumptions" ? "Assumptions" : "Computed Preview"}
          </button>
        ))}
      </div>

      {activeTab === "assumptions" && (
        <div className="space-y-5">
          {/* Funnel Assumptions */}
          <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-5">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#74c69d]" />
              Marketing Funnel
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Cost Per Lead (CPL) ₦</label>
                <input type="number" className={inputCls} value={proj.cpl}
                  onChange={(e) => set("cpl", Number(e.target.value))} />
              </div>
              <div>
                <label className={labelCls}>Challenge Conversion %</label>
                <input type="number" step="0.1" className={inputCls} value={proj.challenge_conversion_pct}
                  onChange={(e) => set("challenge_conversion_pct", Number(e.target.value))} />
                <p className="text-white/25 text-xs mt-1">Leads → Challenge buyers</p>
              </div>
              <div>
                <label className={labelCls}>Academy Conversion %</label>
                <input type="number" step="0.1" className={inputCls} value={proj.academy_conversion_pct}
                  onChange={(e) => set("academy_conversion_pct", Number(e.target.value))} />
                <p className="text-white/25 text-xs mt-1">Challenge buyers → Academy</p>
              </div>
              <div>
                <label className={labelCls}>Monthly Ops Cost ₦</label>
                <input type="number" className={inputCls} value={proj.ops_cost_monthly}
                  onChange={(e) => set("ops_cost_monthly", Number(e.target.value))} />
                <p className="text-white/25 text-xs mt-1">Salaries, tools, etc.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>5-Day Challenge Price ₦</label>
                <input type="number" className={inputCls} value={proj.challenge_price}
                  onChange={(e) => set("challenge_price", Number(e.target.value))} />
              </div>
              <div>
                <label className={labelCls}>Academy Price ₦</label>
                <input type="number" className={inputCls} value={proj.academy_price}
                  onChange={(e) => set("academy_price", Number(e.target.value))} />
              </div>
            </div>

            {/* Live funnel preview */}
            {funnelPreview && (
              <div className="bg-[#0f2a1e] rounded-xl p-4 border border-white/5">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Month 1 Funnel Preview</p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {[
                    { label: `₦${numFmt(funnelPreview.exSpend)} ad spend`, color: "bg-white/10 text-white/70" },
                    { label: "→", color: "text-white/30 bg-transparent px-0" },
                    { label: `${numFmt(funnelPreview.leads)} leads`, color: "bg-blue-900/40 text-blue-300 border border-blue-800/40" },
                    { label: "→", color: "text-white/30 bg-transparent px-0" },
                    { label: `${numFmt(funnelPreview.challenge)} challenge buyers`, color: "bg-[#74c69d]/10 text-[#74c69d] border border-[#74c69d]/20" },
                    { label: "→", color: "text-white/30 bg-transparent px-0" },
                    { label: `${numFmt(funnelPreview.academy)} academy buyers`, color: "bg-[#d4a843]/15 text-[#d4a843] border border-[#d4a843]/25" },
                  ].map((item, i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-lg font-medium ${item.color}`}>{item.label}</span>
                  ))}
                </div>
                <div className="flex gap-4 mt-3 text-xs text-white/40">
                  <span>Challenge rev: <span className="text-[#74c69d]">{fmtN(funnelPreview.challenge * proj.challenge_price)}</span></span>
                  <span>Academy rev: <span className="text-[#d4a843]">{fmtN(funnelPreview.academy * proj.academy_price)}</span></span>
                </div>
              </div>
            )}
          </div>

          {/* Leadash */}
          <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Leadash SaaS
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Starting Monthly Recurring Revenue ₦</label>
                <input type="number" className={inputCls} value={proj.leadash_starting_mrr}
                  onChange={(e) => set("leadash_starting_mrr", Number(e.target.value))} />
              </div>
              <div>
                <label className={labelCls}>Monthly MRR Growth %</label>
                <input type="number" step="0.5" className={inputCls} value={proj.leadash_monthly_growth_pct}
                  onChange={(e) => set("leadash_monthly_growth_pct", Number(e.target.value))} />
                <p className="text-white/25 text-xs mt-1">
                  Month 12 MRR → {fmtN(Math.floor(proj.leadash_starting_mrr * Math.pow(1 + proj.leadash_monthly_growth_pct / 100, 11)))}
                </p>
              </div>
            </div>
          </div>

          {/* Ad Spend Ramp */}
          <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#d4a843]" />
                Monthly Ad Spend Ramp
              </h2>
              <span className="text-white/30 text-xs">
                Total Y1 ads: {fmtN(proj.ad_spend_monthly.slice(0,12).reduce((a,b) => a+b, 0))}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {proj.ad_spend_monthly.slice(0, 12).map((val, i) => (
                <div key={i}>
                  <label className={labelCls}>Month {i + 1} ({MONTH_LABELS[i]})</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={val}
                    onChange={(e) => setAdSpend(i, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
            {/* Bar visualization */}
            <div className="space-y-1.5 mt-2">
              {proj.ad_spend_monthly.slice(0, 12).map((val, i) => {
                const max = Math.max(...proj.ad_spend_monthly.slice(0, 12));
                const pct = max > 0 ? (val / max) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-white/30 text-xs w-8">{MONTH_LABELS[i]}</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#d4a843]/70 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-white/40 text-xs w-14 text-right">{fmtN(val)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Year 2/3 Growth */}
          <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Year 2 &amp; 3 Growth
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Year 2 Growth % (vs Year 1)</label>
                <input type="number" className={inputCls} value={proj.year2_growth_pct}
                  onChange={(e) => set("year2_growth_pct", Number(e.target.value))} />
                <p className="text-white/25 text-xs mt-1">e.g. 80 → Year 2 revenue = Year 1 × 1.8</p>
              </div>
              <div>
                <label className={labelCls}>Year 3 Growth % (vs Year 2)</label>
                <input type="number" className={inputCls} value={proj.year3_growth_pct}
                  onChange={(e) => set("year3_growth_pct", Number(e.target.value))} />
                <p className="text-white/25 text-xs mt-1">e.g. 60 → Year 3 revenue = Year 2 × 1.6</p>
              </div>
            </div>
          </div>

          {/* Homepage Display */}
          <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white/40" />
              Homepage Display
            </h2>
            <button
              onClick={() => set("show_on_homepage", !proj.show_on_homepage)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all w-full text-left ${
                proj.show_on_homepage ? "border-[#74c69d] bg-[#74c69d]/10" : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                proj.show_on_homepage ? "bg-[#74c69d] border-[#74c69d]" : "border-white/30"
              }`}>
                {proj.show_on_homepage && (
                  <svg className="w-3 h-3 text-[#0f2a1e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-white/80 text-sm">Show projections section on homepage</span>
            </button>
            <div>
              <label className={labelCls}>Disclaimer Text</label>
              <textarea
                className={inputCls + " resize-none"}
                rows={3}
                value={proj.disclaimer}
                onChange={(e) => set("disclaimer", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "preview" && (
        <div className="space-y-6">
          {/* Year Summary Cards — clickable */}
          <div className="grid sm:grid-cols-3 gap-4">
            {years.map((y, i) => {
              const cfg = YEAR_CFG[i];
              const isActive = selectedYear === i;
              return (
                <button
                  key={y.year}
                  onClick={() => setSelectedYear(i)}
                  className="rounded-2xl p-5 border bg-[#1a3a2a] text-left transition-all"
                  style={{
                    borderColor: isActive ? cfg.activeBorder : cfg.border,
                    boxShadow: isActive ? `0 0 0 2px ${cfg.activeBorder}` : "none",
                    outline: "none",
                  }}
                >
                  <div className="text-xs uppercase tracking-wider mb-3 flex items-center justify-between" style={{ color: cfg.accent }}>
                    <span>Year {y.year}</span>
                    {isActive && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold text-white"
                        style={{ background: cfg.activeBorder }}>
                        Viewing
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Revenue</span>
                      <span className="text-white font-bold">{fmtN(y.total_revenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Expenses</span>
                      <span className="text-white/70">{fmtN(y.total_expenses)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                      <span className="text-white/50">Net Profit</span>
                      <span className={`font-bold ${y.net_profit >= 0 ? "" : "text-red-400"}`} style={y.net_profit >= 0 ? { color: cfg.accent } : {}}>
                        {fmtN(y.net_profit)}
                      </span>
                    </div>
                    <div className="text-xs text-white/30 pt-1 space-y-0.5">
                      <div className="flex justify-between"><span>Challenge</span><span>{fmtN(y.total_challenge_revenue)}</span></div>
                      <div className="flex justify-between"><span>Academy</span><span>{fmtN(y.total_academy_revenue)}</span></div>
                      <div className="flex justify-between"><span>Leadash</span><span>{fmtN(y.total_leadash_revenue)}</span></div>
                      <div className="flex justify-between"><span>Academy buyers</span><span>{numFmt(y.total_academy_buyers)}</span></div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 12-Month Table — driven by selectedYear */}
          {years[selectedYear] && (
            <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-white font-semibold text-sm">
                  Year {years[selectedYear].year} — Monthly Breakdown
                </h2>
                {selectedYear > 0 && (
                  <span className="text-white/30 text-xs">Proportionally scaled from Year 1</span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10">
                      {["Month","Ad Spend","Leads","Challenge","Academy","Challenge Rev","Academy Rev","Leadash","Total Rev","Expenses","Net Profit"].map((h) => (
                        <th key={h} className="text-left px-3 py-3 text-white/40 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayMonths.map((m) => (
                      <tr key={m.month} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-3 py-2.5 text-white/60 font-medium">{MONTH_LABELS[m.month - 1]}</td>
                        <td className="px-3 py-2.5 text-white/50">{fmtN(m.ad_spend)}</td>
                        <td className="px-3 py-2.5 text-blue-300">{numFmt(m.leads)}</td>
                        <td className="px-3 py-2.5 text-[#74c69d]">{numFmt(m.challenge_buyers)}</td>
                        <td className="px-3 py-2.5 text-[#d4a843]">{numFmt(m.academy_buyers)}</td>
                        <td className="px-3 py-2.5 text-[#74c69d]">{fmtN(m.challenge_revenue)}</td>
                        <td className="px-3 py-2.5 text-[#d4a843]">{fmtN(m.academy_revenue)}</td>
                        <td className="px-3 py-2.5 text-blue-300">{fmtN(m.leadash_mrr)}</td>
                        <td className="px-3 py-2.5 text-white font-medium">{fmtN(m.total_revenue)}</td>
                        <td className="px-3 py-2.5 text-white/50">{fmtN(m.total_expenses)}</td>
                        <td className={`px-3 py-2.5 font-bold ${m.net_profit >= 0 ? "text-[#74c69d]" : "text-red-400"}`}>{fmtN(m.net_profit)}</td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="bg-white/[0.04] border-t border-white/20">
                      <td className="px-3 py-3 text-white font-bold">Total</td>
                      <td className="px-3 py-3 text-white/60 font-medium">{fmtN(years[selectedYear].total_expenses)}</td>
                      <td className="px-3 py-3 text-blue-300 font-medium">{numFmt(years[selectedYear].total_leads)}</td>
                      <td className="px-3 py-3 text-[#74c69d] font-medium">{numFmt(years[selectedYear].total_challenge_buyers)}</td>
                      <td className="px-3 py-3 text-[#d4a843] font-medium">{numFmt(years[selectedYear].total_academy_buyers)}</td>
                      <td className="px-3 py-3 text-[#74c69d] font-bold">{fmtN(years[selectedYear].total_challenge_revenue)}</td>
                      <td className="px-3 py-3 text-[#d4a843] font-bold">{fmtN(years[selectedYear].total_academy_revenue)}</td>
                      <td className="px-3 py-3 text-blue-300 font-bold">{fmtN(years[selectedYear].total_leadash_revenue)}</td>
                      <td className="px-3 py-3 text-white font-bold">{fmtN(years[selectedYear].total_revenue)}</td>
                      <td className="px-3 py-3 text-white/60 font-medium">{fmtN(years[selectedYear].total_expenses)}</td>
                      <td className={`px-3 py-3 font-bold text-base ${years[selectedYear].net_profit >= 0 ? "text-[#74c69d]" : "text-red-400"}`}>
                        {fmtN(years[selectedYear].net_profit)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-[#0a1f15] border border-white/5 rounded-2xl p-4">
            <p className="text-white/30 text-xs leading-relaxed">
              These figures are computed from your assumptions above. Save to persist changes. Projections are shown to potential investors on the homepage (if enabled) and in pitch materials.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
