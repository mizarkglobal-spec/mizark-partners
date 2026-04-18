import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function requirePartner(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const db = createAdminClient();
  const { data: partner } = await db
    .from("partners")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!partner) {
    return { ok: false as const, res: NextResponse.json({ error: "Partner not found" }, { status: 403 }) };
  }
  return { ok: true as const, user, partner, db };
}

export async function requireAdmin(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret && secret === process.env.ADMIN_SECRET) {
    const db = createAdminClient();
    return { ok: true as const, db };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (user.email === process.env.ADMIN_EMAIL) {
    const db = createAdminClient();
    return { ok: true as const, db, user };
  }
  // Check invited admin_users table
  const db = createAdminClient();
  const { data: adminUser } = await db
    .from("admin_users")
    .select("id")
    .eq("email", user.email)
    .eq("status", "active")
    .maybeSingle();
  if (!adminUser) {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, db, user };
}

export async function isAdminEmail(email: string): Promise<boolean> {
  if (email === process.env.ADMIN_EMAIL) return true;
  const db = createAdminClient();
  const { data } = await db
    .from("admin_users")
    .select("id")
    .eq("email", email)
    .eq("status", "active")
    .maybeSingle();
  return !!data;
}
