import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

interface Props { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Props) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { id } = await params;
  const body = await req.json();

  const allowed = ["date", "division", "type", "category", "amount", "description", "reference"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = key === "amount" ? Number(body[key]) : body[key];
  }

  if ("amount" in updates && Number(updates.amount) < 0) {
    return NextResponse.json({ error: "Amount must be non-negative" }, { status: 400 });
  }

  const { data, error } = await db
    .from("financial_transactions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transaction: data });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { id } = await params;
  const { error } = await db.from("financial_transactions").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
