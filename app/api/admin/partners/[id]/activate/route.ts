import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendWelcomePartner } from "@/lib/email";
import { equityForAmount } from "@/lib/format";

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

    // Welcome email (sendEmail has an 8s timeout, so this won't hang indefinitely)
    const equityPct = equityForAmount(partner.investment_amount);
    await sendWelcomePartner({
      name: partner.name,
      email: partner.email,
      equityPct,
      amount: partner.investment_amount,
    }).catch(console.error);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[activate] unhandled error:", err);
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
