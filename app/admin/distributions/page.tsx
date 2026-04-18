"use client";
import { useEffect, useState } from "react";
import { fmt } from "@/lib/format";

interface Distribution {
  id: string;
  partner_id: string;
  partner_name?: string;
  period: string;
  net_profit: number;
  partner_share: number;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

interface Calc {
  partner_id: string;
  partner_name: string;
  equity_pct: number;
  amount: number;
}

export default function AdminDistributionsPage() {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState("");
  const [calcResult, setCalcResult] = useState<Calc[] | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [markPayLoading, setMarkPayLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const r = await fetch("/api/admin/distributions");
    const d = await r.json();
    setDistributions(d.distributions ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // Default quarter
    const now = new Date();
    const q = Math.ceil((now.getMonth() + 1) / 3);
    setQuarter(`${now.getFullYear()}-Q${q}`);
    load();
  }, []);

  async function handleCalculate() {
    setError("");
    setCalcLoading(true);
    try {
      const r = await fetch("/api/admin/distributions/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quarter }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCalcResult(d.calculations ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCalcLoading(false);
    }
  }

  async function handleProcess() {
    setError("");
    setProcessLoading(true);
    try {
      const r = await fetch("/api/admin/distributions/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quarter }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCalcResult(null);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessLoading(false);
    }
  }

  async function handleMarkPaid(id: string) {
    setMarkPayLoading(id);
    const r = await fetch(`/api/admin/distributions/${id}/pay`, { method: "POST" });
    const d = await r.json();
    if (!r.ok) alert(d.error);
    else load();
    setMarkPayLoading(null);
  }

  const statusColor = (s: string) => {
    switch (s) {
      case "paid": return "bg-green-900/50 text-green-300 border border-green-700";
      case "processing": return "bg-blue-900/50 text-blue-300 border border-blue-700";
      case "pending": return "bg-yellow-900/50 text-yellow-300 border border-yellow-700";
      default: return "bg-gray-900/50 text-gray-300 border border-gray-700";
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Distributions</h1>
        <p className="text-white/50 text-sm">Calculate and process quarterly profit distributions.</p>
      </div>

      {/* Calculate Section */}
      <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Calculate Quarter</h3>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            placeholder="e.g. 2024-Q1"
            className="bg-[#0f2a1e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#40916c]"
          />
          <button
            onClick={handleCalculate}
            disabled={calcLoading}
            className="bg-[#40916c] hover:bg-[#2d6a4f] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            {calcLoading ? "Calculating..." : "Calculate"}
          </button>
          {calcResult && (
            <button
              onClick={handleProcess}
              disabled={processLoading}
              className="bg-[#d4a843] hover:bg-[#c49a38] disabled:opacity-50 text-[#0f2a1e] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
            >
              {processLoading ? "Processing..." : "Process All →"}
            </button>
          )}
        </div>
        {error && <div className="mt-3 text-red-400 text-sm">{error}</div>}

        {calcResult && calcResult.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-white/40 text-xs">Partner</th>
                  <th className="text-right py-2 text-white/40 text-xs">Equity %</th>
                  <th className="text-right py-2 text-white/40 text-xs">Distribution</th>
                </tr>
              </thead>
              <tbody>
                {calcResult.map((c) => (
                  <tr key={c.partner_id} className="border-b border-white/5">
                    <td className="py-2 text-white">{c.partner_name}</td>
                    <td className="py-2 text-right text-white/60">{c.equity_pct.toFixed(3)}%</td>
                    <td className="py-2 text-right text-[#d4a843] font-semibold">{fmt.naira(c.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {calcResult && calcResult.length === 0 && (
          <div className="mt-4 text-white/40 text-sm">No active partners found or no financials for this quarter.</div>
        )}
      </div>

      {/* Distributions Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-white font-semibold">All Distributions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["Period", "Partner", "Net Profit", "Share", "Amount", "Status", "Paid", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {distributions.map((d) => (
                  <tr key={d.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{fmt.quarter(d.period)}</td>
                    <td className="px-4 py-3 text-white/70">{d.partner_name ?? d.partner_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-white/70">{fmt.naira(d.net_profit)}</td>
                    <td className="px-4 py-3 text-white/70">{fmt.percent(Number(d.partner_share))}</td>
                    <td className="px-4 py-3 text-[#d4a843] font-semibold">{fmt.naira(d.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${statusColor(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50">{d.paid_at ? fmt.shortDate(d.paid_at) : "—"}</td>
                    <td className="px-4 py-3">
                      {d.status === "pending" && (
                        <button
                          onClick={() => handleMarkPaid(d.id)}
                          disabled={markPayLoading === d.id}
                          className="bg-[#40916c] hover:bg-[#2d6a4f] disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {markPayLoading === d.id ? "..." : "Mark Paid"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {distributions.length === 0 && (
              <div className="p-12 text-center text-white/30 text-sm">No distributions yet. Calculate and process a quarter above.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
