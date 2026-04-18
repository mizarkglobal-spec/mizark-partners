import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { signed_name } = await req.json();

    if (!signed_name?.trim()) {
      return NextResponse.json({ error: "Signed name is required" }, { status: 400 });
    }

    const db = createAdminClient();

    const { data: partner } = await db
      .from("partners")
      .select("*, partner_agreements(*)")
      .eq("agreement_token", token)
      .maybeSingle();

    if (!partner) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    const agreement = partner.partner_agreements?.[0];
    if (agreement?.signed_at) {
      return NextResponse.json({ error: "Agreement already signed" }, { status: 409 });
    }

    const signedAt = new Date().toISOString();

    if (agreement) {
      await db
        .from("partner_agreements")
        .update({ signed_name: signed_name.trim(), signed_at: signedAt })
        .eq("id", agreement.id);
    } else {
      await db.from("partner_agreements").insert({
        partner_id: partner.id,
        signed_name: signed_name.trim(),
        signed_at: signedAt,
        version: "1.0",
      });
    }

    await db
      .from("partners")
      .update({ status: "agreement_signed" } as any)
      .eq("id", partner.id);

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://partners.mizarkglobal.com";
      await sendEmail({
        to: adminEmail,
        subject: `[FYI] ${partner.name} has signed and is proceeding to payment`,
        text: `${partner.name} (${partner.email}) signed their Musharakah agreement on ${new Date(signedAt).toLocaleString()} and has been directed to complete payment.\n\nInvestment: ₦${partner.investment_amount.toLocaleString("en-NG")}\n\nAdmin panel: ${appUrl}/admin`,
        html: `<p><strong>${partner.name}</strong> (${partner.email}) has signed their partnership agreement and is proceeding to payment.</p>
               <p>Signed at: ${new Date(signedAt).toLocaleString()}</p>
               <p>Investment: ₦${partner.investment_amount.toLocaleString("en-NG")}</p>
               <p><a href="${appUrl}/admin">Go to Admin Panel →</a></p>`,
      }).catch(console.error);
    }

    return NextResponse.json({ ok: true, payment_token: partner.payment_token ?? null });
  } catch (err) {
    console.error("[sign] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
