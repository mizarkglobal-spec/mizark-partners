import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { faq } = await req.json();

  const { data: existing } = await db.from("program_config").select("settings").eq("id", 1).maybeSingle();
  const current = (existing as any)?.settings ?? {};

  const { error } = await db.from("program_config").upsert({
    id: 1,
    settings: { ...current, musharaka_content: { faq } },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
