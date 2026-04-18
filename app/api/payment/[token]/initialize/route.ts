import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { initializeTransaction } from "@/lib/paystack";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const db = createAdminClient();

    const { data: partner } = await db
      .from("partners")
      .select("*")
      .eq("payment_token", token)
      .maybeSingle();

    if (!partner) {
      return NextResponse.json({ error: "Invalid payment token" }, { status: 404 });
    }

    if (partner.status === "active") {
      return NextResponse.json({ error: "This payment has already been completed" }, { status: 400 });
    }

    const reference = `MIZARK-${partner.id.slice(0, 8).toUpperCase()}-${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://partners.mizarkglobal.com";

    const result = await initializeTransaction({
      email: partner.email,
      amount: partner.investment_amount * 100, // kobo
      reference,
      callback_url: `${appUrl}/api/payment/callback?reference=${reference}`,
      metadata: {
        partner_id: partner.id,
        partner_name: partner.name,
        payment_token: token,
      },
    });

    // Save reference
    await db
      .from("partners")
      .update({ paystack_ref: reference } as any)
      .eq("id", partner.id);

    return NextResponse.json({ url: result.data?.authorization_url });
  } catch (err: any) {
    console.error("[payment/initialize]", err);
    return NextResponse.json({ error: err.message || "Failed to initialize payment" }, { status: 500 });
  }
}

// HEAD method for preflight
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
