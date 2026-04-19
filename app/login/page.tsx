"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import MizarkLogo from "@/components/MizarkLogo";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setError("");
    setLoading(true);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${appUrl}/api/auth/callback` },
    });
    if (oauthErr) {
      setError(oauthErr.message);
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
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

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInErr) throw signInErr;
      window.location.href = "/dashboard";
    } catch (e: any) {
      setError(e.message ?? "Invalid email or password");
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
        <div className="flex justify-center mb-8">
          <MizarkLogo subtitle="Partner Portal" theme="dark" />
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {!sent ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ letterSpacing: "-0.02em" }}>
                Partner Sign In
              </h1>
              <p className="text-gray-400 text-sm mb-6">
                {mode === "magic" ? "Enter your email to receive a secure login link." : "Sign in with your email and password."}
              </p>

              {/* Mode toggle */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
                <button
                  type="button"
                  onClick={() => { setMode("magic"); setError(""); }}
                  className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${mode === "magic" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Email Link
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("password"); setError(""); }}
                  className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${mode === "password" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Password
                </button>
              </div>

              <form onSubmit={mode === "magic" ? handleMagicLink : handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Email Address</label>
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

                {mode === "password" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916c]/30 focus:border-[#40916c] transition-colors"
                      required
                    />
                  </div>
                )}

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
                      {mode === "magic" ? "Sending link..." : "Signing in..."}
                    </span>
                  ) : mode === "magic" ? "Send Login Link →" : "Sign In →"}
                </button>
              </form>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-300">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="mt-4 w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
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
