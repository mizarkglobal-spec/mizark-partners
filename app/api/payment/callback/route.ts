import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyTransaction } from "@/lib/paystack";
import { recordInstallment } from "@/lib/installments";

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

    const amount = txData.amount / 100; // Paystack sends kobo
    const paymentDate = new Date().toISOString().slice(0, 10);

    try {
      await recordInstallment(db, partner.id, amount, paymentDate, reference, "paystack", null);
    } catch (e: any) {
      if (e.message !== "DUPLICATE_REF") {
        console.error("[callback] recordInstallment error:", e);
      }
    }

    return NextResponse.redirect(`${appUrl}/payment/success`);
  } catch (err) {
    console.error("[callback] error:", err);
    const appUrl2 = process.env.NEXT_PUBLIC_APP_URL ?? "https://partners.mizarkglobal.com";
    return NextResponse.redirect(`${appUrl2}/payment/success`);
  }
}
