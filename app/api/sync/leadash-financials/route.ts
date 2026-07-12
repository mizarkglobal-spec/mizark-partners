/**
 * POST /api/sync/leadash-financials
 *
 * Receives closed-month P&L summaries pushed from Leadash's finance system
 * (on accountant month-close). Authenticated by the LEADASH_SYNC_SECRET
 * shared-secret header — no user session involved.
 *
 * Rows land as 'pending' and never reach investor reports until approved in
 * the admin UI. A re-sync of an approved month (numbers changed after a
 * reopen) flips it back to 'pending' for re-approval. `retract: true` marks
 * the sync 'stale' (Leadash reopened the month — figures are in flux).
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (!secret || secret !== process.env.LEADASH_SYNC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    period_month?: string;
    summary?: Record<string, unknown>;
    retract?: boolean;
  };
  if (!body.period_month || !/^\d{4}-\d{2}-01$/.test(body.period_month)) {
    return NextResponse.json({ error: "period_month must be YYYY-MM-01" }, { status: 400 });
  }

  const db = createAdminClient();

  if (body.retract) {
    await db.from("leadash_financial_syncs")
      .update({ status: "stale" })
      .eq("period_month", body.period_month);
    return NextResponse.json({ ok: true, status: "stale" });
  }

  if (!body.summary || typeof body.summary !== "object") {
    return NextResponse.json({ error: "summary payload is required" }, { status: 400 });
  }

  // Upsert; any prior status (incl. approved) returns to pending — changed
  // numbers must be re-approved before investors see them.
  const { error } = await db.from("leadash_financial_syncs").upsert({
    period_month:   body.period_month,
    payload:        body.summary,
    status:         "pending",
    synced_at:      new Date().toISOString(),
    approved_by:    null,
    approved_at:    null,
    rejection_note: null,
  }, { onConflict: "period_month" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, status: "pending" });
}
