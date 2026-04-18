import { NextRequest, NextResponse } from "next/server";
import { requirePartner } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requirePartner(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { data: financials } = await db
    .from("monthly_financials")
    .select("*")
    .order("period", { ascending: false })
    .limit(24);

  return NextResponse.json({ financials: financials ?? [] });
}
