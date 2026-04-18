"use client";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { fmtN } from "@/lib/projections";

interface MonthData {
  month: number;
  academy_funnel: number; // challenge_revenue + academy_revenue
  leadash: number;
  net_profit: number;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4 mb-1">
          <span style={{ color: p.color }}>{
            p.name === "academy_funnel" ? "Academy Funnel" :
            p.name === "leadash" ? "Leadash SaaS" : "Net Profit"
          }</span>
          <span className="font-semibold text-gray-900">{fmtN(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProjectionsGrowthChart({ months }: { months: MonthData[] }) {
  const data = months.map((m) => ({
    name: MONTHS[m.month - 1],
    academy_funnel: m.academy_funnel,
    leadash: m.leadash,
    net_profit: m.net_profit,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="academyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2d6a4f" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#1b4332" stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmtN}
          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="academy_funnel" stackId="rev" fill="url(#academyGrad)" radius={[0, 0, 0, 0]} name="academy_funnel" />
        <Bar dataKey="leadash" stackId="rev" fill="#74c69d" fillOpacity={0.85} radius={[4, 4, 0, 0]} name="leadash" />
        <Line
          type="monotone"
          dataKey="net_profit"
          stroke="#d4a843"
          strokeWidth={2.5}
          dot={{ fill: "#d4a843", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#d4a843" }}
          name="net_profit"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
