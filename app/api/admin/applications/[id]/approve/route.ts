import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { generateToken, equityForAmount } from "@/lib/format";
import { sendApplicationApproved } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { id } = await params;

  const { data: application } = await db
    .from("partner_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.status !== "pending") {
    return NextResponse.json({ error: "Application is not pending" }, { status: 400 });
  }

  const pitchToken = generateToken();
  const reviewedAt = new Date().toISOString();

  await db
    .from("partner_applications")
    .update({
      status: "approved",
      pitch_token: pitchToken,
      reviewed_at: reviewedAt,
      reviewed_by: process.env.ADMIN_EMAIL ?? "admin",
    })
    .eq("id", id);

  // Create a partner record for them with pending status
  const agreementToken = generateToken();
  const paymentToken = generateToken();
  const equity = equityForAmount(application.amount_intent);
  const startDate = new Date();
  const termEnd = new Date(startDate);
  termEnd.setFullYear(termEnd.getFullYear() + 3);

  const { error: partnerError } = await db.from("partners").insert({
    application_id: id,
    name: application.name,
    email: application.email,
    phone: application.phone,
    investment_amount: application.amount_intent,
    equity_pct: equity,
    start_date: startDate.toISOString().split("T")[0],
    term_end_date: termEnd.toISOString().split("T")[0],
    status: "pending_payment",
    agreement_token: agreementToken,
    payment_token: paymentToken,
  });

  if (partnerError) {
    console.error("[approve] partner insert error:", partnerError);
  }

  // Send approval email
  await sendApplicationApproved({
    name: application.name,
    email: application.email,
    token: pitchToken,
  }).catch(console.error);

  return NextResponse.json({ ok: true, pitch_token: pitchToken });
}
