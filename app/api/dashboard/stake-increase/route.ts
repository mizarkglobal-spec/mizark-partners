import { NextRequest, NextResponse } from "next/server";
import { requirePartner } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await requirePartner(req);
  if (!auth.ok) return auth.res;
  const { partner, db } = auth;

  const { additional_amount, message } = await req.json();

  if (!additional_amount || Number(additional_amount) < 100_000) {
    return NextResponse.json({ error: "Minimum additional investment is ₦100,000" }, { status: 400 });
  }

  // Store as a notification to admin (simple approach without new table)
  // The admin will see it and can manually adjust the partner's equity
  await db.from("partner_notifications").insert({
    partner_id: partner.id,
    type: "general",
    title: "Stake Increase Request",
    body: `Partner ${partner.name} has requested to increase their stake by ₦${Number(additional_amount).toLocaleString("en-NG")}. ${message ? `Message: ${message}` : ""}`,
    read: false,
  });

  // Also send a notification to admin via their own record if any
  // For now, we just log it — admin sees it in notifications

  return NextResponse.json({ ok: true });
}
