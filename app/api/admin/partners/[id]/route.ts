import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { generateToken, equityForAmount } from "@/lib/format";

// PATCH — edit partner fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;
  const { id } = await params;

  const body = await req.json();

  // Whitelist editable fields
  const allowed = [
    "name", "email", "phone", "investment_amount", "equity_pct",
    "start_date", "term_end_date", "status", "notes", "activated_at",
  ] as const;

  const update: Record<string, any> = {};
  for (const field of allowed) {
    if (field in body) update[field] = body[field];
  }

  // Recalculate equity if investment_amount changed and equity_pct not explicitly set
  if ("investment_amount" in update && !("equity_pct" in body)) {
    update.equity_pct = equityForAmount(Number(update.investment_amount));
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { error } = await db.from("partners").update(update as any).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE — remove partner
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;
  const { id } = await params;

  // Delete related records first
  await db.from("partner_notifications").delete().eq("partner_id", id);
  await db.from("distributions").delete().eq("partner_id", id);
  await db.from("partner_agreements").delete().eq("partner_id", id);
  await db.from("partners").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}
