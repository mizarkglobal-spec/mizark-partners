import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAdminInvite } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://partners.mizarkglobal.com";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { data, error } = await db
    .from("admin_users")
    .select("id, email, name, status, invited_by, invited_at, activated_at")
    .order("invited_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ admins: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db, user } = auth;

  const body = await req.json();
  const email = (body.email ?? "").trim().toLowerCase();
  const name  = (body.name ?? "").trim() || null;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (email === process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "That email is already the primary admin" }, { status: 409 });
  }

  // Upsert — re-invite if previously revoked
  const { data: existing } = await db
    .from("admin_users")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  if (existing && existing.status === "active") {
    return NextResponse.json({ error: "That email is already an active admin" }, { status: 409 });
  }

  const invitedBy = user?.email ?? process.env.ADMIN_EMAIL ?? "admin";

  if (existing) {
    await db
      .from("admin_users")
      .update({ status: "invited", name, invited_by: invitedBy, invited_at: new Date().toISOString(), activated_at: null })
      .eq("id", existing.id);
  } else {
    const { error: insertErr } = await db
      .from("admin_users")
      .insert({ email, name, invited_by: invitedBy, status: "invited" });
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Generate magic link pointing to /admin
  const adminDb = createAdminClient();
  const { data: linkData, error: linkErr } = await adminDb.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${APP_URL}/api/auth/callback` },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    console.error("[admin invite] generate link error:", linkErr);
    return NextResponse.json({ error: "Could not generate invite link" }, { status: 500 });
  }

  await sendAdminInvite({
    name: name ?? undefined,
    email,
    invitedBy,
    loginUrl: linkData.properties.action_link,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
