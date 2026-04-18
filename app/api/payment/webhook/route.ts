import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { sendWelcomePartner } from "@/lib/email";
import { equityForAmount } from "@/lib/format";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event: string; data: Record<string, any> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event !== "charge.success") {
    return NextResponse.json({ ok: true });
  }

  const txData = event.data;
  const reference = txData?.reference;
  const partnerId = txData?.metadata?.partner_id;

  try {
    const db = createAdminClient();
    let partner;

    if (partnerId) {
      const { data } = await db.from("partners").select("*").eq("id", partnerId).maybeSingle();
      partner = data;
    } else if (reference) {
      const { data } = await db.from("partners").select("*").eq("paystack_ref", reference).maybeSingle();
      partner = data;
    }

    if (!partner || partner.status === "active") {
      return NextResponse.json({ ok: true });
    }

    const now = new Date().toISOString();
    await db
      .from("partners")
      .update({ status: "active", activated_at: now } as any)
      .eq("id", partner.id);

    // Create welcome notification
    await db.from("partner_notifications").insert({
      partner_id: partner.id,
      type: "general",
      title: "Welcome to Mizark Global Partnership",
      body: `Alhamdulillah! Your investment has been confirmed. Welcome aboard, ${partner.name}.`,
      read: false,
    }).catch(console.error);

    const equityPct = equityForAmount(partner.investment_amount);
    await sendWelcomePartner({
      name: partner.name,
      email: partner.email,
      equityPct,
      amount: partner.investment_amount,
    }).catch(console.error);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
