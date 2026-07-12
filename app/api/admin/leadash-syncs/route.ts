/**
 * /api/admin/leadash-syncs
 *
 * Admin review of Leadash's auto-synced closed-month summaries. GET lists
 * syncs; POST approves (maps payload → monthly_financials, making it visible
 * to investor reports) or rejects with a note. Nothing enters investor
 * reporting without an explicit approval here.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

interface LeadashSummary {
  revenue?: Record<string, number>;
  total_revenue?: number;
  total_cogs?: number;
  total_opex?: number;
  total_tax_expense?: number;
  net_profit?: number;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const { data } = await auth.db
    .from("leadash_financial_syncs")
    .select("*")
    .order("period_month", { ascending: false });
  return NextResponse.json({ syncs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;
  const body = await req.json() as { id?: string; action?: "approve" | "reject"; note?: string };

  if (!body.id || !["approve", "reject"].includes(body.action ?? "")) {
    return NextResponse.json({ error: "id and action ('approve'|'reject') are required" }, { status: 400 });
  }

  const { data: sync } = await db.from("leadash_financial_syncs").select("*").eq("id", body.id).maybeSingle();
  if (!sync) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sync.status !== "pending") {
    return NextResponse.json({ error: `Sync is '${sync.status}' — only pending syncs can be actioned` }, { status: 400 });
  }

  const approver = ("user" in auth && auth.user?.email) ? auth.user.email : "admin";

  if (body.action === "reject") {
    await db.from("leadash_financial_syncs").update({
      status:         "rejected",
      rejection_note: body.note?.trim() || null,
      approved_by:    approver,
      approved_at:    new Date().toISOString(),
    }).eq("id", body.id);
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  // Approve: map the Leadash summary into monthly_financials.
  // academy/challenge/offer revenue → academy_rev; everything else (plan,
  // credits, addon, external, other) → leadash_rev; cogs+opex+tax → expenses.
  const summary = (sync.payload ?? {}) as LeadashSummary;
  const revenueByCategory = summary.revenue ?? {};
  const ACADEMY_CATEGORIES = ["revenue.academy", "revenue.challenge", "revenue.offer"];

  let academyRev = 0;
  let leadashRev = 0;
  for (const [category, amount] of Object.entries(revenueByCategory)) {
    if (ACADEMY_CATEGORIES.includes(category)) academyRev += amount;
    else leadashRev += amount;
  }
  // Fall back to total_revenue if the category map is missing
  if (academyRev + leadashRev === 0 && (summary.total_revenue ?? 0) > 0) {
    leadashRev = summary.total_revenue ?? 0;
  }
  const expenses = Math.round((summary.total_cogs ?? 0) + (summary.total_opex ?? 0) + (summary.total_tax_expense ?? 0));

  const period = (sync.period_month as string).slice(0, 7); // YYYY-MM
  const now = new Date().toISOString();

  const { data: existing } = await db.from("monthly_financials").select("id").eq("period", period).maybeSingle();
  if (existing) {
    const { error } = await db.from("monthly_financials").update({
      leadash_rev: Math.round(leadashRev),
      academy_rev: Math.round(academyRev),
      expenses,
      notes:      `Synced from Leadash finance (approved ${now.slice(0, 10)} by ${approver})`,
      source:     "leadash_sync",
      updated_at: now,
    }).eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await db.from("monthly_financials").insert({
      period,
      leadash_rev: Math.round(leadashRev),
      academy_rev: Math.round(academyRev),
      expenses,
      notes:  `Synced from Leadash finance (approved ${now.slice(0, 10)} by ${approver})`,
      source: "leadash_sync",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await db.from("leadash_financial_syncs").update({
    status:      "approved",
    approved_by: approver,
    approved_at: now,
  }).eq("id", body.id);

  return NextResponse.json({ ok: true, status: "approved", period, leadash_rev: Math.round(leadashRev), academy_rev: Math.round(academyRev), expenses });
}
