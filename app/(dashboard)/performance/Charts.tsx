"use client";
import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { fmt } from "@/lib/format";

interface FinancialRow {
  period: string;
  leadash_rev: number;
  academy_rev: number;
  total_rev: number;
  expenses: number;
  net_profit: number;
}

function formatNaira(n: number) {
  if (Math.abs(n) >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n}`;
}

const tooltipStyle = {
  contentStyle: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "#6b7280" },
};

export default function PerformanceCharts({ data }: { data: FinancialRow[] }) {
  const [period, setPeriod] = useState<"6" | "12" | "all">("12");

  const filtered = period === "all"
    ? data
    : data.slice(-parseInt(period));

  const chartData = filtered.map((row) => ({
    name: row.period.slice(0, 7),
    leadash: row.leadash_rev,
    academy: row.academy_rev,
    netProfit: row.net_profit,
    expenses: row.expenses,
  }));

  return (
    <div className="space-y-6">
      {/* Period Tabs */}
      <div className="flex gap-2">
        {(["6", "12", "all"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p
                ? "bg-[#0f2a1e] text-white"
                : "bg-white text-gray-500 hover:text-[#111827] border border-gray-200"
            }`}
          >
            {p === "6" ? "Last 6 months" : p === "12" ? "Last 12 months" : "All time"}
          </button>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h3 className="text-[#111827] font-semibold mb-1">Revenue — Leadash + Academy</h3>
        <p className="text-gray-400 text-xs mb-5">Monthly revenue stacked by product</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="leadashGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#40916c" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#40916c" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="academyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d4a843" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#d4a843" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatNaira} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={60} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [formatNaira(Number(v))]} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#6b7280" }} />
            <Area type="monotone" dataKey="leadash" name="Leadash" stackId="1" stroke="#40916c" fill="url(#leadashGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="academy" name="Academy" stackId="1" stroke="#d4a843" fill="url(#academyGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Net Profit Chart */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h3 className="text-[#111827] font-semibold mb-1">Net Profit</h3>
        <p className="text-gray-400 text-xs mb-5">Monthly net profit after all expenses</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatNaira} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={60} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [formatNaira(Number(v)), "Net Profit"]} />
            <Bar dataKey="netProfit" name="Net Profit" fill="#40916c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
