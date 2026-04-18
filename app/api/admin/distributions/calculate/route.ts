import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { quarter } = await req.json();
  if (!quarter?.match(/^\d{4}-Q[1-4]$/)) {
    return NextResponse.json({ error: "Quarter must be in YYYY-Q# format (e.g. 2024-Q1)" }, { status: 400 });
  }

  // Parse quarter to get monthly periods
  const [year, qStr] = quarter.split("-Q");
  const qNum = parseInt(qStr);
  const startMonth = (qNum - 1) * 3 + 1;
  const months = [
    `${year}-${String(startMonth).padStart(2, "0")}`,
    `${year}-${String(startMonth + 1).padStart(2, "0")}`,
    `${year}-${String(startMonth + 2).padStart(2, "0")}`,
  ];

  // Get financials for the quarter
  const { data: financials } = await db
    .from("monthly_financials")
    .select("net_profit")
    .in("period", months);

  const quarterNetProfit = (financials ?? []).reduce((sum: number, f: any) => sum + f.net_profit, 0);

  if (quarterNetProfit <= 0) {
    return NextResponse.json({
      calculations: [],
      quarter_net_profit: quarterNetProfit,
      message: "No positive net profit for this quarter. No distributions to calculate.",
    });
  }

  // Get active partners
  const { data: partners } = await db
    .from("partners")
    .select("id, name, equity_pct")
    .eq("status", "active");

  if (!partners || partners.length === 0) {
    return NextResponse.json({ calculations: [], quarter_net_profit: quarterNetProfit });
  }

  const calculations = partners.map((p: any) => ({
    partner_id: p.id,
    partner_name: p.name,
    equity_pct: Number(p.equity_pct),
    amount: Math.floor(quarterNetProfit * (Number(p.equity_pct) / 100)),
  }));

  return NextResponse.json({ calculations, quarter_net_profit: quarterNetProfit });
}
