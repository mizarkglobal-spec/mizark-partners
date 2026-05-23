import type { SupabaseClient } from "@supabase/supabase-js";
import { equityForAmount } from "@/lib/format";
import { sendWelcomePartner, sendPaymentConfirmation, sendAdminPaymentAlert } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://partners.mizarkglobal.com";

export interface InstallmentResult {
  installment: Record<string, any>;
  partner: Record<string, any>;
  isFirstPayment: boolean;
  isComplete: boolean;
  newPaidAmount: number;
  committedAmount: number;
}

/**
 * Records a payment installment and updates the partner's paid_amount / equity_pct.
 * Activates the partner on first payment. Idempotent-safe via unique reference check.
 */
export async function recordInstallment(
  db: SupabaseClient,
  partnerId: string,
  amount: number,
  paymentDate: string,         // ISO date "YYYY-MM-DD"
  reference: string | null,
  method: "paystack" | "bank_transfer" | "manual" | "other",
  notes: string | null,
): Promise<InstallmentResult> {
  const { data: partner, error: pErr } = await db
    .from("partners")
    .select("*")
    .eq("id", partnerId)
    .maybeSingle();

  if (pErr || !partner) throw new Error("Partner not found");

  // Deduplicate by reference — don't double-log same Paystack ref
  if (reference) {
    const { data: existing } = await db
      .from("partner_installments")
      .select("id")
      .eq("partner_id", partnerId)
      .eq("reference", reference)
      .maybeSingle();
    if (existing) throw new Error("DUPLICATE_REF");
  }

  const currentPaid = Number(partner.paid_amount ?? 0);
  const committedAmount = Number(partner.committed_amount ?? partner.investment_amount ?? 0);
  const newPaidAmount = currentPaid + amount;
  // Use the partner's deal equity (equity_committed_pct) as the basis.
  // Active equity scales proportionally: paid / committed × deal_equity.
  // Fall back to formula only if no deal equity is set yet.
  const committedEquityPct = partner.equity_committed_pct != null
    ? Number(partner.equity_committed_pct)
    : equityForAmount(committedAmount);
  const newEquityPct = committedAmount > 0
    ? Number(((newPaidAmount / committedAmount) * committedEquityPct).toFixed(6))
    : equityForAmount(newPaidAmount);
  const isComplete = newPaidAmount >= committedAmount;
  const isFirstPayment = partner.status !== "active";

  // Insert installment record
  const { data: installment, error: insErr } = await db
    .from("partner_installments")
    .insert({
      partner_id: partnerId,
      amount,
      payment_date: paymentDate,
      reference: reference ?? null,
      method,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (insErr) throw new Error("Failed to record installment: " + insErr.message);

  // Update partner record
  const updates: Record<string, any> = {
    paid_amount: newPaidAmount,
    equity_pct: newEquityPct,
    payment_status: isComplete ? "complete" : "partial",
    committed_amount: committedAmount,
    // Preserve equity_committed_pct — only set it if it hasn't been set yet
    ...(partner.equity_committed_pct == null && { equity_committed_pct: committedEquityPct }),
  };

  if (isFirstPayment) {
    updates.status = "active";
    updates.activated_at = new Date().toISOString();
  }

  const { error: updErr } = await db.from("partners").update(updates).eq("id", partnerId);
  if (updErr) throw new Error("Failed to update partner: " + updErr.message);

  // In-app notification
  const outstanding = committedAmount - newPaidAmount;
  const notifBody = isFirstPayment
    ? `Alhamdulillah! Your payment of ₦${amount.toLocaleString("en-NG")} has been confirmed. You now hold ${newEquityPct.toFixed(3)}% active equity. Welcome aboard, ${partner.name}.`
    : isComplete
      ? `Payment of ₦${amount.toLocaleString("en-NG")} received. Your full commitment is complete — active equity: ${newEquityPct.toFixed(3)}%.`
      : `Payment of ₦${amount.toLocaleString("en-NG")} received. Total paid: ₦${newPaidAmount.toLocaleString("en-NG")} / ₦${committedAmount.toLocaleString("en-NG")}. Outstanding: ₦${outstanding.toLocaleString("en-NG")}. Active equity: ${newEquityPct.toFixed(3)}%.`;

  db.from("partner_notifications").insert({
    partner_id: partnerId,
    type: "general",
    title: isFirstPayment ? "Welcome to Mizark Global Partnership" : isComplete ? "Investment Complete — Full Equity Active" : "Payment Received",
    body: notifBody,
    read: false,
  }).then(null, console.error);

  // Receipt URL for email buttons
  const receiptUrl = `${APP_URL}/api/admin/partners/${partnerId}/receipt?installment_id=${installment.id}`;

  // Emails — fire-and-forget, don't block the response
  (async () => {
    try {
      if (isFirstPayment) {
        // Generate magic link so partner can set up their account / access dashboard
        const adminDb = (await import("@/lib/supabase/server")).createAdminClient();
        const { data: linkData } = await adminDb.auth.admin.generateLink({
          type: "magiclink",
          email: partner.email,
          options: { redirectTo: `${APP_URL}/api/auth/callback?next=/setup-account` },
        });
        await sendWelcomePartner({
          name: partner.name,
          email: partner.email,
          equityPct: newEquityPct,
          amount,
          setupUrl: linkData?.properties?.action_link,
        });
      } else {
        // Subsequent payment — send confirmation with dashboard link
        await sendPaymentConfirmation({
          name: partner.name,
          email: partner.email,
          amount,
          totalPaid: newPaidAmount,
          committedAmount,
          activeEquityPct: newEquityPct,
          committedEquityPct,
          isComplete,
          installmentReceiptUrl: receiptUrl,
        });
      }
    } catch (e) {
      console.error("[installment] partner email error:", e);
    }

    // Admin alert on every payment
    try {
      await sendAdminPaymentAlert({
        partnerName: partner.name,
        partnerEmail: partner.email,
        amount,
        totalPaid: newPaidAmount,
        committedAmount,
        activeEquityPct: newEquityPct,
        method,
        reference,
        isFirstPayment,
        isComplete,
      });
    } catch (e) {
      console.error("[installment] admin alert error:", e);
    }
  })();

  return {
    installment,
    partner: { ...partner, ...updates },
    isFirstPayment,
    isComplete,
    newPaidAmount,
    committedAmount,
  };
}
