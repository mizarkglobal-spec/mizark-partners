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

  // Parse quarter to date range
  const [year, qStr] = quarter.split("-Q");
  const qNum = parseInt(qStr);
  const startMonth = (qNum - 1) * 3 + 1;
  const periodStart = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const endMonth = startMonth + 2;
  const endDate = new Date(Number(year), endMonth, 0); // last day of end month
  const periodEnd = endDate.toISOString().slice(0, 10);

  // Also compute YYYY-MM strings for fallback
  const monthPeriods = [
    `${year}-${String(startMonth).padStart(2, "0")}`,
    `${year}-${String(startMonth + 1).padStart(2, "0")}`,
    `${year}-${String(startMonth + 2).padStart(2, "0")}`,
  ];

  // Primary: sum from financial_transactions
  const { data: txRows, error: txErr } = await db
    .from("financial_transactions")
    .select("type, category, amount")
    .gte("date", periodStart)
    .lte("date", periodEnd);

  let quarterNetProfit: number;

  if (!txErr && txRows && txRows.length > 0) {
    // Compute net profit: revenue - cogs - opex - tax (excl. vat which is pass-through)
    quarterNetProfit = txRows.reduce((acc: number, tx: any) => {
      if (tx.type === "revenue") return acc + tx.amount;
      if (tx.type === "cogs" || tx.type === "opex") return acc - tx.amount;
      if (tx.type === "tax" && tx.category !== "tax.vat_output" && tx.category !== "tax.vat_input") {
        return acc - tx.amount;
      }
      return acc;
    }, 0);
  } else {
    // Fallback: monthly_financials table
    const { data: financials } = await db
      .from("monthly_financials")
      .select("net_profit")
      .in("period", monthPeriods);
    quarterNetProfit = (financials ?? []).reduce((sum: number, f: any) => sum + (f.net_profit ?? 0), 0);
  }

  if (quarterNetProfit <= 0) {
    return NextResponse.json({
      calculations: [],
      quarter_net_profit: quarterNetProfit,
      message: "No positive net profit for this quarter. No distributions to calculate.",
    });
  }

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
    gross_amount: Math.floor(quarterNetProfit * (Number(p.equity_pct) / 100)),
    wht_deducted: Math.floor(quarterNetProfit * (Number(p.equity_pct) / 100) * 0.10),
    net_amount: Math.floor(quarterNetProfit * (Number(p.equity_pct) / 100) * 0.90),
    // Keep `amount` for backward compatibility with process route
    amount: Math.floor(quarterNetProfit * (Number(p.equity_pct) / 100) * 0.90),
  }));

  return NextResponse.json({ calculations, quarter_net_profit: quarterNetProfit });
}
