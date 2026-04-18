import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendPaymentInstructions } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const { db } = auth;

    const { id } = await params;

    const { data: partner } = await db
      .from("partners")
      .select("*, partner_agreements(*)")
      .eq("id", id)
      .maybeSingle();

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const agreement = partner.partner_agreements?.[0];
    if (!agreement?.signed_at) {
      return NextResponse.json({ error: "Partner has not signed yet" }, { status: 400 });
    }
    if (agreement.countersigned_at) {
      return NextResponse.json({ error: "Already countersigned" }, { status: 409 });
    }

    const countersignedAt = new Date().toISOString();

    const { error: agreementUpdateError } = await db
      .from("partner_agreements")
      .update({ countersigned_at: countersignedAt, countersigned_by: "Malik Adelaja" } as any)
      .eq("id", agreement.id);

    if (agreementUpdateError) {
      console.error("[countersign] agreement update error:", agreementUpdateError);
      return NextResponse.json({ error: "Failed to save countersignature: " + agreementUpdateError.message }, { status: 500 });
    }

    await db
      .from("partners")
      .update({ status: "awaiting_payment" } as any)
      .eq("id", partner.id);

    // Send payment instructions (sendEmail has an 8s timeout)
    if (partner.payment_token) {
      await sendPaymentInstructions({
        name: partner.name,
        email: partner.email,
        token: partner.payment_token,
        amount: partner.investment_amount,
      }).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[countersign] unhandled error:", err);
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
