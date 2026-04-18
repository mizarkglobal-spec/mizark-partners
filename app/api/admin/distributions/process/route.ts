import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { quarter } = await req.json();
  if (!quarter?.match(/^\d{4}-Q[1-4]$/)) {
    return NextResponse.json({ error: "Quarter must be in YYYY-Q# format" }, { status: 400 });
  }

  // Check for duplicate
  const { data: existing } = await db
    .from("distributions")
    .select("id")
    .eq("period", quarter)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: `Distributions for ${quarter} already exist` }, { status: 409 });
  }

  // Calculate
  const [year, qStr] = quarter.split("-Q");
  const qNum = parseInt(qStr);
  const startMonth = (qNum - 1) * 3 + 1;
  const months = [
    `${year}-${String(startMonth).padStart(2, "0")}`,
    `${year}-${String(startMonth + 1).padStart(2, "0")}`,
    `${year}-${String(startMonth + 2).padStart(2, "0")}`,
  ];

  const { data: financials } = await db
    .from("monthly_financials")
    .select("net_profit")
    .in("period", months);

  const quarterNetProfit = (financials ?? []).reduce((sum: number, f: any) => sum + f.net_profit, 0);

  if (quarterNetProfit <= 0) {
    return NextResponse.json({ error: "No positive net profit for this quarter" }, { status: 400 });
  }

  const { data: partners } = await db
    .from("partners")
    .select("id, name, equity_pct")
    .eq("status", "active");

  if (!partners || partners.length === 0) {
    return NextResponse.json({ error: "No active partners found" }, { status: 400 });
  }

  const records = partners.map((p: any) => ({
    partner_id: p.id,
    period: quarter,
    net_profit: quarterNetProfit,
    partner_share: Number(p.equity_pct),
    amount: Math.floor(quarterNetProfit * (Number(p.equity_pct) / 100)),
    status: "pending",
  }));

  const { error } = await db.from("distributions").insert(records);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create notifications for each partner
  const notifications = partners.map((p: any) => ({
    partner_id: p.id,
    type: "distribution",
    title: `${quarter} Distribution Created`,
    body: `Your distribution of ₦${Math.floor(quarterNetProfit * (Number(p.equity_pct) / 100)).toLocaleString("en-NG")} for ${quarter} has been calculated and is pending payment.`,
    read: false,
  }));

  await db.from("partner_notifications").insert(notifications).catch(console.error);

  return NextResponse.json({ ok: true, count: records.length, quarter_net_profit: quarterNetProfit });
}
