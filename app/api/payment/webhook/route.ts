import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { recordInstallment } from "@/lib/installments";

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

    if (!partner) {
      return NextResponse.json({ ok: true });
    }

    const amount = txData.amount / 100; // Paystack sends kobo
    const paymentDate = new Date().toISOString().slice(0, 10);

    try {
      await recordInstallment(db, partner.id, amount, paymentDate, reference ?? null, "paystack", null);
    } catch (e: any) {
      if (e.message === "DUPLICATE_REF") {
        return NextResponse.json({ ok: true });
      }
      throw e;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
