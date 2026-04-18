import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { data: distributions } = await db
    .from("distributions")
    .select("*, partners(name)")
    .order("created_at", { ascending: false });

  const enriched = (distributions ?? []).map((d: any) => ({
    ...d,
    partner_name: d.partners?.name,
    partners: undefined,
  }));

  return NextResponse.json({ distributions: enriched });
}
