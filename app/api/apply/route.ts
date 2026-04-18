import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendApplicationReceived } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      location,
      amount_intent,
      motivation,
      prior_experience,
      referral_source,
      commit_lock,
      commit_risk,
      commit_halal,
    } = body;

    // Validation
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!email?.trim() || !email.includes("@")) return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    if (!phone?.trim()) return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    if (!amount_intent || typeof amount_intent !== "number" || amount_intent < 500000) {
      return NextResponse.json({ error: "Minimum investment is ₦500,000" }, { status: 400 });
    }
    if (!motivation?.trim() || motivation.trim().length < 20) {
      return NextResponse.json({ error: "Please provide a motivation of at least 20 characters" }, { status: 400 });
    }
    if (!commit_lock || !commit_risk || !commit_halal) {
      return NextResponse.json({ error: "All commitment checkboxes must be confirmed" }, { status: 400 });
    }

    const db = createAdminClient();

    // Check for duplicate application
    const { data: existing } = await db
      .from("partner_applications")
      .select("id, status")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (existing) {
      if (existing.status === "pending") {
        return NextResponse.json({ error: "An application from this email is already under review." }, { status: 409 });
      }
      if (existing.status === "approved") {
        return NextResponse.json({ error: "This email already has an approved application." }, { status: 409 });
      }
    }

    const { error: insertError } = await db.from("partner_applications").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      location: location?.trim() || null,
      amount_intent,
      motivation: motivation.trim(),
      prior_experience: !!prior_experience,
      referral_source: referral_source || null,
      status: "pending",
    });

    if (insertError) {
      console.error("[apply] insert error:", insertError);
      return NextResponse.json({ error: "Failed to save application" }, { status: 500 });
    }

    // Send confirmation email (non-blocking on failure)
    try {
      await sendApplicationReceived({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        amount: amount_intent.toLocaleString("en-NG"),
      });
    } catch (emailErr) {
      console.error("[apply] email send failed:", emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[apply] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
