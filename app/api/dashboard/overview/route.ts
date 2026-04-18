import { NextRequest, NextResponse } from "next/server";
import { requirePartner } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requirePartner(req);
  if (!auth.ok) return auth.res;
  const { partner, db } = auth;

  const [
    { data: distributions },
    { data: announcements },
    { data: notifications },
  ] = await Promise.all([
    db
      .from("distributions")
      .select("*")
      .eq("partner_id", partner.id)
      .order("created_at", { ascending: false })
      .limit(10),
    db
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3),
    db
      .from("partner_notifications")
      .select("*")
      .eq("partner_id", partner.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalDistributed = (distributions || [])
    .filter((d: any) => d.status === "paid")
    .reduce((sum: number, d: any) => sum + d.amount, 0);

  return NextResponse.json({
    partner,
    distributions: distributions ?? [],
    announcements: announcements ?? [],
    notifications: notifications ?? [],
    totalDistributed,
  });
}
