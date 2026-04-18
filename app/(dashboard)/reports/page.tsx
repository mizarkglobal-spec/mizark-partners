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

const tabs = ["quarterly", "monthly", "annual"] as const;

function periodLabel(r: Report): string {
  if (r.type === "monthly") return fmt.month(r.period);
  if (r.type === "quarterly") return fmt.quarter(r.period);
  return `Annual ${r.period}`;
}

function reportSummary(r: Report): string | null {
  const fins = Array.isArray(r.data?.financials) ? r.data.financials : r.data?.financials ? [r.data.financials] : [];
  if (!fins.length) return null;
  const totalNet = fins.reduce((s: number, f: any) => s + (f.net_profit != null ? f.net_profit : (f.total_rev ?? 0) - (f.expenses ?? 0)), 0);
  return `Net profit: ${fmt.naira(totalNet)}`;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("quarterly");

  useEffect(() => {
    fetch("/api/dashboard/reports")
      .then((r) => r.json())
      .then((d) => { setReports(d.reports ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = reports.filter((r) => r.type === activeTab);

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] mb-1">Reports</h1>
        <p className="text-gray-500 text-sm">View and download your financial reports and partnership statements.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const count = reports.filter((r) => r.type === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? "bg-[#0f2a1e] text-white"
                  : "bg-white text-gray-500 hover:text-[#111827] border border-gray-200"
              }`}
            >
              {tab}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-[#40916c] rounded-full animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((report) => {
            const summary = reportSummary(report);
            return (
              <div key={report.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#40916c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    report.type === "annual"
                      ? "bg-[#d4a843]/10 text-[#b8882e] border border-[#d4a843]/30"
                      : report.type === "quarterly"
                      ? "bg-[#40916c]/10 text-[#40916c] border border-[#40916c]/20"
                      : "bg-gray-100 text-gray-500 border border-gray-200"
                  }`}>
                    {report.type}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="text-[#111827] font-semibold">{periodLabel(report)}</div>
                  {summary && <div className="text-gray-500 text-xs mt-0.5">{summary}</div>}
                  <div className="text-gray-400 text-xs mt-1">Generated {fmt.shortDate(report.generated_at)}</div>
                </div>

                <a
                  href={`/api/reports/${report.id}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2 rounded-xl bg-[#f0fdf4] hover:bg-[#dcfce7] border border-[#bbf7d0] text-[#16a34a] font-semibold text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View & Download PDF
                </a>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-gray-500 text-sm font-medium">No {activeTab} reports yet</div>
          <div className="text-gray-400 text-xs">Reports are generated by the admin after each period closes and will appear here automatically.</div>
        </div>
      )}
    </div>
  );
}
