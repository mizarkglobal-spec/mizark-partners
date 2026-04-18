import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { buildAgreementPrintHtml } from "@/lib/agreement";
import { AGREEMENT_DEFAULTS } from "@/app/api/admin/agreement-template/route";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const db = createAdminClient();

  const [partnerResult, configResult] = await Promise.all([
    db.from("partners").select("*, partner_agreements(*)").eq("agreement_token", token).maybeSingle(),
    db.from("program_config").select("settings").eq("id", 1).maybeSingle(),
  ]);

  const partner = partnerResult.data;
  if (!partner) {
    return new NextResponse("Agreement not found", { status: 404 });
  }

  const rawSettings = (configResult.data as any)?.settings ?? {};
  const agreementConfig = {
    ...AGREEMENT_DEFAULTS,
    ...(rawSettings.agreement_template ?? {}),
    total_pool_amount: rawSettings.total_pool_amount ?? 20_000_000,
    total_equity_pct: rawSettings.total_equity_pct ?? 20,
    term_years: rawSettings.term_years ?? 3,
  };

  const agreement = partner.partner_agreements?.[0];

  const html = buildAgreementPrintHtml({
    partner,
    signedName: agreement?.signed_name ?? null,
    signedAt: agreement?.signed_at ?? null,
    countersignedAt: agreement?.countersigned_at ?? null,
    countersignedBy: (agreement as any)?.countersigned_by ?? null,
    config: agreementConfig,
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
