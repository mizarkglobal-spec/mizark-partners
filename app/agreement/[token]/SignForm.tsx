"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  token: string;
  partnerName: string;
  paymentToken: string | null;
}

export default function AgreementSignForm({ token, partnerName, paymentToken }: Props) {
  const router = useRouter();
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleSign() {
    setError("");
    if (!signedName.trim()) {
      setError("Please type your full legal name to sign");
      return;
    }
    if (signedName.trim().toLowerCase() !== partnerName.toLowerCase()) {
      setError(`Your typed name must exactly match your registered name: "${partnerName}"`);
      return;
    }
    if (!agreed) {
      setError("Please confirm that you have read and agree to the agreement");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/agreement/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signed_name: signedName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sign");
      const pt = data.payment_token ?? paymentToken;
      if (pt) {
        router.push(`/payment/${pt}`);
      } else {
        router.push("/");
      }
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#40916c]/30 focus:border-[#40916c] transition-colors";

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-8 pt-8 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#d4a843,#c49a38)" }}
          >
            <svg className="w-5 h-5 text-[#0f2a1e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900" style={{ letterSpacing: "-0.01em" }}>
              Your Digital Signature
            </h3>
            <p className="text-gray-400 text-xs">Sign to confirm your acceptance, then proceed to payment</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-7 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Type your full legal name exactly as registered *
          </label>
          <input
            type="text"
            value={signedName}
            onChange={(e) => setSignedName(e.target.value)}
            placeholder={partnerName}
            className={inputClass + " font-mono tracking-wide"}
            autoComplete="off"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Must match exactly: <span className="text-gray-600 font-medium">"{partnerName}"</span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Signing</label>
          <input
            type="text"
            value={today}
            disabled
            className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
          />
        </div>

        <button
          onClick={() => setAgreed(!agreed)}
          className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
            agreed ? "border-[#40916c] bg-[#f0fdf4]" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all ${
                agreed ? "bg-[#40916c] border-[#40916c]" : "border-gray-300 bg-white"
              }`}
            >
              {agreed && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-sm leading-relaxed ${agreed ? "text-[#166534]" : "text-gray-700"}`}>
              I have read and understood this Musharakah Partnership Agreement in its entirety.
              I agree to be bound by its terms and conditions. I confirm that my investment funds
              are from a halal source and that I accept the 3-year lock-in and investment risks.
            </span>
          </div>
        </button>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <button
          onClick={handleSign}
          disabled={loading}
          className="w-full text-[#0f2a1e] font-bold py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg,#d4a843,#c49a38)",
            boxShadow: loading ? "none" : "0 4px 20px rgba(212,168,67,0.3)",
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing...
            </span>
          ) : "Sign & Proceed to Payment →"}
        </button>

        <p className="text-xs text-gray-400 text-center leading-relaxed">
          Your signature is recorded with an IP address and timestamp.
        </p>
      </div>
    </div>
  );
}
