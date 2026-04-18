import Link from "next/link";
import MizarkLogo from "@/components/MizarkLogo";

export default function PendingPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, #081a11, #0f2a1e, #132d20)" }}
    >
      {/* Subtle radial glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 600,
          height: 400,
          background: "radial-gradient(ellipse at center, rgba(212,168,67,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-md w-full relative">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <MizarkLogo subtitle="Partner Portal" theme="dark" />
        </div>

        <div className="bg-[#1a3a2a] border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
          {/* Icon */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "rgba(212,168,67,0.1)", border: "2px solid rgba(212,168,67,0.2)" }}
            >
              <svg className="w-9 h-9 text-[#d4a843]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {/* Pulse ring */}
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: "rgba(212,168,67,0.08)" }}
            />
          </div>

          <div className="inline-block bg-[#d4a843]/10 border border-[#d4a843]/20 rounded-full px-4 py-1 text-[#d4a843] text-xs uppercase tracking-widest mb-4">
            Under Review
          </div>

          <h2
            className="text-2xl font-bold text-white mb-3"
            style={{ letterSpacing: "-0.02em" }}
          >
            Account Pending Activation
          </h2>
          <p className="text-white/50 mb-8 leading-relaxed text-sm">
            Your application is being reviewed. Your partner account will be fully
            activated once your payment has been verified and onboarding is complete.
          </p>

          {/* Steps */}
          <div className="bg-[#0f2a1e] rounded-2xl p-5 mb-8 border border-white/5 text-left">
            <div className="text-white/60 text-xs uppercase tracking-wider mb-4 font-medium">What happens next</div>
            <div className="space-y-3">
              {[
                { step: "01", label: "We verify your payment", sub: "Usually within 1 business day" },
                { step: "02", label: "Partner account activated", sub: "We set up your equity record" },
                { step: "03", label: "Welcome email with dashboard access", sub: "Start tracking your investment" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1a3a2a] border border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#74c69d] text-xs font-bold">{item.step}</span>
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{item.label}</div>
                    <div className="text-white/40 text-xs mt-0.5">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <p className="text-white/40 text-sm mb-1">Questions? Reach us at</p>
            <a
              href="mailto:partners@mizarkglobal.com"
              className="text-[#74c69d] hover:text-[#5dbc89] font-medium text-sm transition-colors"
            >
              partners@mizarkglobal.com
            </a>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-white/30 hover:text-white/60 text-sm transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
