import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import type { HomepageSettings } from "@/lib/homepage";
import { HOMEPAGE_DEFAULTS } from "@/lib/homepage";

export type { HomepageFaq, HomepageSettings } from "@/lib/homepage";
export { HOMEPAGE_DEFAULTS } from "@/lib/homepage";

async function getConfig(db: any) {
  try {
    const { data } = await db.from("program_config").select("settings").eq("id", 1).maybeSingle();
    return data?.settings ?? {};
  } catch {
    return {};
  }
}
async function saveConfig(db: any, settings: any) {
  await db.from("program_config").upsert({ id: 1, settings, updated_at: new Date().toISOString() });
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;
  const config = await getConfig(db);
  const homepage: HomepageSettings = { ...HOMEPAGE_DEFAULTS, ...(config.homepage ?? {}) };
  return NextResponse.json({ homepage });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;
  const body = await req.json();
  const config = await getConfig(db);
  await saveConfig(db, { ...config, homepage: { ...(config.homepage ?? {}), ...body } });
  return NextResponse.json({ ok: true });
}
