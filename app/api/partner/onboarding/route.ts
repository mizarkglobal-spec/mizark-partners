import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const db = createAdminClient();

  // Find partner record
  let { data: partner } = await db
    .from("partners")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!partner) {
    const { data: byEmail } = await db
      .from("partners")
      .select("id, status")
      .eq("email", user.email!)
      .eq("status", "active")
      .maybeSingle();
    partner = byEmail;
  }

  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const { error } = await db
    .from("partners")
    .update({
      kyc_data: body,
      onboarding_completed: true,
    } as any)
    .eq("id", partner.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const db = createAdminClient();
  let { data: partner } = await db
    .from("partners")
    .select("kyc_data, onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!partner) {
    const { data: byEmail } = await db
      .from("partners")
      .select("kyc_data, onboarding_completed")
      .eq("email", user.email!)
      .maybeSingle();
    partner = byEmail;
  }

  return NextResponse.json({
    kyc_data: (partner as any)?.kyc_data ?? null,
    onboarding_completed: (partner as any)?.onboarding_completed ?? false,
  });
}
