import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import type { ProjectionAssumptions } from "@/lib/projections";
import { PROJECTION_DEFAULTS } from "@/lib/projections";

export type { ProjectionAssumptions } from "@/lib/projections";
export { PROJECTION_DEFAULTS } from "@/lib/projections";

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
  const projections: ProjectionAssumptions = { ...PROJECTION_DEFAULTS, ...(config.projections ?? {}) };
  return NextResponse.json({ projections });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;
  const body = await req.json();
  const config = await getConfig(db);
  await saveConfig(db, { ...config, projections: { ...(config.projections ?? {}), ...body } });
  return NextResponse.json({ ok: true });
}
