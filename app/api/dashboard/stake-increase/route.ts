import { NextRequest, NextResponse } from "next/server";
import { requirePartner } from "@/lib/auth";
import { sendStakeIncreaseConfirmation, sendStakeIncreaseAlert } from "@/lib/email";

export async function POST(req: NextRequest) {
  const auth = await requirePartner(req);
  if (!auth.ok) return auth.res;
  const { partner, db } = auth;

  const { additional_amount, message } = await req.json();

  if (!additional_amount || Number(additional_amount) < 100_000) {
    return NextResponse.json({ error: "Minimum additional investment is ₦100,000" }, { status: 400 });
  }

  // Admin in-app notification
  await db.from("partner_notifications").insert({
    partner_id: partner.id,
    type: "general",
    title: "Stake Increase Request",
    body: `Partner ${partner.name} has requested to increase their stake by ₦${Number(additional_amount).toLocaleString("en-NG")}. ${message ? `Message: ${message}` : ""}`,
    read: false,
  });

  // Partner confirmation (in-app)
  await db.from("partner_notifications").insert({
    partner_id: partner.id,
    type: "general",
    title: "Stake Increase Request Received",
    body: `Your request to increase your stake by ₦${Number(additional_amount).toLocaleString("en-NG")} has been received. Our team will be in touch shortly.`,
    read: false,
  }).catch(console.error);

  // Emails
  await sendStakeIncreaseConfirmation({
    name: partner.name,
    email: partner.email,
    amount: Number(additional_amount),
  }).catch(console.error);

  await sendStakeIncreaseAlert({
    name: partner.name,
    email: partner.email,
    amount: Number(additional_amount),
    message: message || undefined,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
