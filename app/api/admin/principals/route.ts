import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export interface Principal {
  id: string;
  name: string;
  role: string;
  equity_pct: number;
  bio?: string;
  is_founder?: boolean;
}

const DEFAULTS: Principal[] = [
  {
    id: "founder",
    name: "Malik Adelaja",
    role: "Founder & CEO",
    equity_pct: 80,
    bio: "Founder and CEO of Mizark Global Limited. Building Leadash and Learn by Mizark.",
    is_founder: true,
  },
];

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
  const principals: Principal[] = config.principals ?? DEFAULTS;
  return NextResponse.json({ principals });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const body = await req.json();
  if (!body.name || !body.role) {
    return NextResponse.json({ error: "name and role are required" }, { status: 400 });
  }

  const config = await getConfig(db);
  const principals: Principal[] = config.principals ?? DEFAULTS;

  const newPrincipal: Principal = {
    id: crypto.randomUUID(),
    name: body.name,
    role: body.role,
    equity_pct: Number(body.equity_pct ?? 0),
    bio: body.bio ?? "",
    is_founder: body.is_founder ?? false,
  };

  await saveConfig(db, { ...config, principals: [...principals, newPrincipal] });
  return NextResponse.json({ ok: true, principal: newPrincipal });
}
