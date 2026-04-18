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
  ]);

  const totalEarned = (distributions || [])
    .filter((d: any) => d.status === "paid")
    .reduce((sum: number, d: any) => sum + d.amount, 0);

  const lastQuarter = (distributions || [])
    .filter((d: any) => d.status !== "failed")
    .at(-1);

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

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111827] mb-1">
          Assalamu Alaikum, {partner.name.split(" ")[0]}
        </h1>
        <p className="text-gray-500 text-sm">Welcome to your Mizark Global partner dashboard.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Investment</div>
          <div className="text-lg sm:text-2xl font-bold text-[#d4a843] truncate">{fmt.naira(partner.investment_amount)}</div>
          <div className="text-gray-300 text-xs mt-1">Original capital</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Total Earned</div>
          <div className="text-lg sm:text-2xl font-bold text-[#40916c] truncate">{fmt.naira(totalEarned)}</div>
          <div className="text-gray-300 text-xs mt-1">All distributions</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Equity Stake</div>
          <div className="text-lg sm:text-2xl font-bold text-[#111827]">{fmt.percent(Number(partner.equity_pct))}</div>
          <div className="text-gray-300 text-xs mt-1">Of Mizark Global</div>
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

        {/* Latest Quarter Summary */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-[#111827] font-semibold mb-4">Latest Quarter</h3>
          {lastQuarter ? (
            <div className="space-y-3">
              <div>
                <div className="text-gray-400 text-xs mb-1">Period</div>
                <div className="text-[#111827] font-medium">{fmt.quarter(lastQuarter.period)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Net Profit (Business)</div>
                <div className="text-[#111827] font-medium">{fmt.naira(lastQuarter.net_profit)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Your Share</div>
                <div className="text-[#40916c] font-medium">{fmt.percent(Number(lastQuarter.partner_share))}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Distribution Amount</div>
                <div className="text-[#d4a843] font-bold text-xl">{fmt.naira(lastQuarter.amount)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Status</div>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                  lastQuarter.status === "paid"
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                }`}>
                  {lastQuarter.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No quarterly data yet.</div>
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
