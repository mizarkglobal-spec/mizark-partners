import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendAnnouncementEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { data: announcements } = await db
    .from("announcements")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return NextResponse.json({ announcements: announcements ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { title, body, is_pinned } = await req.json();

  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!body?.trim()) return NextResponse.json({ error: "Body is required" }, { status: 400 });

  const { data: announcement, error } = await db
    .from("announcements")
    .insert({ title: title.trim(), body: body.trim(), is_pinned: !!is_pinned })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create notifications for all active partners
  const { data: partners } = await db
    .from("partners")
    .select("id, name, email")
    .eq("status", "active");

  if (partners && partners.length > 0) {
    const notifications = partners.map((p: any) => ({
      partner_id: p.id,
      type: "announcement",
      title,
      body: body.slice(0, 200),
      read: false,
    }));
    await db.from("partner_notifications").insert(notifications).catch(console.error);

    // Email broadcast
    for (const p of partners) {
      sendAnnouncementEmail({ name: p.name, email: p.email, title, body })
        .catch(console.error);
    }
  }

  return NextResponse.json({ ok: true, announcement });
}
