import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, #081a11, #0f2a1e, #132d20)" }}
    >
      <div className="max-w-md w-full">
        <div
          className="rounded-3xl p-10 text-center border"
          style={{ background: "#1a3a2a", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(116,198,157,0.15)", border: "2px solid rgba(116,198,157,0.25)" }}
          >
            <svg className="w-10 h-10 text-[#74c69d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="inline-block bg-[#74c69d]/10 border border-[#74c69d]/20 rounded-full px-4 py-1 text-[#74c69d] text-xs uppercase tracking-widest mb-4">
            Payment Received
          </div>

          <h2
            className="text-2xl font-bold text-white mb-3"
            style={{ letterSpacing: "-0.02em" }}
          >
            Alhamdulillah!
          </h2>
          <p className="text-white/50 leading-relaxed text-sm mb-8">
            Your payment has been received and is being verified. We will activate your partner
            account within 1 business day and send you a welcome email with dashboard access.
          </p>

          <div className="bg-[#0f2a1e] rounded-2xl p-5 mb-8 border border-white/5">
            <div className="space-y-2">
              {[
                { step: "01", label: "Payment verified", sub: "Usually within 1 business day" },
                { step: "02", label: "Account activated", sub: "We set up your equity record" },
                { step: "03", label: "Welcome email sent", sub: "With your dashboard login link" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#1a3a2a] border border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#74c69d] text-xs font-bold">{item.step}</span>
                  </div>
                  <div className="text-left">
                    <div className="text-white text-sm font-medium">{item.label}</div>
                    <div className="text-white/30 text-xs">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link href="/login" className="text-[#74c69d] text-sm hover:underline">
            Sign in to your dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
