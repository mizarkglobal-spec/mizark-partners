"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface DataPoint {
  period: string;
  cumulative: number;
}

function formatNaira(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n}`;
}

export default function DashboardChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="cumulativeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#40916c" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#40916c" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="period"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatNaira}
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip
          contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#6b7280" }}
          itemStyle={{ color: "#40916c" }}
          formatter={(v: any) => [formatNaira(Number(v)), "Cumulative"]}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="#40916c"
          strokeWidth={2}
          fill="url(#cumulativeGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
