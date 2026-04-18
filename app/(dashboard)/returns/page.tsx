import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fmt } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createAdminClient();

  let { data: partner } = await db
    .from("partners")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!partner) {
    const { data: byEmail } = await db
      .from("partners")
      .select("*")
      .eq("email", user.email!)
      .eq("status", "active")
      .maybeSingle();
    if (byEmail) partner = byEmail;
  }

  if (!partner) redirect("/pending");

  const { data: distributions } = await db
    .from("distributions")
    .select("*")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false });

  const paid = (distributions ?? []).filter((d: any) => d.status === "paid");
  const totalDistributed = paid.reduce((sum: number, d: any) => sum + d.amount, 0);
  const overallReturnPct = partner.investment_amount > 0
    ? (totalDistributed / partner.investment_amount) * 100
    : 0;

  // Simple annualized return
  const monthsSinceStart = partner.activated_at
    ? (Date.now() - new Date(partner.activated_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
    : 1;
  const annualizedReturn = monthsSinceStart > 0
    ? (overallReturnPct / monthsSinceStart) * 12
    : 0;

  // Projected next distribution
  const lastQuarterDist = paid.at(0);
  const projectedNext = lastQuarterDist ? lastQuarterDist.amount : null;

  const statusColor = (s: string) => {
    switch (s) {
      case "paid": return "bg-green-100 text-green-700 border border-green-200";
      case "processing": return "bg-blue-100 text-blue-700 border border-blue-200";
      case "pending": return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      default: return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] mb-1">Returns & Distributions</h1>
        <p className="text-gray-500 text-sm">All quarterly profit distributions for your partnership.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Total Invested</div>
          <div className="text-xl font-bold text-[#d4a843]">{fmt.naira(partner.investment_amount)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Total Distributed</div>
          <div className="text-xl font-bold text-[#40916c]">{fmt.naira(totalDistributed)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Overall Return</div>
          <div className="text-xl font-bold text-[#111827]">{overallReturnPct.toFixed(2)}%</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Annualized Return</div>
          <div className="text-xl font-bold text-[#111827]">{annualizedReturn.toFixed(2)}%</div>
        </div>
      </div>

      {/* Projected Next */}
      {projectedNext && (
        <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[#40916c] text-sm font-semibold">Projected Next Distribution</div>
            <div className="text-gray-500 text-xs mt-0.5">Based on last quarter — subject to actual profits</div>
          </div>
          <div className="text-2xl font-bold text-[#d4a843]">~{fmt.naira(projectedNext)}</div>
        </div>
      )}

      {/* Distributions Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-[#111827] font-semibold">Distribution History</h3>
        </div>
        {distributions && distributions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Period", "Net Profit", "Your Share", "Distribution", "Status", "Paid Date"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {distributions.map((d: any) => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-[#111827] font-medium">{fmt.quarter(d.period)}</td>
                    <td className="px-4 py-3 text-gray-500">{fmt.naira(d.net_profit)}</td>
                    <td className="px-4 py-3 text-gray-500">{fmt.percent(Number(d.partner_share))}</td>
                    <td className="px-4 py-3 text-[#d4a843] font-semibold">{fmt.naira(d.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${statusColor(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {d.paid_at ? fmt.shortDate(d.paid_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400 text-sm">
            No distributions yet. Your first distribution will be calculated at the end of the first quarter.
          </div>
        )}
      </div>
    </div>
  );
}
