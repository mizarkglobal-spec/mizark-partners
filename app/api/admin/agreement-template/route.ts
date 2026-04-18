import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import type { Article } from "@/lib/agreement";

export type { Article };

export interface AgreementTemplate {
  company_full_name: string;
  company_jurisdiction: string;
  ceo_name: string;
  arbitration_city: string;
  governing_law: string;
  articles: Article[];  // empty = use DEFAULT_ARTICLES from lib/agreement
  custom_article_14: string; // legacy field, kept for backwards compat
  footer_note: string;
}

export const AGREEMENT_DEFAULTS: AgreementTemplate = {
  company_full_name: "Mizark Global Limited",
  company_jurisdiction: "the Federal Republic of Nigeria",
  ceo_name: "Malik Adelaja",
  arbitration_city: "Lagos, Nigeria",
  governing_law: "the Federal Republic of Nigeria",
  articles: [],
  custom_article_14: "",
  footer_note: "",
};

async function getConfig(db: any) {
  try {
    const { data } = await db.from("program_config").select("settings").eq("id", 1).maybeSingle();
    return data?.settings ?? {};
  } catch { return {}; }
}
async function saveConfig(db: any, settings: any) {
  await db.from("program_config").upsert({ id: 1, settings, updated_at: new Date().toISOString() });
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;
  const config = await getConfig(db);
  const template: AgreementTemplate = { ...AGREEMENT_DEFAULTS, ...(config.agreement_template ?? {}) };
  return NextResponse.json({ template });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;
  const body = await req.json();
  const config = await getConfig(db);
  await saveConfig(db, { ...config, agreement_template: { ...(config.agreement_template ?? {}), ...body } });
  return NextResponse.json({ ok: true });
}
