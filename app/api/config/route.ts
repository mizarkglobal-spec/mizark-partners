import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = createAdminClient();
    const { data } = await db.from("program_config").select("settings").eq("id", 1).maybeSingle();
    const s = (data?.settings as any) ?? {};
    return NextResponse.json({
      total_pool_amount: s.total_pool_amount ?? 20_000_000,
      total_equity_pct: s.total_equity_pct ?? 20,
      min_investment: s.min_investment ?? 1_000_000,
    });
  } catch {
    return NextResponse.json({
      total_pool_amount: 20_000_000,
      total_equity_pct: 20,
      min_investment: 1_000_000,
    });
  }
}
