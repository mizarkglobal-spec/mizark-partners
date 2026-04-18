import { NextRequest, NextResponse } from "next/server";
import { requirePartner } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requirePartner(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { data: reports } = await db
    .from("reports")
    .select("*")
    .order("generated_at", { ascending: false });

  return NextResponse.json({ reports: reports ?? [] });
}
