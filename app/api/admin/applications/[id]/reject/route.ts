import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendApplicationRejected } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { id } = await params;
  const { note } = await req.json().catch(() => ({}));

  const { data: application } = await db
    .from("partner_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  await db
    .from("partner_applications")
    .update({
      status: "rejected",
      review_note: note || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: process.env.ADMIN_EMAIL ?? "admin",
    })
    .eq("id", id);

  await sendApplicationRejected({
    name: application.name,
    email: application.email,
    note: note || undefined,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
