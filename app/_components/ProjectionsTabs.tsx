"use client";
import { useState } from "react";
import { fmtN, type YearSummary } from "@/lib/projections";
import ProjectionsGrowthChart from "./ProjectionsGrowthChart";

interface ChartMonth {
  month: number;
  academy_funnel: number;
  leadash: number;
  net_profit: number;
}

interface Props {
  years: YearSummary[];
  y1Months: ChartMonth[];
  disclaimer: string;
}

function scaleMonths(y1Months: ChartMonth[], y1: YearSummary, yN: YearSummary): ChartMonth[] {
  const revRatio = y1.total_revenue > 0 ? yN.total_revenue / y1.total_revenue : 1;
  const profitRatio = y1.net_profit !== 0 ? yN.net_profit / y1.net_profit : 1;
  const academyRatio =
    (y1.total_challenge_revenue + y1.total_academy_revenue) > 0
      ? (yN.total_challenge_revenue + yN.total_academy_revenue) /
        (y1.total_challenge_revenue + y1.total_academy_revenue)
      : revRatio;
  const leadashRatio =
    y1.total_leadash_revenue > 0 ? yN.total_leadash_revenue / y1.total_leadash_revenue : revRatio;
  return y1Months.map((m) => ({
    month: m.month,
    academy_funnel: Math.round(m.academy_funnel * academyRatio),
    leadash: Math.round(m.leadash * leadashRatio),
    net_profit: Math.round(m.net_profit * profitRatio),
  }));
}

const YEAR_CONFIGS = [
  { accent: "#74c69d", bg: "linear-gradient(135deg,#0f2a1e,#1a3a2a)", border: "rgba(116,198,157,0.2)", activeBorder: "rgba(116,198,157,0.6)" },
  { accent: "#d4a843", bg: "linear-gradient(135deg,#1a1400,#2a2000)", border: "rgba(212,168,67,0.2)", activeBorder: "rgba(212,168,67,0.6)" },
  { accent: "#a78bfa", bg: "linear-gradient(135deg,#0f0a1e,#1a1030)", border: "rgba(167,139,250,0.2)", activeBorder: "rgba(167,139,250,0.6)" },
];

export default function ProjectionsTabs({ years, y1Months, disclaimer }: Props) {
  const [selected, setSelected] = useState(0);

  const activeMonths =
    selected === 0
      ? y1Months
      : scaleMonths(y1Months, years[0], years[selected]);

  const y = years[selected];
  const c = YEAR_CONFIGS[selected];

  return (
    <div>
      {/* Year cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {years.map((yr, i) => {
          const cfg = YEAR_CONFIGS[i];
          const isActive = selected === i;
          return (
            <button
              key={yr.year}
              onClick={() => setSelected(i)}
              className="rounded-[20px] p-6 border text-left transition-all"
              style={{
                background: cfg.bg,
                borderColor: isActive ? cfg.activeBorder : cfg.border,
                boxShadow: isActive ? `0 0 0 2px ${cfg.activeBorder}` : "none",
                outline: "none",
              }}
            >
              <div className="text-white/40 text-[11px] uppercase tracking-[0.12em] mb-4 font-medium flex items-center justify-between">
                <span>Year {yr.year} Projection</span>
                {isActive && (
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: cfg.activeBorder, color: "#fff" }}
                  >
                    Selected
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-white/40 text-[11px] mb-0.5">Total Revenue</p>
                  <p className="text-white font-bold text-[22px] tracking-[-0.02em]">{fmtN(yr.total_revenue)}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[11px] mb-0.5">Net Profit</p>
                  <p className="font-bold text-[18px]" style={{ color: cfg.accent }}>{fmtN(yr.net_profit)}</p>
                </div>
                <div className="pt-3 border-t space-y-1.5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-white/35">Academy</span>
                    <span className="text-white/60">{fmtN(yr.total_challenge_revenue + yr.total_academy_revenue)}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-white/35">Leadash SaaS</span>
                    <span className="text-white/60">{fmtN(yr.total_leadash_revenue)}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div
        className="rounded-[20px] overflow-hidden border border-white/10"
        style={{ background: "#0f2a1e" }}
      >
        <div className="px-6 pt-5 pb-2 flex items-center justify-between flex-wrap gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: c.accent }}>
            Year {y.year} — Monthly Revenue &amp; Profit
          </p>
          <div className="flex items-center gap-4 text-[11px] text-white/40">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm inline-block" style={{ background: "#2d6a4f" }} />
              Academy
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm inline-block bg-[#74c69d]" />
              Leadash
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block bg-[#d4a843]" />
              Net Profit
            </span>
          </div>
        </div>
        <div className="px-2 pb-4">
          <ProjectionsGrowthChart months={activeMonths} />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-[14px] p-4">
        <span className="text-amber-500 text-base flex-shrink-0 mt-0.5">⚠</span>
        <p className="text-amber-800 text-[12px] leading-relaxed">{disclaimer}</p>
      </div>
    </div>
  );
}
