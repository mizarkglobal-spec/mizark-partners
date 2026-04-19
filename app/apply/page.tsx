"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import MizarkLogo from "@/components/MizarkLogo";

type Step1 = { name: string; email: string; phone: string; country: string; state: string };
type Step2 = {
  amount_intent: number | "";
  amount_custom: string;
  prior_experience: boolean;
  referral_source: string;
};
type Step3 = { commit_lock: boolean; commit_risk: boolean; commit_halal: boolean };

const AMOUNTS = [
  { label: "₦1,000,000", value: 1_000_000 },
  { label: "₦2,000,000", value: 2_000_000 },
  { label: "₦5,000,000", value: 5_000_000 },
  { label: "₦10,000,000", value: 10_000_000 },
  { label: "₦20,000,000", value: 20_000_000 },
  { label: "Other", value: -1 },
];

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const COUNTRIES = [
  { value: "Nigeria", label: "🇳🇬 Nigeria" },
  { value: "United Kingdom", label: "🇬🇧 United Kingdom" },
  { value: "United States", label: "🇺🇸 United States" },
  { value: "Canada", label: "🇨🇦 Canada" },
  { value: "Ghana", label: "🇬🇭 Ghana" },
  { value: "Kenya", label: "🇰🇪 Kenya" },
  { value: "South Africa", label: "🇿🇦 South Africa" },
  { value: "UAE", label: "🇦🇪 UAE" },
  { value: "Other", label: "🌍 Other" },
];

const MIN_INVESTMENT = 1_000_000;

export default function ApplyPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [totalPool, setTotalPool] = useState(20_000_000);
  const [totalEquityPct, setTotalEquityPct] = useState(20);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        setTotalPool(d.total_pool_amount ?? 20_000_000);
        setTotalEquityPct(d.total_equity_pct ?? 20);
      })
      .catch(() => {});
  }, []);

  function equityForAmount(amount: number) {
    return ((amount / totalPool) * totalEquityPct).toFixed(3);
  }

  const [s1, setS1] = useState<Step1>({ name: "", email: "", phone: "", country: "Nigeria", state: "" });
  const [s2, setS2] = useState<Step2>({
    amount_intent: "",
    amount_custom: "",
    prior_experience: false,
    referral_source: "",
  });
  const [s3, setS3] = useState<Step3>({ commit_lock: false, commit_risk: false, commit_halal: false });

  function resolvedAmount(): number {
    if (s2.amount_intent === -1) return parseInt(s2.amount_custom.replace(/\D/g, "")) || 0;
    return s2.amount_intent || 0;
  }

  function handlePhone(raw: string) {
    // Allow only digits, +, spaces, hyphens, parentheses
    const cleaned = raw.replace(/[^\d+\s\-()]/g, "");
    setS1({ ...s1, phone: cleaned });
  }

  function locationString() {
    if (s1.country === "Nigeria" && s1.state) return `${s1.state}, Nigeria`;
    if (s1.country && s1.state) return `${s1.state}, ${s1.country}`;
    return s1.country || "";
  }

  function validateStep1() {
    if (!s1.name.trim()) return "Full name is required";
    if (!s1.email.trim() || !s1.email.includes("@")) return "Valid email is required";
    if (!s1.phone.trim() || s1.phone.replace(/\D/g, "").length < 7) return "Valid phone number is required";
    if (!s1.country) return "Country is required";
    if (!s1.state.trim()) return s1.country === "Nigeria" ? "State is required" : "City/Region is required";
    return "";
  }

  function validateStep2() {
    if (!s2.amount_intent && s2.amount_intent !== 0) return "Please select an investment amount";
    const amt = resolvedAmount();
    if (amt < MIN_INVESTMENT) return "Minimum investment is ₦1,000,000";
    return "";
  }

  function validateStep3() {
    if (!s3.commit_lock) return "Please confirm you accept the 3-year lock-in";
    if (!s3.commit_risk) return "Please confirm you understand returns are not guaranteed";
    if (!s3.commit_halal) return "Please confirm your funds are from a halal source";
    return "";
  }

  function handleNext() {
    setError("");
    let err = "";
    if (step === 1) err = validateStep1();
    if (step === 2) err = validateStep2();
    if (err) { setError(err); return; }
    setStep(step + 1);
  }

  async function handleSubmit() {
    const err = validateStep3();
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: s1.name,
          email: s1.email,
          phone: s1.phone,
          location: locationString(),
          amount_intent: resolvedAmount(),
          motivation: "",
          prior_experience: s2.prior_experience,
          referral_source: s2.referral_source,
          commit_lock: s3.commit_lock,
          commit_risk: s3.commit_risk,
          commit_halal: s3.commit_halal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(160deg, #081a11, #0f2a1e, #132d20)" }}
      >
        <div className="max-w-md w-full">
          <div className="bg-[#1a3a2a] border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
            <div
              className="w-18 h-18 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(116,198,157,0.15)", border: "2px solid rgba(116,198,157,0.3)" }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(116,198,157,0.15)" }}>
                <svg className="w-8 h-8 text-[#74c69d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="inline-block bg-[#74c69d]/10 border border-[#74c69d]/20 rounded-full px-4 py-1 text-[#74c69d] text-xs uppercase tracking-widest mb-4">
              Application Received
            </div>

            <h2 className="text-2xl font-bold text-white mb-3" style={{ letterSpacing: "-0.02em" }}>
              JazakAllah Khair, {s1.name.split(" ")[0]}
            </h2>
            <p className="text-white/50 mb-8 leading-relaxed text-sm">
              Your application has been received. We will review it within 2–3 business days
              and reach out at <span className="text-white/70">{s1.email}</span>.
            </p>

            <div className="bg-[#0f2a1e] rounded-2xl p-5 mb-8 border border-white/5">
              <div className="text-white/40 text-xs uppercase tracking-wider mb-3">Your Intent</div>
              <div className="text-[#d4a843] font-bold text-2xl" style={{ letterSpacing: "-0.02em" }}>
                ₦{resolvedAmount().toLocaleString("en-NG")}
              </div>
              <div className="text-[#74c69d] text-sm mt-1">
                ≈ {equityForAmount(resolvedAmount())}% equity stake in Mizark Global
              </div>
            </div>

            <Link href="/" className="text-white/40 hover:text-white/70 text-sm transition-colors">
              ← Return to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { n: 1, label: "Personal Info" },
    { n: 2, label: "Investment" },
    { n: 3, label: "Commitments" },
  ];

  const inputClass = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#40916c]/40 focus:border-[#40916c] transition-colors";
  const labelClass = "block text-sm font-medium text-gray-600 mb-1.5";
  const selectClass = inputClass + " cursor-pointer appearance-none";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #081a11, #0f2a1e, #132d20)" }}
    >
      {/* Nav */}
      <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-white/[0.07]">
        <Link href="/"><MizarkLogo size="sm" theme="dark" /></Link>
        <Link href="/" className="text-white/40 hover:text-white/70 text-sm transition-colors">← Back</Link>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-[#d4a843]/10 border border-[#d4a843]/20 rounded-full px-4 py-1 text-[#d4a843] text-xs uppercase tracking-widest mb-4">
              Partner Application
            </div>
            <h1 className="text-3xl font-bold text-white" style={{ letterSpacing: "-0.03em" }}>
              Apply for Equity Partnership
            </h1>
            <p className="text-white/40 text-sm mt-2">Takes about 3 minutes. No commitment until you sign.</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {steps.map((s, idx) => (
              <div key={s.n} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step > s.n ? "bg-[#74c69d] text-[#0f2a1e]"
                        : step === s.n ? "bg-[#d4a843] text-[#0f2a1e]"
                        : "bg-white/10 text-white/30"
                    }`}
                    style={step === s.n ? { boxShadow: "0 0 0 4px rgba(212,168,67,0.2)" } : {}}
                  >
                    {step > s.n ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.n}
                  </div>
                  <span className={`text-[11px] mt-1.5 hidden sm:block transition-colors ${step === s.n ? "text-white" : "text-white/30"}`}>
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-16 sm:w-24 h-px mx-2 transition-colors ${step > s.n ? "bg-[#74c69d]/50" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8">

              {/* ── Step 1: Personal Info ── */}
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ letterSpacing: "-0.02em" }}>
                    Personal Information
                  </h2>
                  <p className="text-gray-400 text-sm mb-6">Tell us a bit about yourself.</p>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Full Name *</label>
                      <input
                        type="text"
                        value={s1.name}
                        onChange={(e) => setS1({ ...s1, name: e.target.value })}
                        placeholder="Abubakar Ibrahim"
                        className={inputClass}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Email Address *</label>
                      <input
                        type="email"
                        value={s1.email}
                        onChange={(e) => setS1({ ...s1, email: e.target.value })}
                        placeholder="you@example.com"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Phone Number *</label>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={s1.phone}
                        onChange={(e) => handlePhone(e.target.value)}
                        placeholder="+234 801 234 5678"
                        className={inputClass}
                        maxLength={20}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Country *</label>
                        <div className="relative">
                          <select
                            value={s1.country}
                            onChange={(e) => setS1({ ...s1, country: e.target.value, state: "" })}
                            className={selectClass}
                          >
                            {COUNTRIES.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>{s1.country === "Nigeria" ? "State *" : "City / Region *"}</label>
                        {s1.country === "Nigeria" ? (
                          <div className="relative">
                            <select
                              value={s1.state}
                              onChange={(e) => setS1({ ...s1, state: e.target.value })}
                              className={selectClass}
                            >
                              <option value="">Select state</option>
                              {NIGERIAN_STATES.map((st) => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={s1.state}
                            onChange={(e) => setS1({ ...s1, state: e.target.value })}
                            placeholder="e.g. London"
                            className={inputClass}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 2: Investment Intent ── */}
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ letterSpacing: "-0.02em" }}>
                    Investment Intent
                  </h2>
                  <p className="text-gray-400 text-sm mb-6">How much are you planning to invest? Min ₦1,000,000.</p>
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>Investment Amount *</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {AMOUNTS.map((a) => (
                          <button
                            key={a.value}
                            onClick={() => setS2({ ...s2, amount_intent: a.value })}
                            className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                              s2.amount_intent === a.value
                                ? "bg-[#0f2a1e] text-white border-[#0f2a1e] shadow-md"
                                : "bg-white text-gray-700 border-gray-200 hover:border-[#40916c]/50 hover:bg-[#f0fdf4]"
                            }`}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                      {s2.amount_intent === -1 && (
                        <div className="mt-2">
                          <input
                            type="number"
                            value={s2.amount_custom}
                            onChange={(e) => setS2({ ...s2, amount_custom: e.target.value })}
                            placeholder="Enter amount in NGN (min ₦1,000,000)"
                            className={inputClass + " mt-1"}
                            min={1_000_000}
                            max={20_000_000}
                          />
                        </div>
                      )}
                      {resolvedAmount() >= MIN_INVESTMENT && (
                        <div className="mt-3 flex items-center gap-2 bg-[#f0fdf4] rounded-xl px-4 py-2.5 border border-[#bbf7d0]">
                          <svg className="w-4 h-4 text-[#40916c] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-[#166534] font-medium">
                            ≈ {equityForAmount(resolvedAmount())}% equity stake in Mizark Global
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Prior investment experience?</label>
                        <div className="flex gap-2 mt-1">
                          {[true, false].map((v) => (
                            <button
                              key={String(v)}
                              onClick={() => setS2({ ...s2, prior_experience: v })}
                              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                                s2.prior_experience === v
                                  ? "bg-[#0f2a1e] text-white border-[#0f2a1e]"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              {v ? "Yes" : "No"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>How did you hear about this?</label>
                        <div className="relative mt-1">
                          <select
                            value={s2.referral_source}
                            onChange={(e) => setS2({ ...s2, referral_source: e.target.value })}
                            className={selectClass}
                          >
                            <option value="">Select source</option>
                            <option value="referral">Friend / Referral</option>
                            <option value="social_media">Social Media</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="email">Email</option>
                            <option value="other">Other</option>
                          </select>
                          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 3: Commitments ── */}
              {step === 3 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ letterSpacing: "-0.02em" }}>
                    Confirm Your Commitments
                  </h2>
                  <p className="text-gray-400 text-sm mb-6">Read and tick each commitment before submitting.</p>
                  <div className="space-y-3">
                    {[
                      {
                        key: "commit_lock" as const,
                        icon: (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        ),
                        title: "3-Year Lock-in Period",
                        desc: "I understand and accept that this is a 3-year partnership. I cannot withdraw my capital before the term ends except in extraordinary circumstances agreed upon by all parties.",
                      },
                      {
                        key: "commit_risk" as const,
                        icon: (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        ),
                        title: "Returns Are Not Guaranteed",
                        desc: "I understand that distributions depend on business profits. There are quarters where no distribution may be paid, and my capital is at risk.",
                      },
                      {
                        key: "commit_halal" as const,
                        icon: (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        ),
                        title: "Halal Source of Funds",
                        desc: "I confirm that the funds I intend to invest are from a halal (permissible) source. This is a Shariah-compliant Musharakah partnership.",
                      },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          s3[item.key]
                            ? "border-[#40916c] bg-[#f0fdf4]"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {/* Actual checkbox (visually hidden, replaced by custom box) */}
                        <input
                          type="checkbox"
                          checked={s3[item.key]}
                          onChange={() => setS3({ ...s3, [item.key]: !s3[item.key] })}
                          className="sr-only"
                        />
                        {/* Custom checkbox */}
                        <div
                          className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                            s3[item.key]
                              ? "bg-[#40916c] border-[#40916c]"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          {s3[item.key] && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        {/* Icon + text */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                            s3[item.key] ? "bg-[#40916c] text-white" : "bg-gray-100 text-gray-400"
                          }`}>
                            {item.icon}
                          </div>
                          <div>
                            <div className={`font-semibold text-sm mb-0.5 ${s3[item.key] ? "text-[#166534]" : "text-gray-900"}`}>
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-8 pb-8 flex gap-3">
              {step > 1 && (
                <button
                  onClick={() => { setStep(step - 1); setError(""); }}
                  className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  ← Back
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 bg-[#0f2a1e] hover:bg-[#1a3a2a] text-white py-3 rounded-xl text-sm font-bold transition-colors"
                  style={{ boxShadow: "0 4px 16px rgba(15,42,30,0.3)" }}
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 text-[#0f2a1e] py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg,#d4a843,#c49a38)",
                    boxShadow: loading ? "none" : "0 4px 20px rgba(212,168,67,0.35)",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : "Submit Application →"}
                </button>
              )}
            </div>
          </div>

          <p className="text-white/25 text-xs text-center mt-6">
            Your information is private and will only be used for the purpose of this application.
          </p>
        </div>
      </div>
    </div>
  );
}
