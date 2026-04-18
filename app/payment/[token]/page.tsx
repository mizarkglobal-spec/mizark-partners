"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fmt, equityForAmount } from "@/lib/format";

interface Partner {
  id: string;
  name: string;
  email: string;
  investment_amount: number;
  equity_pct: number;
  start_date: string;
  term_end_date: string;
  status: string;
}

export default function PaymentPage() {
  const { token } = useParams<{ token: string }>();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [proofNote, setProofNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/payment/${token}/info`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data?.partner) setPartner(data.partner);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [token]);

  async function handleSubmit() {
    setError("");
    if (!proofNote.trim()) {
      setError("Please provide your transfer reference or details");
      return;
    }
    setPayLoading(true);
    try {
      const res = await fetch(`/api/payment/${token}/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof_note: proofNote.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPayLoading(false);
    }
  }

  const bg = "linear-gradient(160deg, #081a11, #0f2a1e, #132d20)";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-[#74c69d] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: bg }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
            Payment link not found
          </h2>
          <p className="text-white/40 text-sm">
            This link may be invalid or expired. Please contact{" "}
            <a href="mailto:partners@mizarkglobal.com" className="text-[#74c69d] hover:underline">
              partners@mizarkglobal.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: bg }}>
        <div className="max-w-md w-full">
          <div className="rounded-3xl p-10 text-center border" style={{ background: "#1a3a2a", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(116,198,157,0.15)", border: "2px solid rgba(116,198,157,0.25)" }}>
              <svg className="w-8 h-8 text-[#74c69d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="inline-block bg-[#74c69d]/10 border border-[#74c69d]/20 rounded-full px-4 py-1 text-[#74c69d] text-xs uppercase tracking-widest mb-4">
              Transfer Submitted
            </div>
            <h2 className="text-2xl font-bold text-white mb-3" style={{ letterSpacing: "-0.02em" }}>
              JazakAllah Khair
            </h2>
            <p className="text-white/50 leading-relaxed text-sm">
              We will verify your transfer within 1 business day and activate your partner account.
              You will receive a welcome email with access to your dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const equity = equityForAmount(partner.investment_amount);
  const inputClass = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#40916c]/30 focus:border-[#40916c] transition-colors resize-none";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      {/* Nav */}
      <div className="px-5 sm:px-8 py-4 border-b border-white/[0.07]">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#d4a843,#c49a38)" }}>
            <span className="text-[#0f2a1e] font-black text-xs">M</span>
          </div>
          <span className="text-white font-bold tracking-tight">Mizark Global</span>
          <div className="ml-auto flex items-center gap-1.5 text-white/30 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secured
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start sm:items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg space-y-4">
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
              Complete Your Investment
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Transfer {fmt.naira(partner.investment_amount)} to finalise your equity partnership
            </p>
          </div>

          {/* Investment Summary */}
          <div className="rounded-2xl p-5 border" style={{ background: "#1a3a2a", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="text-white/40 text-xs uppercase tracking-wider mb-4 font-medium">Investment Summary</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-white/40 text-xs mb-1">Partner</div>
                <div className="text-white font-semibold text-sm">{partner.name}</div>
              </div>
              <div>
                <div className="text-white/40 text-xs mb-1">Amount</div>
                <div className="text-[#d4a843] font-bold text-xl" style={{ letterSpacing: "-0.02em" }}>
                  {fmt.naira(partner.investment_amount)}
                </div>
              </div>
              <div>
                <div className="text-white/40 text-xs mb-1">Equity Stake</div>
                <div className="text-[#74c69d] font-semibold">{equity.toFixed(3)}%</div>
              </div>
              <div>
                <div className="text-white/40 text-xs mb-1">Term</div>
                <div className="text-white font-semibold">3 Years</div>
              </div>
            </div>
          </div>

          {/* Bank Transfer Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-7 space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-0.5" style={{ letterSpacing: "-0.02em" }}>
                  Bank Transfer Details
                </h3>
                <p className="text-gray-400 text-sm">Transfer the exact amount using the reference below.</p>
              </div>

              {/* Bank details */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <div className="space-y-3">
                  {[
                    ["Bank", process.env.NEXT_PUBLIC_BANK_NAME || "Guarantee Trust Bank"],
                    ["Account Name", process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "Mizark Global"],
                    ["Account Number", process.env.NEXT_PUBLIC_BANK_ACCOUNT || "0599905028"],
                    ["Amount", fmt.naira(partner.investment_amount)],
                    ["Reference", `MIZARK-${partner.id.slice(0, 8).toUpperCase()}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-4">
                      <span className="text-gray-500 text-sm">{k}</span>
                      <span className={`font-semibold text-sm text-right ${
                        k === "Reference" ? "text-[#40916c] font-mono" :
                        k === "Amount" ? "text-gray-900 font-bold" : "text-gray-900"
                      }`}>
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-start gap-2 bg-amber-50 rounded-xl p-3 border border-amber-200">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-amber-700 text-xs leading-relaxed">
                    Always include the reference so we can match your transfer to your account.
                  </p>
                </div>
              </div>

              {/* Confirmation note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Transfer Reference / Confirmation *
                </label>
                <textarea
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  rows={3}
                  placeholder="Enter your bank transfer reference, date, and any details to help us match your payment..."
                  className={inputClass}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={payLoading}
                className="w-full text-[#0f2a1e] font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg,#d4a843,#c49a38)",
                  boxShadow: payLoading ? "none" : "0 4px 20px rgba(212,168,67,0.35)",
                }}
              >
                {payLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : "I've Made the Transfer →"}
              </button>
            </div>
          </div>

          <p className="text-white/25 text-xs text-center">
            Your investment is protected by the Musharakah Partnership Agreement you signed.
          </p>
        </div>
      </div>
    </div>
  );
}
