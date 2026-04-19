"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MizarkLogo from "@/components/MizarkLogo";

const NIGERIAN_BANKS = [
  "Access Bank", "Citibank Nigeria", "Ecobank Nigeria", "Fidelity Bank",
  "First Bank of Nigeria", "First City Monument Bank (FCMB)",
  "Guaranty Trust Bank (GTBank)", "Heritage Bank", "Jaiz Bank",
  "Keystone Bank", "Lotus Bank", "Moniepoint", "Opay", "Palmpay",
  "Kuda Bank", "Polaris Bank", "Providus Bank", "Stanbic IBTC Bank",
  "Sterling Bank", "Union Bank", "United Bank for Africa (UBA)",
  "Wema Bank", "Zenith Bank", "Other",
];

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue",
  "Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu",
  "FCT (Abuja)","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina",
  "Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo",
  "Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
];

type KYCData = {
  // Step 1 — Personal
  address_line1: string;
  address_city: string;
  address_state: string;
  address_country: string;
  address_postal: string;
  date_of_birth: string;
  nationality: string;
  whatsapp_number: string;
  // Step 2 — Identity
  id_type: string;
  id_number: string;
  // Step 3 — Bank
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  bank_account_type: string;
  // Step 4 — Next of Kin
  nok_name: string;
  nok_relationship: string;
  nok_phone: string;
  nok_email: string;
  // Step 5 — Additional
  occupation: string;
  employer: string;
  source_of_funds: string;
};

const EMPTY: KYCData = {
  address_line1: "", address_city: "", address_state: "", address_country: "Nigeria",
  address_postal: "", date_of_birth: "", nationality: "Nigerian", whatsapp_number: "",
  id_type: "", id_number: "",
  bank_name: "", bank_account_number: "", bank_account_name: "", bank_account_type: "savings",
  nok_name: "", nok_relationship: "", nok_phone: "", nok_email: "",
  occupation: "", employer: "", source_of_funds: "",
};

const steps = [
  { n: 1, label: "Personal Details" },
  { n: 2, label: "Identity" },
  { n: 3, label: "Bank Details" },
  { n: 4, label: "Next of Kin" },
  { n: 5, label: "Background" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<KYCData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/partner/onboarding")
      .then((r) => r.json())
      .then((d) => {
        if (d.onboarding_completed) router.replace("/dashboard");
        if (d.kyc_data) setData({ ...EMPTY, ...d.kyc_data });
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  function set<K extends keyof KYCData>(key: K, val: KYCData[K]) {
    setData((prev) => ({ ...prev, [key]: val }));
  }

  function handlePhone(raw: string, key: keyof KYCData) {
    set(key, raw.replace(/[^\d+\s\-()]/g, "") as any);
  }

  function validate(): string {
    if (step === 1) {
      if (!data.address_line1.trim()) return "Street address is required";
      if (!data.address_city.trim()) return "City is required";
      if (!data.date_of_birth) return "Date of birth is required";
      if (!data.nationality.trim()) return "Nationality is required";
    }
    if (step === 2) {
      if (!data.id_type) return "Please select an ID type";
      if (!data.id_number.trim()) return "ID number is required";
    }
    if (step === 3) {
      if (!data.bank_name) return "Please select your bank";
      if (data.bank_account_number.replace(/\D/g, "").length !== 10) return "Account number must be 10 digits (NUBAN)";
      if (!data.bank_account_name.trim()) return "Account name is required";
    }
    if (step === 4) {
      if (!data.nok_name.trim()) return "Next of kin name is required";
      if (!data.nok_relationship.trim()) return "Relationship is required";
      if (!data.nok_phone.trim()) return "Next of kin phone is required";
    }
    if (step === 5) {
      if (!data.occupation.trim()) return "Occupation is required";
      if (!data.source_of_funds) return "Please select your source of funds";
    }
    return "";
  }

  function handleNext() {
    setError("");
    const err = validate();
    if (err) { setError(err); return; }
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setError("");
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/partner/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to save");
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#40916c]/40 focus:border-[#40916c] transition-colors";
  const labelCls = "block text-sm font-medium text-gray-600 mb-1.5";
  const selectCls = inputCls + " cursor-pointer appearance-none";

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg,#081a11,#0f2a1e)" }}>
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(160deg,#081a11,#0f2a1e)" }}>
        <div className="max-w-md w-full bg-[#1a3a2a] border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(116,198,157,0.15)", border: "2px solid rgba(116,198,157,0.3)" }}>
            <svg className="w-8 h-8 text-[#74c69d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="inline-block bg-[#74c69d]/10 border border-[#74c69d]/20 rounded-full px-4 py-1 text-[#74c69d] text-xs uppercase tracking-widest mb-4">
            Earnings Active
          </div>
          <h2 className="text-2xl font-bold text-white mb-3" style={{ letterSpacing: "-0.02em" }}>
            You're all set!
          </h2>
          <p className="text-white/50 mb-8 text-sm leading-relaxed">
            Your profile is complete. Quarterly distributions will be sent directly to your registered bank account.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-3 rounded-xl font-bold text-sm text-[#0f2a1e] transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#d4a843,#c49a38)", boxShadow: "0 4px 20px rgba(212,168,67,0.3)" }}
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg,#081a11,#0f2a1e,#132d20)" }}>
      {/* Nav */}
      <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-white/[0.07]">
        <Link href="/dashboard"><MizarkLogo size="sm" theme="dark" /></Link>
        <Link href="/dashboard" className="text-white/40 hover:text-white/70 text-sm transition-colors">Skip for now →</Link>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-[#d4a843]/10 border border-[#d4a843]/20 rounded-full px-4 py-1 text-[#d4a843] text-xs uppercase tracking-widest mb-4">
              Partner Onboarding
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ letterSpacing: "-0.03em" }}>
              Activate Your Earnings
            </h1>
            <p className="text-white/40 text-sm mt-2">Complete your profile to receive quarterly distributions.</p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {steps.map((s, idx) => (
              <div key={s.n} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step > s.n ? "bg-[#74c69d] text-[#0f2a1e]"
                        : step === s.n ? "bg-[#d4a843] text-[#0f2a1e]"
                        : "bg-white/10 text-white/30"
                    }`}
                    style={step === s.n ? { boxShadow: "0 0 0 4px rgba(212,168,67,0.2)" } : {}}
                  >
                    {step > s.n
                      ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      : s.n}
                  </div>
                  <span className={`text-[10px] mt-1 hidden sm:block ${step === s.n ? "text-white" : "text-white/25"}`}>
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-10 sm:w-16 h-px mx-1.5 transition-colors ${step > s.n ? "bg-[#74c69d]/50" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-7 sm:p-8">

              {/* ── Step 1: Personal Details ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-0.5" style={{ letterSpacing: "-0.02em" }}>Personal Details</h2>
                    <p className="text-gray-400 text-sm mb-5">Your residential address and personal information.</p>
                  </div>
                  <div>
                    <label className={labelCls}>Street Address *</label>
                    <input type="text" value={data.address_line1} onChange={(e) => set("address_line1", e.target.value)}
                      placeholder="12 Murtala Mohammed Way" className={inputCls} autoFocus />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>City *</label>
                      <input type="text" value={data.address_city} onChange={(e) => set("address_city", e.target.value)}
                        placeholder="Lagos" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>State / Region</label>
                      {data.address_country === "Nigeria" ? (
                        <div className="relative">
                          <select value={data.address_state} onChange={(e) => set("address_state", e.target.value)} className={selectCls}>
                            <option value="">Select state</option>
                            {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      ) : (
                        <input type="text" value={data.address_state} onChange={(e) => set("address_state", e.target.value)}
                          placeholder="Region / Province" className={inputCls} />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Country *</label>
                      <input type="text" value={data.address_country} onChange={(e) => set("address_country", e.target.value)}
                        placeholder="Nigeria" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Postal Code</label>
                      <input type="text" value={data.address_postal} onChange={(e) => set("address_postal", e.target.value)}
                        placeholder="100001" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Date of Birth *</label>
                      <input type="date" value={data.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)}
                        className={inputCls} max={new Date(Date.now() - 18*365.25*24*3600*1000).toISOString().split("T")[0]} />
                    </div>
                    <div>
                      <label className={labelCls}>Nationality *</label>
                      <input type="text" value={data.nationality} onChange={(e) => set("nationality", e.target.value)}
                        placeholder="Nigerian" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>WhatsApp Number <span className="text-gray-400 font-normal">(if different from phone on file)</span></label>
                    <input type="tel" inputMode="tel" value={data.whatsapp_number}
                      onChange={(e) => handlePhone(e.target.value, "whatsapp_number")}
                      placeholder="+234 801 234 5678" className={inputCls} maxLength={20} />
                  </div>
                </div>
              )}

              {/* ── Step 2: Identity ── */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-0.5" style={{ letterSpacing: "-0.02em" }}>Identity Verification</h2>
                    <p className="text-gray-400 text-sm mb-5">Required for KYC compliance and payment processing.</p>
                  </div>
                  <div>
                    <label className={labelCls}>Government ID Type *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "NIN", label: "NIN" },
                        { value: "International Passport", label: "Int'l Passport" },
                        { value: "Driver's Licence", label: "Driver's Licence" },
                        { value: "Voter's Card", label: "Voter's Card" },
                        { value: "National ID Card", label: "National ID" },
                        { value: "Residence Permit", label: "Residence Permit" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => set("id_type", opt.value)}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all text-left ${
                            data.id_type === opt.value
                              ? "bg-[#0f2a1e] text-white border-[#0f2a1e]"
                              : "bg-white text-gray-700 border-gray-200 hover:border-[#40916c]/40"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>ID Number *</label>
                    <input type="text" value={data.id_number} onChange={(e) => set("id_number", e.target.value.toUpperCase())}
                      placeholder={data.id_type === "NIN" ? "12345678901" : data.id_type === "International Passport" ? "A01234567" : "Enter ID number"}
                      className={inputCls} />
                    <p className="text-xs text-gray-400 mt-1">Enter your ID number exactly as it appears on the document.</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-blue-700 text-xs leading-relaxed">
                      <strong>Privacy note:</strong> Your ID details are stored securely and used only for identity verification and payment processing. We do not share this information with third parties.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Step 3: Bank Details ── */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-0.5" style={{ letterSpacing: "-0.02em" }}>Bank Details</h2>
                    <p className="text-gray-400 text-sm mb-5">Where your quarterly distributions will be sent.</p>
                  </div>
                  <div>
                    <label className={labelCls}>Bank Name *</label>
                    <div className="relative">
                      <select value={data.bank_name} onChange={(e) => set("bank_name", e.target.value)} className={selectCls}>
                        <option value="">Select your bank</option>
                        {NIGERIAN_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Account Number (NUBAN) *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={data.bank_account_number}
                      onChange={(e) => set("bank_account_number", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="0123456789"
                      className={inputCls}
                      maxLength={10}
                    />
                    <p className="text-xs text-gray-400 mt-1">{data.bank_account_number.length}/10 digits</p>
                  </div>
                  <div>
                    <label className={labelCls}>Account Name *</label>
                    <input type="text" value={data.bank_account_name} onChange={(e) => set("bank_account_name", e.target.value.toUpperCase())}
                      placeholder="IBRAHIM ABUBAKAR" className={inputCls} />
                    <p className="text-xs text-gray-400 mt-1">Enter exactly as it appears on your bank statement.</p>
                  </div>
                  <div>
                    <label className={labelCls}>Account Type *</label>
                    <div className="flex gap-2">
                      {[{ value: "savings", label: "Savings" }, { value: "current", label: "Current" }].map((t) => (
                        <button
                          key={t.value}
                          onClick={() => set("bank_account_type", t.value)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                            data.bank_account_type === t.value
                              ? "bg-[#0f2a1e] text-white border-[#0f2a1e]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-amber-800 text-xs leading-relaxed">
                      <strong>Important:</strong> Please ensure your account details are correct. Distributions sent to wrong accounts cannot be reversed. The account name must match your registered name.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Step 4: Next of Kin ── */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-0.5" style={{ letterSpacing: "-0.02em" }}>Next of Kin</h2>
                    <p className="text-gray-400 text-sm mb-5">Person to contact in case of emergency or incapacitation.</p>
                  </div>
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input type="text" value={data.nok_name} onChange={(e) => set("nok_name", e.target.value)}
                      placeholder="Fatimah Ibrahim" className={inputCls} autoFocus />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Relationship *</label>
                      <div className="relative">
                        <select value={data.nok_relationship} onChange={(e) => set("nok_relationship", e.target.value)} className={selectCls}>
                          <option value="">Select</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Parent">Parent</option>
                          <option value="Child">Child</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Friend">Friend</option>
                          <option value="Other">Other</option>
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Phone Number *</label>
                      <input type="tel" inputMode="tel" value={data.nok_phone}
                        onChange={(e) => handlePhone(e.target.value, "nok_phone")}
                        placeholder="+234 802 345 6789" className={inputCls} maxLength={20} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Email Address <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="email" value={data.nok_email} onChange={(e) => set("nok_email", e.target.value)}
                      placeholder="fatimah@example.com" className={inputCls} />
                  </div>
                </div>
              )}

              {/* ── Step 5: Background ── */}
              {step === 5 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-0.5" style={{ letterSpacing: "-0.02em" }}>Background</h2>
                    <p className="text-gray-400 text-sm mb-5">Required for anti-money laundering (AML) compliance.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Occupation *</label>
                      <input type="text" value={data.occupation} onChange={(e) => set("occupation", e.target.value)}
                        placeholder="Business Owner" className={inputCls} autoFocus />
                    </div>
                    <div>
                      <label className={labelCls}>Employer / Business <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input type="text" value={data.employer} onChange={(e) => set("employer", e.target.value)}
                        placeholder="Self-employed" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Primary Source of Investment Funds *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Business Income", "Employment Salary", "Savings",
                        "Property Sale", "Inheritance", "Investment Returns", "Other",
                      ].map((src) => (
                        <button
                          key={src}
                          onClick={() => set("source_of_funds", src)}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all text-left ${
                            data.source_of_funds === src
                              ? "bg-[#0f2a1e] text-white border-[#0f2a1e]"
                              : "bg-white text-gray-700 border-gray-200 hover:border-[#40916c]/40"
                          }`}
                        >
                          {src}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4">
                    <p className="text-[#166534] text-xs leading-relaxed">
                      By completing this onboarding, you confirm all information provided is accurate and that your investment funds are from a halal (permissible) source in accordance with the Musharakah agreement you signed.
                    </p>
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
            <div className="px-7 sm:px-8 pb-8 flex gap-3">
              {step > 1 && (
                <button
                  onClick={() => { setStep((s) => s - 1); setError(""); }}
                  className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  ← Back
                </button>
              )}
              {step < 5 ? (
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
                  className="flex-1 text-[#0f2a1e] py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#d4a843,#c49a38)", boxShadow: loading ? "none" : "0 4px 20px rgba(212,168,67,0.35)" }}
                >
                  {loading
                    ? <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Saving...
                      </span>
                    : "Activate Earnings →"}
                </button>
              )}
            </div>
          </div>

          <p className="text-white/25 text-xs text-center mt-6">
            Your information is encrypted and stored securely. It is never shared with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
