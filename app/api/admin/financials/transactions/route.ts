import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import type { Division, TxType } from "@/lib/financials";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { searchParams } = new URL(req.url);

  let query = db
    .from("financial_transactions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const division = searchParams.get("division");
  const type = searchParams.get("type");

  if (start) query = query.gte("date", start);
  if (end) query = query.lte("date", end);
  if (division && division !== "all") query = query.eq("division", division);
  if (type && type !== "all") query = query.eq("type", type);

  const limit = Number(searchParams.get("limit") ?? 500);
  query = query.limit(limit);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ transactions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const body = await req.json();
  const { date, division, type, category, amount, description, reference } = body;

  if (!date || !division || !type || !category || amount == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (Number(amount) < 0) {
    return NextResponse.json({ error: "Amount must be non-negative" }, { status: 400 });
  }

  const VALID_DIVISIONS: Division[] = ["learn_mizark", "leadash", "shared"];
  const VALID_TYPES: TxType[] = ["revenue", "cogs", "opex", "tax"];
  if (!VALID_DIVISIONS.includes(division)) return NextResponse.json({ error: "Invalid division" }, { status: 400 });
  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  const { data, error } = await db
    .from("financial_transactions")
    .insert({
      date,
      division,
      type,
      category,
      amount: Number(amount),
      description: description || null,
      reference: reference || null,
      is_auto: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transaction: data }, { status: 201 });
}
