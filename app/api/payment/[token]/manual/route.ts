import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { proof_note } = await req.json();

    if (!proof_note?.trim()) {
      return NextResponse.json({ error: "Transfer details are required" }, { status: 400 });
    }

    const db = createAdminClient();

    const { data: partner } = await db
      .from("partners")
      .select("*")
      .eq("payment_token", token)
      .maybeSingle();

    if (!partner) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    const noteText = `[MANUAL PAYMENT SUBMITTED ${new Date().toISOString()}]: ${proof_note.trim()}`;
    const existingNotes = partner.notes ? `${partner.notes}\n\n${noteText}` : noteText;

    await db
      .from("partners")
      .update({ notes: existingNotes } as any)
      .eq("id", partner.id);

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `[Action Required] Manual payment submitted by ${partner.name}`,
        text: `${partner.name} (${partner.email}) has submitted a manual bank transfer.\n\nAmount: ₦${partner.investment_amount.toLocaleString("en-NG")}\n\nTransfer Details:\n${proof_note.trim()}\n\nPlease verify and activate their account.`,
        html: `<p><strong>${partner.name}</strong> (${partner.email}) has submitted a manual bank transfer.</p>
               <p>Amount: ₦${partner.investment_amount.toLocaleString("en-NG")}</p>
               <p><strong>Transfer Details:</strong><br>${proof_note.trim().replace(/\n/g, "<br>")}</p>
               <p>Please verify and activate their partner account.</p>`,
      }).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[manual payment] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
