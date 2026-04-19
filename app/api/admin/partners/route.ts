import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { generateToken, equityForAmount } from "@/lib/format";
import { sendAgreementReady } from "@/lib/email";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { data: partners } = await db
    .from("partners")
    .select("*")
    .order("created_at", { ascending: false });

  // Get total distributed per partner
  const partnerIds = (partners ?? []).map((p: any) => p.id);
  const totalDistributed: Record<string, number> = {};

  if (partnerIds.length > 0) {
    const { data: distributions } = await db
      .from("distributions")
      .select("partner_id, amount, status")
      .in("partner_id", partnerIds)
      .eq("status", "paid");

    for (const d of distributions ?? []) {
      totalDistributed[d.partner_id] = (totalDistributed[d.partner_id] ?? 0) + d.amount;
    }
  }

  return NextResponse.json({ partners: partners ?? [], totalDistributed });
}

// POST — manually add a partner
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const body = await req.json();
  const {
    name, email, phone, investment_amount,
    start_date, term_end_date, notes,
    send_agreement = true,
  } = body;

  if (!name || !email || !investment_amount) {
    return NextResponse.json({ error: "name, email, investment_amount are required" }, { status: 400 });
  }

  const equityPct = equityForAmount(Number(investment_amount));
  const agreementToken = generateToken();
  const paymentToken = generateToken();

  // Calculate term end if not provided
  const startDate = start_date || new Date().toISOString().slice(0, 10);
  const termEndDate = term_end_date || (() => {
    const d = new Date(startDate);
    d.setFullYear(d.getFullYear() + 3);
    return d.toISOString().slice(0, 10);
  })();

  const { data: partner, error } = await db
    .from("partners")
    .insert({
      name,
      email,
      phone: phone || null,
      investment_amount: Number(investment_amount),
      equity_pct: equityPct,
      start_date: startDate,
      term_end_date: termEndDate,
      status: "pending_payment",
      agreement_token: agreementToken,
      payment_token: paymentToken,
      notes: notes || null,
    } as any)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create agreement record
  await db.from("partner_agreements").insert({
    partner_id: partner.id,
    version: "1.0",
  });

  // Optionally send agreement email
  if (send_agreement) {
    await sendAgreementReady({
      name: partner.name,
      email: partner.email,
      token: agreementToken,
    }).catch(console.error);
  }

  return NextResponse.json({ ok: true, partner });
}
