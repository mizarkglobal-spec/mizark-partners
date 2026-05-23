import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fmt } from "@/lib/format";
import DashboardChart from "./Chart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

  const [
    { data: distributions },
    { data: announcements },
    { data: notifications },
    { data: installments },
  ] = await Promise.all([
    db
      .from("distributions")
      .select("*")
      .eq("partner_id", partner.id)
      .order("created_at", { ascending: true }),
    db
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3),
    db
      .from("partner_notifications")
      .select("*")
      .eq("partner_id", partner.id)
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("partner_installments")
      .select("amount, payment_date, method")
      .eq("partner_id", partner.id)
      .order("payment_date", { ascending: false })
      .limit(5),
  ]);

  const totalEarned = (distributions || [])
    .filter((d: any) => d.status === "paid")
    .reduce((sum: number, d: any) => sum + d.amount, 0);

  const lastQuarter = (distributions || [])
    .filter((d: any) => d.status !== "failed")
    .at(-1);

  // Installment / payment tracking
  const committedAmount  = Number(partner.committed_amount ?? partner.investment_amount ?? 0);
  const paidAmount       = Number(partner.paid_amount ?? partner.investment_amount ?? 0);
  const activeEquityPct  = Number(partner.equity_pct ?? 0);
  const committedEquityPct = Number(partner.equity_committed_pct ?? partner.equity_pct ?? 0);
  const outstandingAmount = Math.max(0, committedAmount - paidAmount);
  const paymentPct        = committedAmount > 0 ? Math.min(100, (paidAmount / committedAmount) * 100) : 100;
  const isPartial         = outstandingAmount > 0;

  // Build sparkline data
  type SparkPoint = { period: string; cumulative: number };
  const sparklineData: SparkPoint[] = [];
  for (const d of (distributions || []).filter((d: any) => d.status === "paid") as any[]) {
    const prev = sparklineData.at(-1)?.cumulative ?? 0;
    sparklineData.push({ period: d.period, cumulative: prev + d.amount });
  }

  const nextDistributionPeriod = () => {
    const now = new Date();
    const q = Math.ceil((now.getMonth() + 1) / 3);
    return `Q${q} ${now.getFullYear()}`;
  };

  const METHOD_LABEL: Record<string, string> = {
    paystack: "Paystack", bank_transfer: "Bank Transfer", manual: "Manual", other: "Other",
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111827] mb-1">
          Assalamu Alaikum, {partner.name.split(" ")[0]}
        </h1>
        <p className="text-gray-500 text-sm">Welcome to your Mizark Global partner dashboard.</p>
      </div>

      {/* Investment progress banner — only for partial payers */}
      {isPartial && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-amber-800 font-semibold text-sm">Investment In Progress</div>
              <div className="text-amber-600 text-xs mt-0.5">
                Your active equity increases with each payment.
              </div>
            </div>
            <span className="bg-amber-100 text-amber-700 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full">
              {paymentPct.toFixed(0)}% paid
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
            <div>
              <div className="text-amber-500 text-xs mb-0.5">Paid-up</div>
              <div className="font-bold text-[#111827]">{fmt.naira(paidAmount)}</div>
            </div>
            <div>
              <div className="text-amber-500 text-xs mb-0.5">Committed</div>
              <div className="font-bold text-[#111827]">{fmt.naira(committedAmount)}</div>
            </div>
            <div>
              <div className="text-amber-500 text-xs mb-0.5">Outstanding</div>
              <div className="font-bold text-amber-700">{fmt.naira(outstandingAmount)}</div>
            </div>
          </div>
          <div className="h-2 bg-amber-200 rounded-full">
            <div
              className="h-2 bg-amber-500 rounded-full transition-all"
              style={{ width: `${paymentPct.toFixed(1)}%` }}
            />
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Capital card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">
            {isPartial ? "Paid-up Capital" : "Investment"}
          </div>
          <div className="text-lg sm:text-2xl font-bold text-[#d4a843] truncate">
            {fmt.naira(paidAmount)}
          </div>
          {isPartial ? (
            <div className="text-gray-300 text-xs mt-1">of {fmt.naira(committedAmount)} committed</div>
          ) : (
            <div className="text-gray-300 text-xs mt-1">Fully invested</div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Total Earned</div>
          <div className="text-lg sm:text-2xl font-bold text-[#40916c] truncate">{fmt.naira(totalEarned)}</div>
          <div className="text-gray-300 text-xs mt-1">All distributions</div>
        </div>

        {/* Equity card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Active Equity</div>
          <div className="text-lg sm:text-2xl font-bold text-[#111827]">{fmt.percent(activeEquityPct)}</div>
          {isPartial ? (
            <div className="text-amber-500 text-xs mt-1">{fmt.percent(committedEquityPct)} at full payment</div>
          ) : (
            <div className="text-gray-300 text-xs mt-1">Of Mizark Global</div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Next Distribution</div>
          <div className="text-lg sm:text-2xl font-bold text-[#111827]">{nextDistributionPeriod()}</div>
          <div className="text-gray-300 text-xs mt-1">Estimated period</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-[#111827] font-semibold mb-1">Investment Growth</h3>
          <p className="text-gray-400 text-xs mb-5">Cumulative distributions over time</p>
          {sparklineData.length > 0 ? (
            <DashboardChart data={sparklineData} />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">
              No distributions yet — first distribution will appear after your first quarter.
            </div>
          )}
        </div>

        {/* Equity + Payment summary */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
          {/* Equity breakdown */}
          <div>
            <h3 className="text-[#111827] font-semibold mb-3">Your Stake</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Active equity</span>
                <span className="font-bold text-[#40916c]">{fmt.percent(activeEquityPct)}</span>
              </div>
              {isPartial && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Committed equity</span>
                  <span className="font-semibold text-amber-600">{fmt.percent(committedEquityPct)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Paid-up capital</span>
                <span className="font-semibold text-[#111827]">{fmt.naira(paidAmount)}</span>
              </div>
              {isPartial && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Committed</span>
                    <span className="font-semibold text-[#111827]">{fmt.naira(committedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-500">Outstanding</span>
                    <span className="font-semibold text-amber-600">{fmt.naira(outstandingAmount)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full mt-2">
                    <div className="h-1.5 bg-[#40916c] rounded-full" style={{ width: `${paymentPct.toFixed(1)}%` }} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Recent payments */}
          {installments && installments.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <div className="text-[#111827] font-semibold text-sm mb-3">Recent Payments</div>
              <div className="space-y-2">
                {installments.map((inst: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs">
                    <div>
                      <span className="text-gray-500">{fmt.shortDate(inst.payment_date)}</span>
                      <span className="text-gray-300 ml-2">{METHOD_LABEL[inst.method] ?? inst.method}</span>
                    </div>
                    <span className="font-semibold text-[#d4a843]">{fmt.naira(inst.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Latest distribution */}
          {lastQuarter && (
            <div className="border-t border-gray-100 pt-4">
              <div className="text-[#111827] font-semibold text-sm mb-3">Latest Distribution</div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Period</span>
                  <span className="font-medium text-[#111827]">{fmt.quarter(lastQuarter.period)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Amount</span>
                  <span className="font-bold text-[#d4a843]">{fmt.naira(lastQuarter.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    lastQuarter.status === "paid"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                  }`}>{lastQuarter.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Announcements */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-[#111827] font-semibold mb-4">Recent Announcements</h3>
          {announcements && announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((ann: any) => (
                <div key={ann.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  {ann.is_pinned && (
                    <span className="inline-block bg-[#d4a843]/10 text-[#d4a843] text-[10px] px-2 py-0.5 rounded-full border border-[#d4a843]/20 mb-1">
                      Pinned
                    </span>
                  )}
                  <div className="text-[#111827] text-sm font-medium">{ann.title}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{fmt.date(ann.created_at)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No announcements yet.</div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-[#111827] font-semibold mb-4">Recent Notifications</h3>
          {notifications && notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0 ${!n.read ? "opacity-100" : "opacity-60"}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.read ? "bg-[#40916c]" : "bg-gray-200"}`} />
                  <div>
                    <div className="text-[#111827] text-sm font-medium">{n.title}</div>
                    {n.body && <div className="text-gray-400 text-xs mt-0.5">{n.body}</div>}
                    <div className="text-gray-300 text-xs mt-0.5">{fmt.date(n.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No notifications yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
