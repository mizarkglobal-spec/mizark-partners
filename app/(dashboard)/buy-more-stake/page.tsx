"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const POOL = 20_000_000;
const EQUITY_OFFERED = 20;

function equityFor(amount: number) {
  return (amount / POOL) * EQUITY_OFFERED;
}

const TIERS = [
  { label: "₦500K", amount: 500_000 },
  { label: "₦1M", amount: 1_000_000 },
  { label: "₦2M", amount: 2_000_000 },
  { label: "₦3M", amount: 3_000_000 },
  { label: "₦5M", amount: 5_000_000 },
];

export default function BuyMoreStakePage() {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(500_000);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const selectedAmount = useCustom ? (Number(customAmount.replace(/,/g, "")) || 0) : amount;
  const additionalEquity = equityFor(selectedAmount);

  async function handleSubmit() {
    setError("");
    if (selectedAmount < 100_000) {
      setError("Minimum additional investment is ₦100,000");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/stake-increase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ additional_amount: selectedAmount, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="p-6 sm:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl shadow-sm p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-[#f0fdf4] border-2 border-[#bbf7d0] flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-[#40916c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="inline-block bg-[#f0fdf4] border border-[#bbf7d0] rounded-full px-4 py-1 text-[#40916c] text-xs uppercase tracking-widest mb-4 font-semibold">
            Request Submitted
          </div>
          <h2 className="text-xl font-bold text-[#111827] mb-3">JazakAllah Khair!</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Your stake increase request has been received. Mizark Global will review it and reach out within 1–2 business days with next steps and payment instructions.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-3 rounded-xl bg-[#0f2a1e] text-white font-semibold text-sm hover:bg-[#1a3a2a] transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-2xl">
      <div>
        <div className="inline-flex items-center gap-2 bg-[#f0fdf4] border border-[#bbf7d0] rounded-full px-4 py-1.5 mb-4">
          <span className="text-[#40916c] text-xs font-semibold uppercase tracking-widest">Existing Partner</span>
        </div>
        <h1 className="text-2xl font-bold text-[#111827] mb-1">Increase Your Stake</h1>
        <p className="text-gray-500 text-sm">
          As an existing partner, you can request to increase your equity stake. Your request will be reviewed and a new agreement will be issued.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <h3 className="text-[#111827] font-semibold text-sm mb-4">How Stake Increases Work</h3>
        <div className="space-y-3">
          {[
            { step: "01", title: "Submit request", desc: "Choose an amount and send your request. We'll review it promptly." },
            { step: "02", title: "New agreement issued", desc: "A supplementary Musharakah agreement is prepared for your additional stake." },
            { step: "03", title: "Sign & pay", desc: "Sign the new agreement and complete payment. Your equity is updated." },
            { step: "04", title: "Dashboard updated", desc: "Your combined equity stake reflects immediately in your dashboard." },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center flex-shrink-0">
                <span className="text-[#40916c] text-xs font-bold">{item.step}</span>
              </div>
              <div>
                <div className="text-[#111827] text-sm font-medium">{item.title}</div>
                <div className="text-gray-400 text-xs">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Amount Selection */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
        <h3 className="text-[#111827] font-semibold">Select Additional Investment</h3>

        {/* Preset tiers */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {TIERS.map((tier) => (
            <button
              key={tier.amount}
              onClick={() => { setAmount(tier.amount); setUseCustom(false); }}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                !useCustom && amount === tier.amount
                  ? "border-[#40916c] bg-[#f0fdf4] text-[#40916c]"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div>
          <button
            onClick={() => setUseCustom(!useCustom)}
            className={`text-xs font-medium mb-2 ${useCustom ? "text-[#40916c]" : "text-gray-400 hover:text-gray-600"}`}
          >
            {useCustom ? "✓ Custom amount" : "+ Enter custom amount"}
          </button>
          {useCustom && (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
              <input
                type="text"
                inputMode="numeric"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9,]/g, ""))}
                placeholder="e.g. 750,000"
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#40916c]/30 focus:border-[#40916c]"
              />
            </div>
          )}
        </div>

        {/* Equity preview */}
        {selectedAmount >= 100_000 && (
          <div className="bg-[#f0fdf4] border border-[#d1fae5] rounded-2xl p-4">
            <div className="text-[#065f46] text-xs uppercase tracking-wide font-semibold mb-3">Additional Equity Preview</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 text-xs mb-1">Additional Investment</div>
                <div className="text-[#d4a843] font-bold text-lg">
                  ₦{selectedAmount.toLocaleString("en-NG")}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Additional Equity</div>
                <div className="text-[#40916c] font-bold text-lg">
                  +{additionalEquity.toFixed(4)}%
                </div>
              </div>
            </div>
            <p className="text-[#065f46]/60 text-xs mt-3">
              Your total equity will increase by this amount upon payment confirmation.
            </p>
          </div>
        )}

        {/* Optional message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Message to Mizark Global <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Any context, questions, or preferred payment method..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#40916c]/30 focus:border-[#40916c] resize-none"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || selectedAmount < 100_000}
          className="w-full py-4 rounded-2xl bg-[#0f2a1e] hover:bg-[#1a3a2a] disabled:opacity-40 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Submitting...
            </>
          ) : "Submit Stake Increase Request →"}
        </button>

        <p className="text-xs text-gray-400 text-center">
          This is a request only. No payment is taken until a new agreement is signed.
        </p>
      </div>
    </div>
  );
}
