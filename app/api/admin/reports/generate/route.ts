import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { data: reports } = await db
    .from("reports")
    .select("*")
    .order("generated_at", { ascending: false });

  return NextResponse.json({ reports: reports ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { type, period } = await req.json();

  if (!["monthly", "quarterly", "annual"].includes(type)) {
    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  }
  if (!period?.trim()) {
    return NextResponse.json({ error: "Period is required" }, { status: 400 });
  }

  // Build data snapshot
  let data: Record<string, any> = {};

  if (type === "monthly") {
    const { data: fin } = await db
      .from("monthly_financials")
      .select("*")
      .eq("period", period)
      .maybeSingle();
    data = { financials: fin };
  } else if (type === "quarterly") {
    const [year, qStr] = period.split("-Q");
    const qNum = parseInt(qStr);
    const startMonth = (qNum - 1) * 3 + 1;
    const months = [
      `${year}-${String(startMonth).padStart(2, "0")}`,
      `${year}-${String(startMonth + 1).padStart(2, "0")}`,
      `${year}-${String(startMonth + 2).padStart(2, "0")}`,
    ];
    const { data: fins } = await db.from("monthly_financials").select("*").in("period", months);
    const { data: dists } = await db.from("distributions").select("*").eq("period", period);
    data = { financials: fins ?? [], distributions: dists ?? [] };
  } else {
    const { data: fins } = await db
      .from("monthly_financials")
      .select("*")
      .like("period", `${period}-%`);
    data = { financials: fins ?? [], year: period };
  }

  const { error } = await db.from("reports").insert({
    type,
    period,
    data,
    generated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
