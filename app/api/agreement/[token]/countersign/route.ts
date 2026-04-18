import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPaymentInstructions } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  // Admin-only: check x-admin-secret header
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { token } = await params;
    const db = createAdminClient();

    const { data: partner } = await db
      .from("partners")
      .select("*, partner_agreements(*)")
      .eq("agreement_token", token)
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

    await db
      .from("partner_agreements")
      .update({ countersigned_at: countersignedAt })
      .eq("id", agreement.id);

    await db
      .from("partners")
      .update({ status: "awaiting_payment" } as any)
      .eq("id", partner.id);

    // Send payment instructions email to partner
    if (partner.payment_token) {
      await sendPaymentInstructions({
        name: partner.name,
        email: partner.email,
        token: partner.payment_token,
        amount: partner.investment_amount,
      }).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[countersign] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
