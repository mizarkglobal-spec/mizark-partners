"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MizarkLogo from "@/components/MizarkLogo";

export default function SetupAccountPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep]         = useState<"choose" | "password" | "done">("choose");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
      } else {
        setUserEmail(data.user.email ?? "");
      }
    });
  }, []);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;
      setStep("done");
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${appUrl}/api/auth/callback?next=/dashboard` },
    });
    if (oauthErr) {
      setError(oauthErr.message);
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, #081a11, #0f2a1e, #132d20)" }}
    >
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 700, height: 400,
          background: "radial-gradient(ellipse at center, rgba(116,198,157,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <MizarkLogo subtitle="Partner Portal" theme="dark" />
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">

          {step === "done" ? (
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(116,198,157,0.12)", border: "2px solid rgba(116,198,157,0.2)" }}
              >
                <svg className="w-7 h-7 text-[#40916c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ letterSpacing: "-0.02em" }}>
                Account ready!
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Your password has been set. You can now sign in with your email and password anytime.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-[#0f2a1e] hover:bg-[#1a3a2a] text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                Go to Dashboard →
              </button>
            </div>
          ) : step === "password" ? (
            <>
              <button
                onClick={() => setStep("choose")}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ letterSpacing: "-0.02em" }}>
                Create a password
              </h1>
              <p className="text-gray-400 text-sm mb-7">
                For <strong className="text-gray-600">{userEmail}</strong>
              </p>
              <form onSubmit={handlePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916c]/30 focus:border-[#40916c] transition-colors"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Confirm password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916c]/30 focus:border-[#40916c] transition-colors"
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
                      Setting password...
                    </span>
                  ) : "Set Password"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ letterSpacing: "-0.02em" }}>
                Set up your account
              </h1>
              <p className="text-gray-400 text-sm mb-7">
                Choose how you'd like to sign in to your partner dashboard.
              </p>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Password option */}
                <button
                  onClick={() => setStep("password")}
                  className="w-full flex items-center gap-4 border-2 border-gray-200 hover:border-[#40916c] rounded-2xl px-5 py-4 transition-colors group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0f2a1e]/8 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0f2a1e]/12 transition-colors">
                    <svg className="w-5 h-5 text-[#0f2a1e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Create a password</div>
                    <div className="text-gray-400 text-xs mt-0.5">Sign in with your email and password</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-[#40916c] ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Google option */}
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center gap-4 border-2 border-gray-200 hover:border-[#40916c] rounded-2xl px-5 py-4 transition-colors group text-left disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Continue with Google</div>
                    <div className="text-gray-400 text-xs mt-0.5">Sign in using your Google account</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-[#40916c] ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Skip for now, go to dashboard →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
