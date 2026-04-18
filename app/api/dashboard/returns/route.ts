import { NextRequest, NextResponse } from "next/server";
import { requirePartner } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requirePartner(req);
  if (!auth.ok) return auth.res;
  const { partner, db } = auth;

  const { data: distributions } = await db
    .from("distributions")
    .select("*")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ partner, distributions: distributions ?? [] });
}
