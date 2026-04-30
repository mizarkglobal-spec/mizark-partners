"use client";
import { useEffect, useState, useMemo } from "react";
import {
  PROJECTION_DEFAULTS,
  computeProgressiveMonths,
  computeProgressiveYearSummaries,
  progressiveMonthLabel,
  fmtN,
  type ProjectionAssumptions,
  type YearSummary,
} from "@/lib/projections";

const inputCls =
  "w-full bg-[#0f2a1e] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#74c69d]/50 transition-colors";
const labelCls = "block text-white/50 text-xs mb-1";

const YEAR_CFG = [
  { accent: "#74c69d", border: "rgba(116,198,157,0.3)", activeBorder: "rgba(116,198,157,0.7)" },
  { accent: "#d4a843", border: "rgba(212,168,67,0.3)", activeBorder: "rgba(212,168,67,0.7)" },
  { accent: "#a78bfa", border: "rgba(167,139,250,0.3)", activeBorder: "rgba(167,139,250,0.7)" },
];

const YEAR_DATE_RANGES = ["May '26 – Apr '27", "May '27 – Apr '28", "May '28 – Apr '29"];

function numFmt(n: number) { return n.toLocaleString("en-NG"); }

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
      .then((d) => { setProj({ ...PROJECTION_DEFAULTS, ...(d.projections ?? {}) }); setLoading(false); })
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

  const allMonths = useMemo(() => proj ? computeProgressiveMonths(proj) : [], [proj]);
  const years = useMemo(() => computeProgressiveYearSummaries(allMonths), [allMonths]);
  const displayMonths = useMemo(
    () => allMonths.slice(selectedYear * 12, (selectedYear + 1) * 12),
    [selectedYear, allMonths]
  );

  if (loading)
    return (
      <div className="p-8 flex justify-center pt-20">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  if (!proj) return null;

  const y1EndRev = allMonths[11]?.total_revenue ?? 0;
  const y3EndRev = allMonths[35]?.total_revenue ?? 0;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Financial Projections</h1>
          <p className="text-white/50 text-sm">
            Configure the growth model. Changes are reflected sitewide — on the homepage and in all partner pitch decks.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => { if (confirm("Reset projections to defaults?")) setProj(PROJECTION_DEFAULTS); }}
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
            {t === "assumptions" ? "Growth Model" : "Preview"}
          </button>
        ))}
      </div>

      {activeTab === "assumptions" && (
        <div className="space-y-5">
          {/* Progressive model params */}
          <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-5">
            <div>
              <h2 className="text-white font-semibold text-sm flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#74c69d]" />
                Revenue Growth Model
              </h2>
              <p className="text-white/40 text-xs">Continuous compound growth across all 3 years. May 2026 → April 2029.</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Starting Revenue (May 2026) ₦</label>
                <input
                  type="number"
                  className={inputCls}
                  value={proj.prog_starting_revenue}
                  onChange={(e) => set("prog_starting_revenue", Number(e.target.value))}
                />
                <p className="text-white/25 text-xs mt-1">Revenue in Month 1</p>
              </div>
              <div>
                <label className={labelCls}>Monthly Growth Rate %</label>
                <input
                  type="number"
                  step="0.5"
                  className={inputCls}
                  value={proj.prog_monthly_growth_pct}
                  onChange={(e) => set("prog_monthly_growth_pct", Number(e.target.value))}
                />
                <p className="text-white/25 text-xs mt-1">Compounds each month</p>
              </div>
              <div>
                <label className={labelCls}>Expense Ratio %</label>
                <input
                  type="number"
                  step="1"
                  className={inputCls}
                  value={proj.prog_expense_ratio}
                  onChange={(e) => set("prog_expense_ratio", Number(e.target.value))}
                />
                <p className="text-white/25 text-xs mt-1">% of revenue = total costs</p>
              </div>
            </div>

            {/* Live preview of key milestones */}
            <div className="bg-[#0f2a1e] rounded-xl p-4 border border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              {[
                { label: "Month 1 (May '26)", value: fmtN(proj.prog_starting_revenue) },
                { label: "End of Year 1 (Apr '27)", value: fmtN(y1EndRev) },
                { label: "Year 1 Net Profit", value: fmtN(years[0]?.net_profit ?? 0) },
                { label: "End of Year 3 (Apr '29)", value: fmtN(y3EndRev) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-white/30 mb-0.5">{label}</p>
                  <p className="text-[#74c69d] font-bold">{value}</p>
                </div>
              ))}
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
                  <p className="text-white/30 text-[10px] mb-3">{YEAR_DATE_RANGES[i]}</p>
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
                      <span className="font-bold" style={{ color: cfg.accent }}>{fmtN(y.net_profit)}</span>
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
                <span className="text-white/30 text-xs">{YEAR_DATE_RANGES[selectedYear]} · {proj.prog_monthly_growth_pct}% monthly growth</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10">
                      {["Month","Revenue","Expenses","Net Profit"].map((h) => (
                        <th key={h} className="text-left px-3 py-3 text-white/40 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayMonths.map((m, idx) => (
                      <tr key={m.month} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-3 py-2.5 text-white/60 font-medium">{progressiveMonthLabel(selectedYear * 12 + idx)}</td>
                        <td className="px-3 py-2.5 text-white font-medium">{fmtN(m.total_revenue)}</td>
                        <td className="px-3 py-2.5 text-white/50">{fmtN(m.total_expenses)}</td>
                        <td className={`px-3 py-2.5 font-bold ${m.net_profit >= 0 ? "text-[#74c69d]" : "text-red-400"}`}>{fmtN(m.net_profit)}</td>
                      </tr>
                    ))}
                    <tr className="bg-white/[0.04] border-t border-white/20">
                      <td className="px-3 py-3 text-white font-bold">Total</td>
                      <td className="px-3 py-3 text-white font-bold">{fmtN(years[selectedYear].total_revenue)}</td>
                      <td className="px-3 py-3 text-white/60 font-medium">{fmtN(years[selectedYear].total_expenses)}</td>
                      <td className="px-3 py-3 font-bold text-base text-[#74c69d]">{fmtN(years[selectedYear].net_profit)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-[#0a1f15] border border-white/5 rounded-2xl p-4">
            <p className="text-white/30 text-xs leading-relaxed">
              These figures are computed from the growth model above. Save to persist — changes are reflected on the homepage and in all pitch decks immediately.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
