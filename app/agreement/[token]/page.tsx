import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { fmt, equityForAmount } from "@/lib/format";
import { buildAgreementText } from "@/lib/agreement";
import { AGREEMENT_DEFAULTS } from "@/app/api/admin/agreement-template/route";
import AgreementSignForm from "./SignForm";
import Link from "next/link";
import MizarkLogo from "@/components/MizarkLogo";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function AgreementPage({ params }: Props) {
  const { token } = await params;
  const db = createAdminClient();

  const [partnerResult, configResult] = await Promise.all([
    db.from("partners").select("*, partner_agreements(*)").eq("agreement_token", token).maybeSingle(),
    db.from("program_config").select("settings").eq("id", 1).maybeSingle(),
  ]);

  const partner = partnerResult.data;
  if (!partner) notFound();

  const rawSettings = (configResult.data as any)?.settings ?? {};
  const agreementConfig = {
    ...AGREEMENT_DEFAULTS,
    ...(rawSettings.agreement_template ?? {}),
    total_pool_amount: rawSettings.total_pool_amount ?? 20_000_000,
    total_equity_pct: rawSettings.total_equity_pct ?? 20,
    term_years: rawSettings.term_years ?? 3,
  };

  const agreement = partner.partner_agreements?.[0];
  const agreementText = buildAgreementText(partner, agreementConfig);
  const ceoName = agreementConfig.ceo_name;
  const equity = equityForAmount(partner.investment_amount);
  const paymentToken: string | null = (partner as any).payment_token ?? null;

  const header = (
    <div className="px-4 sm:px-8 py-4 border-b border-white/10" style={{ background: "linear-gradient(90deg, #081a11, #0f2a1e)" }}>
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <MizarkLogo subtitle="Partnership Agreement" />
        <a
          href={`/api/agreement/${token}/print`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#d4a843] hover:bg-[#c49a38] text-[#0f2a1e] font-bold text-xs px-3 sm:px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden sm:inline">Download / Print PDF</span>
          <span className="sm:hidden">PDF</span>
        </a>
      </div>
    </div>
  );

  const partnerCard = (
    <div className="rounded-3xl p-6 border" style={{ background: "linear-gradient(135deg, #081a11, #0f2a1e)", borderColor: "rgba(255,255,255,0.08)" }}>
      <div className="text-white/40 text-xs uppercase tracking-wider mb-4 font-medium">Your Partnership Details</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <div>
          <div className="text-white/40 text-xs mb-1">Partner</div>
          <div className="text-white font-semibold text-sm">{partner.name}</div>
        </div>
        <div>
          <div className="text-white/40 text-xs mb-1">Investment</div>
          <div className="text-[#d4a843] font-bold">{fmt.naira(partner.investment_amount)}</div>
        </div>
        <div>
          <div className="text-white/40 text-xs mb-1">Equity Stake</div>
          <div className="text-[#74c69d] font-semibold">{equity.toFixed(3)}%</div>
        </div>
        <div>
          <div className="text-white/40 text-xs mb-1">Term</div>
          <div className="text-white font-semibold">{agreementConfig.term_years ?? 3} Years</div>
        </div>
      </div>
    </div>
  );

  // ── Already signed — show read-only view ────────────────────────────────
  if (agreement?.signed_at) {
    return (
      <div className="min-h-screen bg-[#f4f6f4]">
        {header}
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
          {/* Status Banner */}
          <div className="flex items-center gap-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-5">
            <div className="w-10 h-10 rounded-full bg-[#40916c] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-[#166534] font-bold text-sm">Agreement Signed</div>
              <div className="text-[#166534]/70 text-xs mt-0.5">
                You signed on {fmt.date(agreement.signed_at)}
              </div>
            </div>
            {paymentToken && (
              <Link
                href={`/payment/${paymentToken}`}
                className="flex-shrink-0 bg-[#40916c] hover:bg-[#2d6a4f] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors"
              >
                Complete Payment →
              </Link>
            )}
          </div>

          {partnerCard}

          {/* Agreement Document (read-only) */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-8 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#0f2a1e" }}>
                  <svg className="w-5 h-5 text-[#74c69d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-base font-bold text-gray-900">Musharakah Partnership Agreement</h1>
                  <p className="text-gray-400 text-xs">Version 1.0 · Prepared for {partner.name}</p>
                </div>
              </div>
              <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">Read-only</span>
            </div>
            <div className="px-8 py-6">
              <div className="rounded-2xl p-6 border border-gray-100 max-h-[500px] overflow-y-auto" style={{ background: "#f9fafb" }}>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                  {agreementText.trim()}
                </pre>
              </div>
            </div>
            {/* Signature blocks */}
            <div className="px-8 pb-8 grid sm:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">Partner Signature</div>
                <div className="text-3xl text-[#0f2a1e] border-b border-gray-200 pb-2 mb-2" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                  {agreement.signed_name || partner.name}
                </div>
                <div className="text-xs text-gray-500">Electronically signed · {fmt.date(agreement.signed_at)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">Mizark Global</div>
                {(agreement as any).countersigned_at ? (
                  <>
                    <div className="text-3xl text-[#0f2a1e] border-b border-gray-200 pb-2 mb-2" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                      {(agreement as any).countersigned_by || ceoName}
                    </div>
                    <div className="text-xs text-gray-500">
                      Countersigned · {fmt.date((agreement as any).countersigned_at)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="border-b border-dashed border-gray-300 pb-6 mb-2" />
                    <div className="text-xs text-amber-600 font-medium">Pending countersignature from Mizark Global</div>
                  </>
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400">
            Questions? Email{" "}
            <a href="mailto:partners@mizarkglobal.com" className="text-[#40916c] hover:underline">
              partners@mizarkglobal.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ── Unsigned — show pre-signed agreement + partner sign form ────────────
  return (
    <div className="min-h-screen bg-[#f4f6f4]">
      {header}

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        {partnerCard}

        {/* Agreement Document */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 pt-8 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#0f2a1e" }}>
                <svg className="w-5 h-5 text-[#74c69d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900" style={{ letterSpacing: "-0.02em" }}>
                  Musharakah Partnership Agreement
                </h1>
                <p className="text-gray-400 text-xs">Version 1.0 · Prepared for {partner.name}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <div className="rounded-2xl p-6 border border-gray-100 max-h-[600px] overflow-y-auto" style={{ background: "#f9fafb" }}>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                {agreementText.trim()}
              </pre>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Scroll to read the full agreement before signing below
            </p>
          </div>

          {/* Signature blocks — CEO pre-signed, partner pending */}
          <div className="px-8 pb-8 grid sm:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">Mizark Global</div>
              <div className="text-3xl text-[#0f2a1e] border-b border-gray-200 pb-2 mb-2" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                {ceoName}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <svg className="w-3.5 h-3.5 text-[#40916c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs text-[#40916c] font-medium">Pre-signed · Authorised signatory</span>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">Your Signature</div>
              <div className="border-b border-dashed border-gray-300 pb-6 mb-2" />
              <div className="text-xs text-gray-400 italic">Awaiting your signature below</div>
            </div>
          </div>
        </div>

        {/* Signature Form */}
        <AgreementSignForm token={token} partnerName={partner.name} paymentToken={paymentToken} />
      </div>
    </div>
  );
}
