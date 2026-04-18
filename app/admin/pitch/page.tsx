"use client";
import { useEffect, useState } from "react";
import type { PitchContent } from "@/app/api/admin/pitch-content/route";

const inputCls = "w-full bg-[#0f2a1e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#74c69d]/50 transition-colors";
const textareaCls = inputCls + " resize-none";
const labelCls = "block text-white/50 text-xs mb-1.5";

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">{icon}</div>
        <h2 className="text-white font-semibold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function PitchEditorPage() {
  const [content, setContent] = useState<PitchContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "funds" | "risks">("overview");

  useEffect(() => {
    fetch("/api/admin/pitch-content")
      .then((r) => r.json())
      .then((d) => { setContent(d.content); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!content) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pitch-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  function set<K extends keyof PitchContent>(key: K, value: PitchContent[K]) {
    setContent((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function updateListItem(key: "leadash_items" | "academy_items", idx: number, val: string) {
    if (!content) return;
    const arr = [...content[key]];
    arr[idx] = val;
    set(key, arr);
  }

  function addListItem(key: "leadash_items" | "academy_items") {
    if (!content) return;
    set(key, [...content[key], ""]);
  }

  function removeListItem(key: "leadash_items" | "academy_items", idx: number) {
    if (!content) return;
    set(key, content[key].filter((_, i) => i !== idx));
  }

  function updateFund(idx: number, field: string, value: any) {
    if (!content) return;
    const arr = [...content.use_of_funds];
    arr[idx] = { ...arr[idx], [field]: value };
    set("use_of_funds", arr);
  }

  function updateFundItem(fundIdx: number, itemIdx: number, val: string) {
    if (!content) return;
    const arr = [...content.use_of_funds];
    const items = [...arr[fundIdx].items];
    items[itemIdx] = val;
    arr[fundIdx] = { ...arr[fundIdx], items };
    set("use_of_funds", arr);
  }

  function updateRisk(idx: number, field: "title" | "desc", val: string) {
    if (!content) return;
    const arr = [...content.risk_factors];
    arr[idx] = { ...arr[idx], [field]: val };
    set("risk_factors", arr);
  }

  function addRisk() {
    if (!content) return;
    set("risk_factors", [...content.risk_factors, { title: "New Risk", desc: "" }]);
  }

  function removeRisk(idx: number) {
    if (!content) return;
    set("risk_factors", content.risk_factors.filter((_, i) => i !== idx));
  }

  if (loading) return <div className="p-8 flex justify-center pt-20"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>;
  if (!content) return null;

  const tabs = [
    { id: "overview", label: "Overview & Copy" },
    { id: "products", label: "Products" },
    { id: "funds", label: "Use of Funds" },
    { id: "risks", label: "Risk Factors" },
  ] as const;

  return (
    <div className="p-6 sm:p-8 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Pitch Deck Editor</h1>
          <p className="text-white/50 text-sm">Edit the content shown to applicants in the pitch deck.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/pitch/preview"
            target="_blank"
            className="text-white/50 hover:text-white text-xs border border-white/10 rounded-lg px-3 py-2 transition-colors"
          >
            Preview →
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#74c69d] hover:bg-[#5dbc89] disabled:opacity-50 text-[#0f2a1e] font-bold text-sm transition-colors"
          >
            {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0f2a1e] rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-[#1a3a2a] text-white"
                : "text-white/40 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-5">
          <Section title="Header" icon={<svg className="w-4 h-4 text-[#d4a843]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Round Label (top badge)</label>
                <input className={inputCls} value={content.round_label} onChange={(e) => set("round_label", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Company Tagline</label>
                <input className={inputCls} value={content.company_tagline} onChange={(e) => set("company_tagline", e.target.value)} />
              </div>
            </div>
          </Section>

          <Section title="Executive Summary" icon={<svg className="w-4 h-4 text-[#74c69d]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
            <div>
              <label className={labelCls}>Summary text (supports two paragraphs — separate with a blank line)</label>
              <textarea
                className={textareaCls}
                rows={6}
                value={content.executive_summary}
                onChange={(e) => set("executive_summary", e.target.value)}
              />
            </div>
          </Section>

          <Section title="Financial Snapshot Note" icon={<svg className="w-4 h-4 text-[#d4a843]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}>
            <div>
              <label className={labelCls}>Disclaimer shown in the Financial Snapshot section</label>
              <textarea className={textareaCls} rows={3} value={content.financials_note} onChange={(e) => set("financials_note", e.target.value)} />
            </div>
          </Section>

          <Section title="Call to Action" icon={<svg className="w-4 h-4 text-[#74c69d]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>CTA Heading</label>
                <input className={inputCls} value={content.cta_heading} onChange={(e) => set("cta_heading", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>CTA Body Text</label>
                <textarea className={textareaCls} rows={3} value={content.cta_body} onChange={(e) => set("cta_body", e.target.value)} />
              </div>
            </div>
          </Section>
        </div>
      )}

      {activeTab === "products" && (
        <div className="space-y-5">
          {/* Leadash */}
          <Section title="Leadash — SaaS Platform" icon={<span className="text-white text-xs font-bold">L</span>}>
            <div>
              <label className={labelCls}>Product description (shown as subtitle)</label>
              <input className={inputCls} value={content.leadash_description} onChange={(e) => set("leadash_description", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Bullet points</label>
              <div className="space-y-2">
                {content.leadash_items.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input className={inputCls} value={item} onChange={(e) => updateListItem("leadash_items", idx, e.target.value)} />
                    <button onClick={() => removeListItem("leadash_items", idx)} className="text-white/20 hover:text-red-400 px-2 flex-shrink-0 transition-colors">×</button>
                  </div>
                ))}
                <button onClick={() => addListItem("leadash_items")} className="text-[#74c69d] text-xs hover:underline">+ Add item</button>
              </div>
            </div>
          </Section>

          {/* Academy */}
          <Section title="Learn by Mizark — Academy" icon={<span className="text-white text-xs font-bold">A</span>}>
            <div>
              <label className={labelCls}>Product description</label>
              <input className={inputCls} value={content.academy_description} onChange={(e) => set("academy_description", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Bullet points</label>
              <div className="space-y-2">
                {content.academy_items.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input className={inputCls} value={item} onChange={(e) => updateListItem("academy_items", idx, e.target.value)} />
                    <button onClick={() => removeListItem("academy_items", idx)} className="text-white/20 hover:text-red-400 px-2 flex-shrink-0 transition-colors">×</button>
                  </div>
                ))}
                <button onClick={() => addListItem("academy_items")} className="text-[#74c69d] text-xs hover:underline">+ Add item</button>
              </div>
            </div>
          </Section>

          <Section title="Combined Strategy Note" icon={<svg className="w-4 h-4 text-[#d4a843]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" /></svg>}>
            <textarea className={textareaCls} rows={3} value={content.combined_strategy} onChange={(e) => set("combined_strategy", e.target.value)} />
          </Section>
        </div>
      )}

      {activeTab === "funds" && (
        <div className="space-y-4">
          <p className="text-white/40 text-xs">Edit the 4 use-of-funds categories. Changes are reflected immediately in the pitch deck.</p>
          {content.use_of_funds.map((fund, idx) => (
            <div key={idx} className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Category</label>
                  <input className={inputCls} value={fund.category} onChange={(e) => updateFund(idx, "category", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Percentage</label>
                  <input className={inputCls} value={fund.pct} onChange={(e) => updateFund(idx, "pct", e.target.value)} placeholder="35%" />
                </div>
                <div>
                  <label className={labelCls}>Amount</label>
                  <input className={inputCls} value={fund.amount} onChange={(e) => updateFund(idx, "amount", e.target.value)} placeholder="₦7,000,000" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Items</label>
                <div className="space-y-2">
                  {fund.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex gap-2">
                      <input
                        className={inputCls}
                        value={item}
                        onChange={(e) => updateFundItem(idx, itemIdx, e.target.value)}
                      />
                      <button
                        onClick={() => {
                          const arr = [...content.use_of_funds];
                          arr[idx] = { ...arr[idx], items: arr[idx].items.filter((_, i) => i !== itemIdx) };
                          set("use_of_funds", arr);
                        }}
                        className="text-white/20 hover:text-red-400 px-2 flex-shrink-0 transition-colors"
                      >×</button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const arr = [...content.use_of_funds];
                      arr[idx] = { ...arr[idx], items: [...arr[idx].items, ""] };
                      set("use_of_funds", arr);
                    }}
                    className="text-[#74c69d] text-xs hover:underline"
                  >+ Add item</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "risks" && (
        <div className="space-y-4">
          <p className="text-white/40 text-xs">Edit risk disclosures. These are shown in Section 6 of the pitch deck.</p>
          {content.risk_factors.map((risk, idx) => (
            <div key={idx} className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <label className={labelCls}>Risk Title</label>
                  <input className={inputCls} value={risk.title} onChange={(e) => updateRisk(idx, "title", e.target.value)} />
                </div>
                <button onClick={() => removeRisk(idx)} className="text-white/20 hover:text-red-400 mt-5 transition-colors" title="Remove risk">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea className={textareaCls} rows={3} value={risk.desc} onChange={(e) => updateRisk(idx, "desc", e.target.value)} />
              </div>
            </div>
          ))}
          <button
            onClick={addRisk}
            className="flex items-center gap-2 text-[#74c69d] text-sm border border-[#74c69d]/30 rounded-xl px-4 py-2.5 hover:bg-[#74c69d]/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Risk Factor
          </button>
        </div>
      )}
    </div>
  );
}
