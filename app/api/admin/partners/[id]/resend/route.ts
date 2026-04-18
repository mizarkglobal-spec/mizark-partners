import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  sendAgreementReady,
  sendPaymentInstructions,
  sendWelcomePartner,
} from "@/lib/email";
import { equityForAmount } from "@/lib/format";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;
  const { id } = await params;

  const { type } = await req.json();

  const { data: partner } = await db
    .from("partners")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  switch (type) {
    case "agreement":
      if (!partner.agreement_token) {
        return NextResponse.json({ error: "No agreement token" }, { status: 400 });
      }
      await sendAgreementReady({
        name: partner.name,
        email: partner.email,
        token: partner.agreement_token,
      });
      break;

    case "payment":
      if (!partner.payment_token) {
        return NextResponse.json({ error: "No payment token" }, { status: 400 });
      }
      await sendPaymentInstructions({
        name: partner.name,
        email: partner.email,
        token: partner.payment_token,
        amount: partner.investment_amount,
      });
      break;

    case "welcome":
      if (partner.status !== "active") {
        return NextResponse.json({ error: "Partner is not active" }, { status: 400 });
      }
      const equityPct = equityForAmount(partner.investment_amount);
      await sendWelcomePartner({
        name: partner.name,
        email: partner.email,
        equityPct,
        amount: partner.investment_amount,
      });
      break;

    default:
      return NextResponse.json({ error: "Unknown resend type" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
