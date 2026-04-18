import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const db = createAdminClient();
  const { data: application } = await db
    .from("partner_applications")
    .select("id, name, email, amount_intent, status, created_at")
    .eq("pitch_token", token)
    .maybeSingle();

  if (!application || application.status !== "approved") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, application });
}
