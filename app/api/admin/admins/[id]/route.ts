import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { id } = await params;

  const { data: adminUser } = await db
    .from("admin_users")
    .select("id, email")
    .eq("id", id)
    .maybeSingle();

  if (!adminUser) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

  const { error } = await db
    .from("admin_users")
    .update({ status: "revoked" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
