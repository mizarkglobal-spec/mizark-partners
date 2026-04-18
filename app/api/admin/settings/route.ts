import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const DEFAULTS = {
  total_pool_amount: 20_000_000,
  total_equity_pct: 20,
  profit_dist_pct: 30,
  max_partners: 40,
  min_investment: 500_000,
  term_years: 3,
  company_valuation: null as number | null,
  founder_name: "Malik Adelaja",
  company_name: "Mizark Global Limited",
  programme_name: "Musharakah Partnership Programme",
};

export type ProgramSettings = typeof DEFAULTS;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  try {
    const { data } = await (db as any)
      .from("program_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    const settings = data ? { ...DEFAULTS, ...data.settings } : DEFAULTS;
    return NextResponse.json({ settings, tableExists: !!data || data === null });
  } catch {
    return NextResponse.json({ settings: DEFAULTS, tableExists: false });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const body = await req.json();

  try {
    // Upsert into program_config
    const { error } = await (db as any)
      .from("program_config")
      .upsert({ id: 1, settings: body, updated_at: new Date().toISOString() });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to save" }, { status: 500 });
  }
}
