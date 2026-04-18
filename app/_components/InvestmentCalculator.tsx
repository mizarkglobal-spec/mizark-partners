"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { fmtN, type YearSummary } from "@/lib/projections";

interface Props {
  totalPool: number;
  totalEquityPct: number;
  profitDistPct: number;
  projYears: YearSummary[];
  minInvestment: number;
  maxInvestment: number;
  termYears: number;
}

const PRESETS = [500_000, 1_000_000, 2_000_000, 5_000_000];

function fmtNaira(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}K`;
  return `₦${n.toLocaleString("en-NG")}`;
}

function fmtFull(n: number) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}

export default function InvestmentCalculator({
  totalPool,
  totalEquityPct,
  profitDistPct,
  projYears,
  minInvestment,
  maxInvestment,
  termYears,
}: Props) {
  const [amount, setAmount] = useState(2_000_000);

  const clampedMin = Math.min(minInvestment, maxInvestment);
  const clampedMax = Math.max(minInvestment, maxInvestment);
  const step = 100_000;

  const calc = useMemo(() => {
    const equity = (amount / totalPool) * totalEquityPct; // percentage
    const years = projYears.map((y) => ({
      year: y.year,
      dist: Math.floor(Math.max(0, y.net_profit) * (profitDistPct / 100) * (equity / 100)),
    }));
    const totalDist = years.reduce((s, y) => s + y.dist, 0);
    const roi = amount > 0 ? (totalDist / amount) * 100 : 0;
    const avgAnnual = termYears > 0 ? totalDist / termYears : totalDist;
    return { equity, years, totalDist, roi, avgAnnual };
  }, [amount, totalPool, totalEquityPct, profitDistPct, projYears, termYears]);

  const sliderPct = ((amount - clampedMin) / (clampedMax - clampedMin)) * 100;

  return (
    <div
      className="rounded-[24px] overflow-hidden"
      style={{ background: "linear-gradient(135deg, #081a11, #0f2a1e, #1a3a2a)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Header */}
      <div className="px-6 sm:px-10 pt-8 pb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#74c69d] mb-2">Investment Calculator</p>
        <h3 className="text-white font-bold text-[22px] sm:text-[26px] tracking-[-0.02em]">
          What could your investment return?
        </h3>
        <p className="text-white/40 text-[13px] mt-1">
          Drag the slider to explore projected distributions based on our growth model.
        </p>
      </div>

      <div className="px-6 sm:px-10 py-8 space-y-8">
        {/* Slider */}
        <div>
          <div className="flex items-baseline justify-between mb-5">
            <span className="text-white/50 text-[13px]">Investment Amount</span>
            <span className="text-[#d4a843] font-black text-[28px] sm:text-[34px] tracking-[-0.03em]">
              {fmtFull(amount)}
            </span>
          </div>

          {/* Custom slider track */}
          <div className="relative">
            <div className="h-2 rounded-full bg-white/10 relative overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all"
                style={{ width: `${sliderPct}%`, background: "linear-gradient(90deg, #40916c, #d4a843)" }}
              />
            </div>
            <input
              type="range"
              min={clampedMin}
              max={clampedMax}
              step={step}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
              style={{ margin: 0 }}
            />
            {/* Thumb indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-[#d4a843] bg-[#0f2a1e] shadow-lg pointer-events-none transition-all"
              style={{ left: `calc(${sliderPct}% - 10px)` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-white/25 mt-2">
            <span>{fmtNaira(clampedMin)}</span>
            <span>{fmtNaira(clampedMax)}</span>
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {PRESETS.filter((p) => p >= clampedMin && p <= clampedMax).map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p)}
                className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-all"
                style={
                  amount === p
                    ? { background: "rgba(212,168,67,0.15)", borderColor: "rgba(212,168,67,0.5)", color: "#d4a843" }
                    : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }
                }
              >
                {fmtNaira(p)}
              </button>
            ))}
          </div>
        </div>

        {/* Equity stake */}
        <div
          className="flex items-center gap-4 rounded-[14px] px-5 py-4"
          style={{ background: "rgba(116,198,157,0.08)", border: "1px solid rgba(116,198,157,0.15)" }}
        >
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(116,198,157,0.15)" }}>
            <svg className="w-5 h-5 text-[#74c69d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-white/40 text-[11px] uppercase tracking-wider">Your equity stake</p>
            <p className="text-[#74c69d] font-black text-[22px] tracking-[-0.02em]">
              {calc.equity.toFixed(3)}%
              <span className="text-white/30 text-[13px] font-normal ml-2">of Mizark Global</span>
            </p>
          </div>
        </div>

        {/* Year-by-year distributions */}
        {projYears.length > 0 && (
          <div>
            <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Projected Quarterly Distributions</p>
            <div className="grid grid-cols-3 gap-3">
              {calc.years.map((y, i) => {
                const colors = [
                  { accent: "#74c69d", bg: "rgba(116,198,157,0.07)", border: "rgba(116,198,157,0.15)" },
                  { accent: "#d4a843", bg: "rgba(212,168,67,0.07)", border: "rgba(212,168,67,0.15)" },
                  { accent: "#a78bfa", bg: "rgba(167,139,250,0.07)", border: "rgba(167,139,250,0.15)" },
                ][i];
                return (
                  <div
                    key={y.year}
                    className="rounded-[14px] px-4 py-4 text-center"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                  >
                    <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: colors.accent }}>Year {y.year}</p>
                    <p className="font-black text-white text-[15px] sm:text-[17px] tracking-[-0.02em]">{fmtN(y.dist)}</p>
                    <p className="text-white/25 text-[10px] mt-1">from {profitDistPct}% profit pool</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary stats */}
        {projYears.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-[14px] px-5 py-4"
              style={{ background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.15)" }}
            >
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-1">{termYears}-Year Total</p>
              <p className="text-[#d4a843] font-black text-[20px] sm:text-[24px] tracking-[-0.02em]">{fmtN(calc.totalDist)}</p>
              <p className="text-white/25 text-[11px] mt-0.5">projected distributions</p>
            </div>
            <div
              className="rounded-[14px] px-5 py-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-1">Total ROI</p>
              <p className="text-white font-black text-[20px] sm:text-[24px] tracking-[-0.02em]">
                {calc.roi >= 0 ? "+" : ""}{calc.roi.toFixed(0)}%
              </p>
              <p className="text-white/25 text-[11px] mt-0.5">on invested capital</p>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <Link
            href="/apply"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-[12px] font-bold text-[15px] transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg,#d4a843,#c49a38)",
              color: "#0f2a1e",
              boxShadow: "0 6px 20px rgba(212,168,67,0.25)",
            }}
          >
            Apply for {fmtNaira(amount)} Stake →
          </Link>
          <p className="text-white/25 text-[12px] text-center sm:text-left">
            No commitment until you sign. Free to apply.
          </p>
        </div>

        {/* Disclaimer */}
        <div
          className="flex items-start gap-3 rounded-[12px] px-4 py-3"
          style={{ background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.12)" }}
        >
          <svg className="w-4 h-4 text-[#d4a843]/60 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-[#d4a843]/50 text-[11px] leading-relaxed">
            <strong className="text-[#d4a843]/70">Illustrative only.</strong> Figures are derived from forward-looking growth projections and are not guaranteed. Actual distributions depend on business performance. Profit distributions are only paid from verified net profit. Past projections do not guarantee future results. Capital is at risk.
          </p>
        </div>
      </div>
    </div>
  );
}
