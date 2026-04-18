"use client";
import { useState } from "react";
import { fmtN, type YearSummary, type MonthProjection } from "@/lib/projections";

const MONTHS_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const YEAR_CONFIGS = [
  { accent: "#74c69d", bg: "#0f2a1e", border: "rgba(116,198,157,0.2)", activeBorder: "rgba(116,198,157,0.6)" },
  { accent: "#d4a843", bg: "#1a1400", border: "rgba(212,168,67,0.2)", activeBorder: "rgba(212,168,67,0.6)" },
  { accent: "#a78bfa", bg: "#0f0a1e", border: "rgba(167,139,250,0.2)", activeBorder: "rgba(167,139,250,0.6)" },
];

function scaleMonths(y1: MonthProjection[], y1Summary: YearSummary, yN: YearSummary): MonthProjection[] {
  const revRatio = y1Summary.total_revenue > 0 ? yN.total_revenue / y1Summary.total_revenue : 1;
  const profitRatio = y1Summary.net_profit !== 0 ? yN.net_profit / y1Summary.net_profit : 1;
  const expRatio = y1Summary.total_expenses > 0 ? yN.total_expenses / y1Summary.total_expenses : 1;
  return y1.map((m) => ({
    ...m,
    ad_spend: Math.round(m.ad_spend * expRatio),
    leads: Math.round(m.leads * revRatio),
    challenge_buyers: Math.round(m.challenge_buyers * revRatio),
    academy_buyers: Math.round(m.academy_buyers * revRatio),
    challenge_revenue: Math.round(m.challenge_revenue * revRatio),
    academy_revenue: Math.round(m.academy_revenue * revRatio),
    leadash_mrr: Math.round(m.leadash_mrr * revRatio),
    total_revenue: Math.round(m.total_revenue * revRatio),
    total_expenses: Math.round(m.total_expenses * expRatio),
    net_profit: Math.round(m.net_profit * profitRatio),
  }));
}

interface Props {
  years: YearSummary[];
  y1Months: MonthProjection[];
  equity: number;
  profitDistPct: number;
}

export default function PitchProjectionsTabs({ years, y1Months, equity, profitDistPct }: Props) {
  const [selected, setSelected] = useState(0);

  const activeMonths =
    selected === 0
      ? y1Months
      : scaleMonths(y1Months, years[0], years[selected]);

  const totals = activeMonths.reduce(
    (acc, m) => ({
      leads: acc.leads + m.leads,
      challenge_buyers: acc.challenge_buyers + m.challenge_buyers,
      academy_buyers: acc.academy_buyers + m.academy_buyers,
      total_revenue: acc.total_revenue + m.total_revenue,
      total_expenses: acc.total_expenses + m.total_expenses,
      net_profit: acc.net_profit + m.net_profit,
      partner_share: acc.partner_share + Math.floor(Math.max(0, m.net_profit) * profitDistPct / 100 * equity / 100),
    }),
    { leads: 0, challenge_buyers: 0, academy_buyers: 0, total_revenue: 0, total_expenses: 0, net_profit: 0, partner_share: 0 }
  );

  return (
    <div className="space-y-5">
      {/* Year cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        {years.map((yr, i) => {
          const cfg = YEAR_CONFIGS[i];
          const isActive = selected === i;
          const partnerDistY = Math.floor(Math.max(0, yr.net_profit) * profitDistPct / 100 * equity / 100);
          return (
            <button
              key={yr.year}
              onClick={() => setSelected(i)}
              className="rounded-2xl p-5 border text-left transition-all cursor-pointer"
              style={{
                background: cfg.bg,
                borderColor: isActive ? cfg.activeBorder : cfg.border,
                boxShadow: isActive ? `0 0 0 2px ${cfg.activeBorder}` : "none",
                outline: "none",
              }}
            >
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Year {yr.year}</span>
                {isActive && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold text-white"
                    style={{ background: cfg.activeBorder }}>
                    Viewing
                  </span>
                )}
              </p>
              <p className="text-white font-bold text-xl mb-1">{fmtN(yr.total_revenue)}</p>
              <p className="text-xs mb-3" style={{ color: cfg.accent }}>Net profit: {fmtN(yr.net_profit)}</p>
              <div className="pt-3 border-t space-y-1.5" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Your dist. ({equity.toFixed(2)}%)</span>
                  <span className="font-bold" style={{ color: cfg.accent }}>{fmtN(partnerDistY)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Academy buyers</span>
                  <span className="text-white/60">{yr.total_academy_buyers.toLocaleString()}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Monthly table */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Year {years[selected].year} — Monthly Breakdown
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Month","Ad Spend","Leads","Challenge","Academy","Revenue","Expenses","Net Profit","Your Share"].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeMonths.map((m) => {
                const partnerShare = Math.floor(Math.max(0, m.net_profit) * profitDistPct / 100 * equity / 100);
                return (
                  <tr key={m.month} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium text-gray-700">{MONTHS_LABELS[m.month - 1]}</td>
                    <td className="py-2.5 px-3 text-gray-500">{fmtN(m.ad_spend)}</td>
                    <td className="py-2.5 px-3 text-blue-600">{m.leads.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-[#40916c]">{m.challenge_buyers.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-amber-600">{m.academy_buyers.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-medium text-gray-900">{fmtN(m.total_revenue)}</td>
                    <td className="py-2.5 px-3 text-gray-400">{fmtN(m.total_expenses)}</td>
                    <td className={`py-2.5 px-3 font-bold ${m.net_profit >= 0 ? "text-[#40916c]" : "text-red-500"}`}>
                      {fmtN(m.net_profit)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#d4a843]">{fmtN(partnerShare)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 bg-gray-50">
              <tr>
                <td className="py-2.5 px-3 font-bold text-gray-700">Total</td>
                <td className="py-2.5 px-3" />
                <td className="py-2.5 px-3 font-semibold text-blue-600">{totals.leads.toLocaleString()}</td>
                <td className="py-2.5 px-3 font-semibold text-[#40916c]">{totals.challenge_buyers.toLocaleString()}</td>
                <td className="py-2.5 px-3 font-semibold text-amber-600">{totals.academy_buyers.toLocaleString()}</td>
                <td className="py-2.5 px-3 font-bold text-gray-900">{fmtN(totals.total_revenue)}</td>
                <td className="py-2.5 px-3 font-semibold text-gray-400">{fmtN(totals.total_expenses)}</td>
                <td className={`py-2.5 px-3 font-bold ${totals.net_profit >= 0 ? "text-[#40916c]" : "text-red-500"}`}>
                  {fmtN(totals.net_profit)}
                </td>
                <td className="py-2.5 px-3 font-bold text-[#d4a843]">{fmtN(totals.partner_share)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          "Your Share" = {equity.toFixed(3)}% equity × {profitDistPct}% profit pool per quarter (shown monthly for illustration).
          {selected > 0 && " Year 2/3 monthly figures are proportionally scaled from Year 1 actuals."}
        </p>
      </div>
    </div>
  );
}
