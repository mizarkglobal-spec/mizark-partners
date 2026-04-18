"use client";
import { useEffect, useState } from "react";
import type { HomepageSettings, HomepageFaq } from "@/lib/homepage";
import { HOMEPAGE_DEFAULTS } from "@/lib/homepage";

const inputCls =
  "w-full bg-[#0f2a1e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#74c69d]/50 transition-colors";
const textareaCls = inputCls + " resize-none";
const labelCls = "block text-white/50 text-xs mb-1.5";

export default function HomepageEditorPage() {
  const [hp, setHp] = useState<HomepageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/homepage")
      .then((r) => r.json())
      .then((d) => { setHp(d.homepage); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!hp) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/homepage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hp),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof HomepageSettings>(key: K, val: HomepageSettings[K]) {
    setHp((prev) => (prev ? { ...prev, [key]: val } : prev));
  }

  function updateFaq(i: number, field: keyof HomepageFaq, val: string) {
    setHp((prev) => {
      if (!prev) return prev;
      const faqs = prev.faqs.map((f, idx) => (idx === i ? { ...f, [field]: val } : f));
      return { ...prev, faqs };
    });
  }

  function addFaq() {
    setHp((prev) =>
      prev ? { ...prev, faqs: [...prev.faqs, { q: "", a: "" }] } : prev
    );
  }

  function removeFaq(i: number) {
    setHp((prev) =>
      prev ? { ...prev, faqs: prev.faqs.filter((_, idx) => idx !== i) } : prev
    );
  }

  function moveFaq(i: number, dir: -1 | 1) {
    setHp((prev) => {
      if (!prev) return prev;
      const faqs = [...prev.faqs];
      const swap = i + dir;
      if (swap < 0 || swap >= faqs.length) return prev;
      [faqs[i], faqs[swap]] = [faqs[swap], faqs[i]];
      return { ...prev, faqs };
    });
  }

  function resetFaqs() {
    if (!confirm("Reset FAQs to defaults?")) return;
    setHp((prev) => (prev ? { ...prev, faqs: HOMEPAGE_DEFAULTS.faqs } : prev));
  }

  if (loading)
    return (
      <div className="p-8 flex justify-center pt-20">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  if (!hp) return null;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Homepage</h1>
          <p className="text-white/50 text-sm">
            Edit the public landing page copy. Pool size, equity %, and term come from{" "}
            <a href="/admin/settings" className="text-[#74c69d] hover:underline">Programme Settings</a>.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#74c69d] hover:bg-[#5dbc89] disabled:opacity-50 text-[#0f2a1e] font-bold text-sm transition-colors flex-shrink-0"
        >
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Hero */}
      <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#74c69d]" />
          Hero Section
        </h2>

        <div>
          <label className={labelCls}>Announcement Badge</label>
          <input
            className={inputCls}
            value={hp.hero_badge}
            onChange={(e) => set("hero_badge", e.target.value)}
            placeholder="Accepting Applications — Round 1"
          />
          <p className="text-white/25 text-xs mt-1">Shown in the green pill above the headline.</p>
        </div>

        <div className="grid gap-3">
          <div>
            <label className={labelCls}>Headline — Line 1</label>
            <input className={inputCls} value={hp.hero_headline_1} onChange={(e) => set("hero_headline_1", e.target.value)} placeholder="Grow with Mizark." />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Headline — Line 2 (accent)</label>
              <input className={inputCls} value={hp.hero_headline_2} onChange={(e) => set("hero_headline_2", e.target.value)} placeholder="Halal equity" />
              <p className="text-white/25 text-xs mt-1">Rendered in mint green.</p>
            </div>
            <div>
              <label className={labelCls}>Headline — Line 3</label>
              <input className={inputCls} value={hp.hero_headline_3} onChange={(e) => set("hero_headline_3", e.target.value)} placeholder="in a tech company." />
            </div>
          </div>
        </div>

        <div>
          <label className={labelCls}>Hero Subtext</label>
          <textarea className={textareaCls} rows={3} value={hp.hero_subtext} onChange={(e) => set("hero_subtext", e.target.value)} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Primary CTA Button Label</label>
            <input className={inputCls} value={hp.cta_label} onChange={(e) => set("cta_label", e.target.value)} placeholder="Apply to Partner" />
          </div>
          <div>
            <label className={labelCls}>Maximum Investment per Partner (₦)</label>
            <input
              type="number"
              className={inputCls}
              value={hp.max_investment}
              onChange={(e) => set("max_investment", Number(e.target.value))}
            />
            <p className="text-white/25 text-xs mt-1">Shown in the Terms grid and Opportunity section.</p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-sm">FAQs</h2>
            <p className="text-white/40 text-xs mt-0.5">{hp.faqs.length} questions</p>
          </div>
          <button onClick={resetFaqs} className="text-white/30 hover:text-white/60 text-xs transition-colors">
            Reset to defaults
          </button>
        </div>

        {hp.faqs.map((faq, i) => (
          <div key={i} className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-white/30 text-xs font-mono">{i + 1}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => moveFaq(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-white/10 disabled:opacity-30 transition-colors">
                  <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </button>
                <button onClick={() => moveFaq(i, 1)} disabled={i === hp.faqs.length - 1} className="p-1 rounded hover:bg-white/10 disabled:opacity-30 transition-colors">
                  <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <button onClick={() => removeFaq(i)} className="p-1 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors ml-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Question</label>
              <input className={inputCls} value={faq.q} onChange={(e) => updateFaq(i, "q", e.target.value)} placeholder="What is…?" />
            </div>
            <div>
              <label className={labelCls}>Answer</label>
              <textarea className={textareaCls} rows={3} value={faq.a} onChange={(e) => updateFaq(i, "a", e.target.value)} />
            </div>
          </div>
        ))}

        <button
          onClick={addFaq}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-white/15 text-white/40 hover:text-white/70 hover:border-white/30 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Question
        </button>
      </div>

      {/* Info */}
      <div className="bg-[#0a1f15] border border-white/5 rounded-2xl p-4">
        <p className="text-white/30 text-xs leading-relaxed">
          → Pool size, equity %, term years, min investment, profit distribution %, and governing law are set in <a href="/admin/settings" className="text-[#74c69d] hover:underline">Programme Settings</a> and the <a href="/admin/agreement" className="text-[#74c69d] hover:underline">Agreement Template</a> — they auto-populate on the homepage.<br />
          → The team section on the homepage is driven by your <a href="/admin/cap-table" className="text-[#74c69d] hover:underline">Principals</a> list.
        </p>
      </div>
    </div>
  );
}
