import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyTransaction } from "@/lib/paystack";
import { sendWelcomePartner } from "@/lib/email";
import { equityForAmount } from "@/lib/format";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://partners.mizarkglobal.com";
  const reference = req.nextUrl.searchParams.get("reference");

  if (!reference) {
    return NextResponse.redirect(`${appUrl}/dashboard`);
  }

  try {
    const verification = await verifyTransaction(reference);
    const txData = verification.data;

    if (txData?.status !== "success") {
      return NextResponse.redirect(`${appUrl}/payment/success?status=pending`);
    }

    const db = createAdminClient();
    const partnerId = txData.metadata?.partner_id;

    let partner;
    if (partnerId) {
      const { data } = await db.from("partners").select("*").eq("id", partnerId).maybeSingle();
      partner = data;
    } else {
      const { data } = await db.from("partners").select("*").eq("paystack_ref", reference).maybeSingle();
      partner = data;
    }

    if (!partner) {
      console.error("[callback] Partner not found for reference:", reference);
      return NextResponse.redirect(`${appUrl}/dashboard`);
    }

    if (partner.status !== "active") {
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
        body: `Alhamdulillah! Your investment of ₦${partner.investment_amount.toLocaleString("en-NG")} has been confirmed. Welcome aboard, ${partner.name}.`,
        read: false,
      }).catch(console.error);

      // Send welcome email
      const equityPct = equityForAmount(partner.investment_amount);
      await sendWelcomePartner({
        name: partner.name,
        email: partner.email,
        equityPct,
        amount: partner.investment_amount,
      }).catch(console.error);
    }

    return NextResponse.redirect(`${appUrl}/payment/success`);
  } catch (err) {
    console.error("[callback] error:", err);
    const appUrl2 = process.env.NEXT_PUBLIC_APP_URL ?? "https://partners.mizarkglobal.com";
    return NextResponse.redirect(`${appUrl2}/payment/success`);
  }
}
