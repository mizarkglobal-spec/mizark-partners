import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendDistributionPaid } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { id } = await params;

  const { data: distribution } = await db
    .from("distributions")
    .select("*, partners(name, email)")
    .eq("id", id)
    .maybeSingle();

  if (!distribution) {
    return NextResponse.json({ error: "Distribution not found" }, { status: 404 });
  }

  if (distribution.status === "paid") {
    return NextResponse.json({ error: "Already marked as paid" }, { status: 400 });
  }

  const paidAt = new Date().toISOString();

  await db
    .from("distributions")
    .update({ status: "paid", paid_at: paidAt })
    .eq("id", id);

  // Notify partner
  if (distribution.partner_id) {
    await db.from("partner_notifications").insert({
      partner_id: distribution.partner_id,
      type: "distribution",
      title: `${distribution.period} Distribution Paid`,
      body: `Your distribution of ₦${distribution.amount.toLocaleString("en-NG")} for ${distribution.period} has been paid.`,
      read: false,
    }).catch(console.error);
  }

  // Send email
  const partner = (distribution as any).partners;
  if (partner) {
    await sendDistributionPaid({
      name: partner.name,
      email: partner.email,
      amount: distribution.amount,
      period: distribution.period,
    }).catch(console.error);
  }

  return NextResponse.json({ ok: true });
}
