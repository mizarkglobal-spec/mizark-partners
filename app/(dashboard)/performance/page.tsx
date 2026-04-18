import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fmt } from "@/lib/format";
import PerformanceCharts from "./Charts";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createAdminClient();

  let { data: partner } = await db
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!partner) {
    const { data: byEmail } = await db
      .from("partners")
      .select("id")
      .eq("email", user.email!)
      .eq("status", "active")
      .maybeSingle();
    if (byEmail) partner = byEmail;
  }

  if (!partner) redirect("/pending");

  const { data: financials } = await db
    .from("monthly_financials")
    .select("*")
    .order("period", { ascending: false })
    .limit(24);

  const sorted = [...(financials ?? [])].reverse();

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] mb-1">Business Performance</h1>
        <p className="text-gray-500 text-sm">Monthly financial data across all Mizark Global products.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-amber-700 text-xs">
          Data sourced from Zoho Books accounting system. Updated monthly after books close.
        </p>
      </div>

      {sorted.length > 0 ? (
        <>
          <PerformanceCharts data={sorted} />

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-[#111827] font-semibold">Monthly Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Month", "Leadash Rev", "Academy Rev", "Total Rev", "Expenses", "Net Profit"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...sorted].reverse().map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-[#111827] font-medium">{fmt.month(row.period)}</td>
                      <td className="px-4 py-3 text-gray-500">{fmt.naira(row.leadash_rev)}</td>
                      <td className="px-4 py-3 text-gray-500">{fmt.naira(row.academy_rev)}</td>
                      <td className="px-4 py-3 text-gray-500">{fmt.naira(row.total_rev)}</td>
                      <td className="px-4 py-3 text-gray-500">{fmt.naira(row.expenses)}</td>
                      <td className={`px-4 py-3 font-semibold ${row.net_profit >= 0 ? "text-[#40916c]" : "text-red-500"}`}>
                        {fmt.naira(row.net_profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
          <div className="text-gray-400 text-sm">No financial data has been entered yet. Check back after the first month closes.</div>
        </div>
      )}
    </div>
  );
}
