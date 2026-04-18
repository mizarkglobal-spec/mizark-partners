"use client";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setSent(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, #081a11, #0f2a1e, #132d20)" }}
    >
      {/* Subtle glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 700,
          height: 400,
          background: "radial-gradient(ellipse at center, rgba(116,198,157,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#d4a843,#c49a38)", boxShadow: "0 4px 16px rgba(212,168,67,0.3)" }}
          >
            <span className="text-[#0f2a1e] font-black text-base">M</span>
          </div>
          <div>
            <div className="text-white font-bold text-xl leading-none tracking-tight">Mizark Global</div>
            <div className="text-[#74c69d] text-xs uppercase tracking-widest mt-0.5">Partner Portal</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {!sent ? (
            <>
              <h1
                className="text-2xl font-bold text-gray-900 mb-1"
                style={{ letterSpacing: "-0.02em" }}
              >
                Partner Sign In
              </h1>
              <p className="text-gray-400 text-sm mb-7">
                Enter your email to receive a secure login link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916c]/30 focus:border-[#40916c] transition-colors"
                    autoFocus
                    required
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
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0f2a1e] hover:bg-[#1a3a2a] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors"
                  style={{ boxShadow: "0 4px 16px rgba(15,42,30,0.25)" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending link...
                    </span>
                  ) : "Send Login Link →"}
                </button>
              </form>

              <div className="mt-7 pt-6 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400 mb-2">Not a partner yet?</p>
                <Link href="/apply" className="text-[#40916c] text-sm font-semibold hover:underline">
                  Apply to Partner →
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(116,198,157,0.12)", border: "2px solid rgba(116,198,157,0.2)" }}
              >
                <svg className="w-7 h-7 text-[#40916c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2
                className="text-xl font-bold text-gray-900 mb-2"
                style={{ letterSpacing: "-0.02em" }}
              >
                Check your inbox
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                We sent a secure login link to{" "}
                <strong className="text-gray-700">{email}</strong>.
                Click the link to sign in — it expires in 1 hour.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="mt-5 text-sm text-[#40916c] hover:underline"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-center gap-5">
          <Link href="/admin" className="text-white/25 hover:text-white/50 text-xs transition-colors">
            Admin Login
          </Link>
          <span className="text-white/15 text-xs">·</span>
          <Link href="/" className="text-white/25 hover:text-white/50 text-xs transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
