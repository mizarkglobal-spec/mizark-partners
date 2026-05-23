import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendWelcomePartner, sendPaymentConfirmation, sendAdminPaymentAlert } from "@/lib/email";
import { equityForAmount } from "@/lib/format";

interface Props { params: Promise<{ id: string }> }

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://partners.mizarkglobal.com";

export async function POST(req: NextRequest, { params }: Props) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { id } = await params;
  const { installment_id } = await req.json();

  // Fetch partner
  const { data: partner } = await db.from("partners").select("*").eq("id", id).maybeSingle();
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  // Fetch all installments sorted by date asc to determine order
  const { data: allInstallments } = await db
    .from("partner_installments")
    .select("*")
    .eq("partner_id", id)
    .order("payment_date", { ascending: true })
    .order("created_at", { ascending: true });

  const installments: any[] = allInstallments ?? [];

  // Use specified installment or fall back to most recent
  const inst = installment_id
    ? installments.find((i) => i.id === installment_id)
    : installments[installments.length - 1];

  if (!inst) return NextResponse.json({ error: "No installment found" }, { status: 404 });

  // Compute running totals up to and including this installment
  const instIndex = installments.findIndex((i) => i.id === inst.id);
  const totalPaid = installments
    .slice(0, instIndex + 1)
    .reduce((s, i) => s + Number(i.amount), 0);

  const committedAmount = Number(partner.committed_amount ?? partner.investment_amount ?? 0);
  const committedEquityPct = partner.equity_committed_pct != null
    ? Number(partner.equity_committed_pct)
    : equityForAmount(committedAmount);
  const activeEquityPct = committedAmount > 0
    ? Number(((totalPaid / committedAmount) * committedEquityPct).toFixed(6))
    : equityForAmount(totalPaid);
  const isComplete = totalPaid >= committedAmount;
  const isFirstPayment = instIndex === 0;
  const receiptUrl = `${APP_URL}/api/admin/partners/${id}/receipt?installment_id=${inst.id}`;

  const errors: string[] = [];

  // Partner email
  try {
    if (isFirstPayment) {
      const adminDb = (await import("@/lib/supabase/server")).createAdminClient();
      const { data: linkData } = await adminDb.auth.admin.generateLink({
        type: "magiclink",
        email: partner.email,
        options: { redirectTo: `${APP_URL}/api/auth/callback?next=/setup-account` },
      });
      await sendWelcomePartner({
        name: partner.name,
        email: partner.email,
        equityPct: activeEquityPct,
        amount: Number(inst.amount),
        setupUrl: linkData?.properties?.action_link,
      });
    } else {
      await sendPaymentConfirmation({
        name: partner.name,
        email: partner.email,
        amount: Number(inst.amount),
        totalPaid,
        committedAmount,
        activeEquityPct,
        committedEquityPct,
        isComplete,
        installmentReceiptUrl: receiptUrl,
      });
    }
  } catch (e: any) {
    console.error("[resend] partner email error:", e);
    errors.push(`Partner email: ${e.message}`);
  }

  // Admin alert
  try {
    await sendAdminPaymentAlert({
      partnerName: partner.name,
      partnerEmail: partner.email,
      amount: Number(inst.amount),
      totalPaid,
      committedAmount,
      activeEquityPct,
      method: inst.method,
      reference: inst.reference,
      isFirstPayment,
      isComplete,
    });
  } catch (e: any) {
    console.error("[resend] admin alert error:", e);
    errors.push(`Admin alert: ${e.message}`);
  }

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 500 });
  }

  return NextResponse.json({ ok: true, installment_id: inst.id, partner_email: partner.email });
}
