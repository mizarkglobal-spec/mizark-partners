import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { recordInstallment } from "@/lib/installments";

interface Props { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Props) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { id } = await params;

  const { data, error } = await db
    .from("partner_installments")
    .select("*")
    .eq("partner_id", id)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ installments: data ?? [] });
}

export async function POST(req: NextRequest, { params }: Props) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { id } = await params;
  const body = await req.json();
  const { amount, payment_date, reference, method, notes } = body;

  if (!amount || !payment_date || !method) {
    return NextResponse.json({ error: "amount, payment_date, and method are required" }, { status: 400 });
  }
  if (Number(amount) <= 0) {
    return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
  }

  const VALID_METHODS = ["paystack", "bank_transfer", "manual", "other"];
  if (!VALID_METHODS.includes(method)) {
    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  }

  try {
    const result = await recordInstallment(
      db,
      id,
      Number(amount),
      payment_date,
      reference ?? null,
      method,
      notes ?? null,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    if (e.message === "DUPLICATE_REF") {
      return NextResponse.json({ error: "Payment with this reference already recorded" }, { status: 409 });
    }
    if (e.message === "Partner not found") {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
