import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendWelcomePartner } from "@/lib/email";
import { equityForAmount } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://partners.mizarkglobal.com";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const { db } = auth;

    const { id } = await params;

    const { data: partner } = await db
      .from("partners")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    if (partner.status === "active") {
      return NextResponse.json({ error: "Partner already active" }, { status: 409 });
    }

    const now = new Date().toISOString();

    const { error: updateError } = await db
      .from("partners")
      .update({ status: "active", activated_at: now } as any)
      .eq("id", partner.id);

    if (updateError) {
      console.error("[activate] update error:", updateError);
      return NextResponse.json({ error: "Failed to activate partner: " + updateError.message }, { status: 500 });
    }

    // Welcome notification
    await Promise.resolve(
      db.from("partner_notifications").insert({
        partner_id: partner.id,
        type: "general",
        title: "Welcome to Mizark Global Partnership",
        body: `Alhamdulillah! Your investment of ₦${partner.investment_amount.toLocaleString("en-NG")} has been confirmed. Welcome aboard, ${partner.name}.`,
        read: false,
      })
    ).catch(console.error);

    // Generate a magic link so partner can set up their account (password or Google)
    const adminDb = createAdminClient();
    let setupUrl: string | undefined;
    try {
      const { data: linkData } = await adminDb.auth.admin.generateLink({
        type: "magiclink",
        email: partner.email,
        options: {
          redirectTo: `${APP_URL}/api/auth/callback?next=/setup-account`,
        },
      });
      setupUrl = linkData?.properties?.action_link ?? undefined;
    } catch (e) {
      console.error("[activate] generate link error:", e);
    }

    const equityPct = equityForAmount(partner.investment_amount);
    await sendWelcomePartner({
      name: partner.name,
      email: partner.email,
      equityPct,
      amount: partner.investment_amount,
      setupUrl,
    }).catch(console.error);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[activate] unhandled error:", err);
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
