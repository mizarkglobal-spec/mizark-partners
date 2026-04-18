import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { data: financials } = await db
    .from("monthly_financials")
    .select("*")
    .order("period", { ascending: false });

  return NextResponse.json({ financials: financials ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const body = await req.json();
  const { period, leadash_rev, academy_rev, expenses, notes, id } = body;

  if (!period?.match(/^\d{4}-\d{2}$/)) {
    return NextResponse.json({ error: "Period must be in YYYY-MM format" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const upsertData = {
    period,
    leadash_rev: parseInt(leadash_rev) || 0,
    academy_rev: parseInt(academy_rev) || 0,
    expenses: parseInt(expenses) || 0,
    notes: notes || null,
    updated_at: now,
  };

  if (id) {
    const { error } = await db
      .from("monthly_financials")
      .update(upsertData)
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await db
      .from("monthly_financials")
      .upsert({ ...upsertData, created_at: now }, { onConflict: "period" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await db.from("monthly_financials").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
