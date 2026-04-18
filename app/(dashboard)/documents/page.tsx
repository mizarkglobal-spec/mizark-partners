import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fmt } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createAdminClient();

  let { data: partner } = await db
    .from("partners")
    .select("*, partner_agreements(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!partner) {
    const { data: byEmail } = await db
      .from("partners")
      .select("*, partner_agreements(*)")
      .eq("email", user.email!)
      .eq("status", "active")
      .maybeSingle();
    if (byEmail) partner = byEmail;
  }

  if (!partner) redirect("/pending");

  const agreement = partner.partner_agreements?.[0];

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] mb-1">Documents</h1>
        <p className="text-gray-500 text-sm">Legal documents and records related to your partnership.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">

        {/* Musharakah Agreement */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-[#40916c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-[#111827] font-semibold mb-1">Musharakah Partnership Agreement</h3>
          <p className="text-gray-400 text-xs mb-3">Signed copy of your partnership agreement</p>
          {agreement?.signed_at && (
            <div className="text-gray-300 text-xs mb-4">Signed: {fmt.date(agreement.signed_at)}</div>
          )}
          <div className="flex flex-col gap-2">
            {partner.agreement_token ? (
              <>
                <a
                  href={`/agreement/${partner.agreement_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#40916c] hover:text-[#0f2a1e] transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Agreement
                </a>
                <a
                  href={`/api/agreement/${partner.agreement_token}/print`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#111827] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Signed PDF
                </a>
              </>
            ) : (
              <span className="text-xs text-gray-300">Agreement link not available</span>
            )}
          </div>
        </div>

        {/* Payment Receipt */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <div className="w-10 h-10 rounded-xl bg-[#fffbeb] flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-[#d4a843]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-[#111827] font-semibold mb-1">Payment Receipt</h3>
          <p className="text-gray-400 text-xs mb-3">Confirmation of your investment payment</p>
          {partner.activated_at && (
            <div className="text-gray-300 text-xs mb-4">Activated: {fmt.date(partner.activated_at)}</div>
          )}
          <a
            href="/api/dashboard/receipt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[#d4a843] hover:text-[#b8882e] transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Receipt
          </a>
        </div>

      </div>

      {/* Partnership Details */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <h3 className="text-[#111827] font-semibold mb-3">Partnership Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-400 text-xs mb-1">Investment Amount</div>
            <div className="text-[#d4a843] font-semibold">{fmt.naira(partner.investment_amount)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Equity Stake</div>
            <div className="text-[#40916c] font-semibold">{fmt.percent(Number(partner.equity_pct))}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Start Date</div>
            <div className="text-[#111827] font-semibold">{partner.start_date ? fmt.date(partner.start_date) : "—"}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Term End</div>
            <div className="text-[#111827] font-semibold">{partner.term_end_date ? fmt.date(partner.term_end_date) : "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
