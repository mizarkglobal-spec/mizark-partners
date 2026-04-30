"use client";
import { useEffect, useState, useMemo } from "react";
import {
  PROJECTION_DEFAULTS,
  computeMonthlyProjections,
  computeYearSummaries,
  monthLabel,
  fmtN,
  type ProjectionAssumptions,
  type MonthProjection,
  type YearSummary,
} from "@/lib/projections";

const inputCls =
  "w-full bg-[#0f2a1e] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#74c69d]/50 transition-colors";
const labelCls = "block text-white/50 text-xs mb-1";

function numFmt(n: number) { return n.toLocaleString("en-NG"); }

const YEAR_CFG = [
  { accent: "#74c69d", border: "rgba(116,198,157,0.3)", activeBorder: "rgba(116,198,157,0.7)", label: "Year 1 · May '26 – Apr '27" },
  { accent: "#d4a843", border: "rgba(212,168,67,0.3)", activeBorder: "rgba(212,168,67,0.7)", label: "Year 2 · May '27 – Apr '28" },
  { accent: "#a78bfa", border: "rgba(167,139,250,0.3)", activeBorder: "rgba(167,139,250,0.7)", label: "Year 3 · May '28 – Apr '29" },
];

export default function ProjectionsAdminPage() {
  const [proj, setProj] = useState<ProjectionAssumptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"assumptions" | "preview">("assumptions");
  const [selectedYear, setSelectedYear] = useState(0);

  useEffect(() => {
    fetch("/api/admin/projections")
      .then((r) => r.json())
      .then((d) => {
        setProj({ ...PROJECTION_DEFAULTS, ...(d.projections ?? {}) });
        setLoading(false);
      })
      .catch(() => { setProj(PROJECTION_DEFAULTS); setLoading(false); });
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
      // Ensure arr is 36 elements
      while (arr.length < 36) arr.push(arr[arr.length - 1] ?? 0);
      arr[i] = val;
      return { ...p, ad_spend_monthly: arr };
    });
  }

  const months = useMemo(() => proj ? computeMonthlyProjections(proj) : [], [proj]);
  const years = useMemo(() => proj ? computeYearSummaries(proj) : [], [proj]);
  const displayMonths = useMemo(
    () => months.slice(selectedYear * 12, (selectedYear + 1) * 12),
    [selectedYear, months]
  );

  const funnelPreview = useMemo(() => {
    if (!proj) return null;
    const exSpend = proj.ad_spend_monthly[0] ?? 0;
    const challenge = Math.floor(exSpend / Math.max(proj.cpc, 1));
    const academy = Math.floor(challenge * proj.academy_conversion_pct / 100);
    return { exSpend, challenge, academy };
  }, [proj]);

  if (loading)
    return (
      <div className="p-8 flex justify-center pt-20">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  if (!proj) return null;

  // Ensure 36 months when rendering
  const adSpend36 = [...proj.ad_spend_monthly];
  while (adSpend36.length < 36) adSpend36.push(adSpend36[adSpend36.length - 1] ?? 0);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Financial Projections</h1>
          <p className="text-white/50 text-sm">
            Set funnel assumptions and ad spend for all 36 months. Projections compound continuously — no year resets.
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Cost Per Challenge (CPC) ₦</label>
                <input type="number" className={inputCls} value={proj.cpc}
                  onChange={(e) => set("cpc", Number(e.target.value))} />
                <p className="text-white/25 text-xs mt-1">Ad spend ÷ CPC = challenge buyers</p>
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
            {funnelPreview && (
              <div className="bg-[#0f2a1e] rounded-xl p-4 border border-white/5">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Month 1 (May '26) Funnel Preview</p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {[
                    { label: `₦${numFmt(funnelPreview.exSpend)} ad spend`, color: "bg-white/10 text-white/70" },
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
                  Month 36 MRR → {fmtN(Math.floor(proj.leadash_starting_mrr * Math.pow(1 + proj.leadash_monthly_growth_pct / 100, 35)))}
                </p>
              </div>
            </div>
          </div>

          {/* Ad Spend Ramp — 36 months split into 3 year sections */}
          {([0, 1, 2] as const).map((y) => {
            const yMonths = adSpend36.slice(y * 12, (y + 1) * 12);
            const yMax = Math.max(...yMonths, 1);
            const cfg = YEAR_CFG[y];
            return (
              <div key={y} className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: cfg.accent }} />
                    Ad Spend — {cfg.label}
                  </h2>
                  <span className="text-white/30 text-xs">
                    Total: {fmtN(yMonths.reduce((a, b) => a + b, 0))}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {yMonths.map((val, i) => {
                    const absIdx = y * 12 + i;
                    return (
                      <div key={absIdx}>
                        <label className={labelCls}>{monthLabel(absIdx)}</label>
                        <input
                          type="number"
                          className={inputCls}
                          value={val}
                          onChange={(e) => setAdSpend(absIdx, Number(e.target.value))}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-1.5 mt-1">
                  {yMonths.map((val, i) => {
                    const absIdx = y * 12 + i;
                    const pct = (val / yMax) * 100;
                    return (
                      <div key={absIdx} className="flex items-center gap-2">
                        <span className="text-white/30 text-xs w-14">{monthLabel(absIdx)}</span>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.accent + "99" }} />
                        </div>
                        <span className="text-white/40 text-xs w-14 text-right">{fmtN(val)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

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
          {/* Year Summary Cards */}
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
                  <div className="text-xs uppercase tracking-wider mb-1 flex items-center justify-between" style={{ color: cfg.accent }}>
                    <span>Year {y.year}</span>
                    {isActive && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold text-white"
                        style={{ background: cfg.activeBorder }}>
                        Viewing
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 mt-3">
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
                      <span className="font-bold" style={{ color: cfg.accent }}>{fmtN(y.net_profit)}</span>
                    </div>
                    <div className="text-xs text-white/30 pt-1 space-y-0.5">
                      <div className="flex justify-between"><span>Challenge buyers</span><span>{numFmt(y.total_challenge_buyers)}</span></div>
                      <div className="flex justify-between"><span>Academy buyers</span><span>{numFmt(y.total_academy_buyers)}</span></div>
                      <div className="flex justify-between"><span>Challenge rev</span><span>{fmtN(y.total_challenge_revenue)}</span></div>
                      <div className="flex justify-between"><span>Academy rev</span><span>{fmtN(y.total_academy_revenue)}</span></div>
                      <div className="flex justify-between"><span>Leadash</span><span>{fmtN(y.total_leadash_revenue)}</span></div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Monthly Table */}
          {years[selectedYear] && (
            <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-white font-semibold text-sm">
                  Year {years[selectedYear].year} — Monthly Breakdown
                </h2>
                <span className="text-white/30 text-xs">{YEAR_CFG[selectedYear].label}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10">
                      {["Month","Ad Spend","Challenge","Academy","Challenge Rev","Academy Rev","Leadash","Total Rev","Expenses","Net Profit"].map((h) => (
                        <th key={h} className="text-left px-3 py-3 text-white/40 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayMonths.map((m, idx) => (
                      <tr key={m.month} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-3 py-2.5 text-white/60 font-medium">{monthLabel(selectedYear * 12 + idx)}</td>
                        <td className="px-3 py-2.5 text-white/50">{fmtN(m.ad_spend)}</td>
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
                    <tr className="bg-white/[0.04] border-t border-white/20">
                      <td className="px-3 py-3 text-white font-bold">Total</td>
                      <td className="px-3 py-3 text-white/60 font-medium">{fmtN(years[selectedYear].total_expenses)}</td>
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
              Computed from assumptions above. Leadash MRR compounds continuously across all 36 months. Save to persist — changes reflect sitewide.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
