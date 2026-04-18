"use client";
import { useEffect, useState } from "react";
import { fmt } from "@/lib/format";

interface Report {
  id: string;
  type: "monthly" | "quarterly" | "annual";
  period: string;
  pdf_url: string | null;
  generated_at: string;
  data?: any;
}

const reportTypes = ["quarterly", "monthly", "annual"] as const;

function periodLabel(r: Report): string {
  if (r.type === "monthly") return fmt.month(r.period);
  if (r.type === "quarterly") return fmt.quarter(r.period);
  return `Annual ${r.period}`;
}

function dataPreview(r: Report): string {
  const fins = Array.isArray(r.data?.financials) ? r.data.financials : r.data?.financials ? [r.data.financials] : [];
  const dists = r.data?.distributions ?? [];
  const totalNet = fins.reduce((s: number, f: any) => s + (f.net_profit != null ? f.net_profit : (f.total_rev ?? 0) - (f.expenses ?? 0)), 0);
  const parts = [];
  if (fins.length) parts.push(`Net: ${fmt.naira(totalNet)}`);
  if (dists.length) parts.push(`${dists.length} distributions`);
  return parts.length ? parts.join(" · ") : "No financial data";
}

function getPeriodDefault(type: typeof reportTypes[number]): string {
  const now = new Date();
  if (type === "monthly") return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (type === "quarterly") return `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
  return String(now.getFullYear());
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<typeof reportTypes[number]>("quarterly");
  const [genType, setGenType] = useState<typeof reportTypes[number]>("quarterly");
  const [genPeriod, setGenPeriod] = useState(getPeriodDefault("quarterly"));
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showGen, setShowGen] = useState(false);

  async function load() {
    const r = await fetch("/api/admin/reports/generate");
    const d = await r.json();
    setReports(d.reports ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleGenerate() {
    setError("");
    if (!genPeriod.trim()) { setError("Period is required"); return; }
    setGenLoading(true);
    try {
      const r = await fetch("/api/admin/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: genType, period: genPeriod.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed to generate");
      setShowGen(false);
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setGenLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/reports/${id}`, { method: "DELETE" });
      setReports((prev) => prev.filter((r) => r.id !== id));
    } finally { setDeleting(null); }
  }

  const filtered = reports.filter((r) => r.type === activeTab);

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Reports</h1>
          <p className="text-white/50 text-sm">Generate financial snapshot reports. Partners can view reports from their dashboard.</p>
        </div>
        <button
          onClick={() => setShowGen((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#40916c] hover:bg-[#2d6a4f] text-white text-sm font-semibold transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Generate Report
        </button>
      </div>

      {/* Generate panel */}
      {showGen && (
        <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm">New Report</h3>
          <div className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-white/50 text-xs mb-1.5">Report Type</label>
              <div className="flex gap-2">
                {reportTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setGenType(t); setGenPeriod(getPeriodDefault(t)); }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                      genType === t ? "bg-[#40916c] text-white" : "bg-[#0f2a1e] text-white/50 hover:text-white border border-white/10"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1.5">
                Period
                {genType === "monthly" && <span className="text-white/30 ml-1">(YYYY-MM)</span>}
                {genType === "quarterly" && <span className="text-white/30 ml-1">(YYYY-Q1)</span>}
                {genType === "annual" && <span className="text-white/30 ml-1">(YYYY)</span>}
              </label>
              {genType === "monthly" ? (
                <input
                  type="month"
                  value={genPeriod}
                  onChange={(e) => setGenPeriod(e.target.value)}
                  className="bg-[#0f2a1e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#40916c] [color-scheme:dark]"
                />
              ) : genType === "quarterly" ? (
                <select
                  value={genPeriod}
                  onChange={(e) => setGenPeriod(e.target.value)}
                  className="bg-[#0f2a1e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                >
                  {[...Array(4)].flatMap((_, qi) =>
                    [2024, 2025, 2026].map((y) => {
                      const val = `${y}-Q${qi + 1}`;
                      return <option key={val} value={val}>{val}</option>;
                    })
                  )}
                </select>
              ) : (
                <select
                  value={genPeriod}
                  onChange={(e) => setGenPeriod(e.target.value)}
                  className="bg-[#0f2a1e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                >
                  {[2024, 2025, 2026].map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              )}
            </div>
            <button
              onClick={handleGenerate}
              disabled={genLoading}
              className="bg-[#74c69d] hover:bg-[#5dbc89] disabled:opacity-50 text-[#0f2a1e] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
            >
              {genLoading ? "Generating…" : "Generate"}
            </button>
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <p className="text-white/30 text-xs">
            Generating a report creates a snapshot of all financial data and partner distributions for that period from the database.
          </p>
        </div>
      )}

      {/* Type tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {reportTypes.map((tab) => {
          const count = reports.filter((r) => r.type === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? "bg-[#2d6a4f] text-white"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-white/20 text-white" : "bg-white/10 text-white/40"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-white/20 border-t-[#74c69d] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">
          No {activeTab} reports yet. Click "Generate Report" to create one.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <div key={r.id} className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#0f2a1e] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#74c69d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                  r.type === "annual" ? "bg-[#d4a843]/10 text-[#d4a843] border border-[#d4a843]/20"
                  : r.type === "quarterly" ? "bg-[#74c69d]/10 text-[#74c69d] border border-[#74c69d]/20"
                  : "bg-white/5 text-white/50 border border-white/10"
                }`}>
                  {r.type}
                </span>
              </div>

              <div>
                <div className="text-white font-semibold">{periodLabel(r)}</div>
                <div className="text-white/30 text-xs mt-0.5">{dataPreview(r)}</div>
                <div className="text-white/20 text-xs mt-1">Generated {fmt.shortDate(r.generated_at)}</div>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-1 border-t border-white/5">
                <a
                  href={`/api/reports/${r.id}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#0f2a1e] hover:bg-[#2d6a4f] text-[#74c69d] text-xs font-semibold transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View / Print
                </a>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deleting === r.id}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
                  title="Delete report"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
