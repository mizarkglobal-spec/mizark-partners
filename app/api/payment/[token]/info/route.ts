import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const db = createAdminClient();

  const { data: partner } = await db
    .from("partners")
    .select("id, name, email, investment_amount, equity_pct, start_date, term_end_date, status")
    .eq("payment_token", token)
    .maybeSingle();

  if (!partner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ partner });
}
