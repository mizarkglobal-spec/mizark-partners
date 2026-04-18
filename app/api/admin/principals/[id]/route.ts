import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import type { Principal } from "../route";

const DEFAULTS: Principal[] = [
  { id: "founder", name: "Malik Adelaja", role: "Founder & CEO", equity_pct: 80, bio: "", is_founder: true },
];

async function getConfig(db: any) {
  try {
    const { data } = await db.from("program_config").select("settings").eq("id", 1).maybeSingle();
    return data?.settings ?? {};
  } catch { return {}; }
}
async function saveConfig(db: any, settings: any) {
  await db.from("program_config").upsert({ id: 1, settings, updated_at: new Date().toISOString() });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;
  const { id } = await params;
  const body = await req.json();

  const config = await getConfig(db);
  const principals: Principal[] = config.principals ?? DEFAULTS;
  const idx = principals.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  principals[idx] = { ...principals[idx], ...body, id };
  await saveConfig(db, { ...config, principals });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;
  const { id } = await params;

  const config = await getConfig(db);
  const principals: Principal[] = config.principals ?? DEFAULTS;
  const updated = principals.filter((p) => p.id !== id);
  await saveConfig(db, { ...config, principals: updated });
  return NextResponse.json({ ok: true });
}
