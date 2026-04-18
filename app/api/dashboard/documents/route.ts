import { NextRequest, NextResponse } from "next/server";
import { requirePartner } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requirePartner(req);
  if (!auth.ok) return auth.res;
  const { partner, db } = auth;

  const { data: agreements } = await db
    .from("partner_agreements")
    .select("*")
    .eq("partner_id", partner.id);

  return NextResponse.json({
    partner: {
      id: partner.id,
      investment_amount: partner.investment_amount,
      equity_pct: partner.equity_pct,
      start_date: partner.start_date,
      term_end_date: partner.term_end_date,
      activated_at: partner.activated_at,
    },
    agreements: agreements ?? [],
  });
}
