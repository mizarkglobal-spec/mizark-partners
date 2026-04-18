"use client";
import { useEffect, useState, useCallback } from "react";
import type { AgreementTemplate } from "@/app/api/admin/agreement-template/route";
import type { Article } from "@/lib/agreement";
import { DEFAULT_ARTICLES } from "@/lib/agreement";

const inputCls = "w-full bg-[#0f2a1e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#74c69d]/50 transition-colors";
const textareaCls = inputCls + " resize-none";
const labelCls = "block text-white/50 text-xs mb-1.5";

const TOKENS = [
  ["{{partner_name}}", "Partner's full name"],
  ["{{partner_email}}", "Partner's email"],
  ["{{investment_amount}}", "Investment amount (₦ formatted)"],
  ["{{equity_pct}}", "Equity % (6 decimal places)"],
  ["{{equity_pct_3}}", "Equity % (3 decimal places)"],
  ["{{total_pool}}", "Total pool (₦ formatted)"],
  ["{{total_equity_pct}}", "Total equity offered (e.g. 20)"],
  ["{{company_name}}", "Company full name"],
  ["{{company_jurisdiction}}", "Jurisdiction of incorporation"],
  ["{{ceo_name}}", "CEO / signatory name"],
  ["{{arbitration_city}}", "Arbitration city"],
  ["{{governing_law}}", "Governing law jurisdiction"],
  ["{{term_start}}", "Partnership start date"],
  ["{{term_end}}", "Partnership end date"],
  ["{{term_years}}", "Term in years (number)"],
];

export default function AgreementEditorPage() {
  const [template, setTemplate] = useState<AgreementTemplate | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [showTokens, setShowTokens] = useState(false);

  useEffect(() => {
    fetch("/api/admin/agreement-template")
      .then((r) => r.json())
      .then((d: { template: AgreementTemplate }) => {
        setTemplate(d.template);
        // If no custom articles saved, populate with defaults for editing
        setArticles(d.template.articles?.length ? d.template.articles : DEFAULT_ARTICLES.map((a) => ({ ...a })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!template) return;
    setSaving(true);
    try {
      const payload: Partial<AgreementTemplate> = {
        ...template,
        articles,
      };
      const res = await fetch("/api/admin/agreement-template", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  function setField<K extends keyof AgreementTemplate>(key: K, value: AgreementTemplate[K]) {
    setTemplate((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function updateArticle(idx: number, field: keyof Article, value: string) {
    setArticles((prev) => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  }

  function moveArticle(idx: number, dir: -1 | 1) {
    setArticles((prev) => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      setExpandedIdx(swap);
      return next;
    });
  }

  function addArticle() {
    const newIdx = articles.length;
    setArticles((prev) => [...prev, { num: String(prev.length + 1), title: "NEW ARTICLE", body: "" }]);
    setExpandedIdx(newIdx);
  }

  function deleteArticle(idx: number) {
    if (!confirm(`Delete Article ${articles[idx].num} — ${articles[idx].title}?`)) return;
    setArticles((prev) => prev.filter((_, i) => i !== idx));
    setExpandedIdx(null);
  }

  function resetToDefaults() {
    if (!confirm("Reset all articles to the standard defaults? Any custom edits will be lost.")) return;
    setArticles(DEFAULT_ARTICLES.map((a) => ({ ...a })));
    setExpandedIdx(null);
  }

  const insertToken = useCallback((token: string, textareaId: string) => {
    const el = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = el.value;
    const newVal = current.slice(0, start) + token + current.slice(end);
    // Find which article this textarea belongs to
    const match = textareaId.match(/^article-body-(\d+)$/);
    if (match) {
      const idx = parseInt(match[1]);
      updateArticle(idx, "body", newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      }, 0);
    }
  }, []);

  if (loading) return <div className="p-8 flex justify-center pt-20"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>;
  if (!template) return null;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Agreement Template</h1>
          <p className="text-white/50 text-sm">Edit every article, clause, and detail of the Musharakah agreement. Use <code className="text-[#74c69d] text-xs bg-white/5 px-1 rounded">{"{{tokens}}"}</code> for dynamic values.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowTokens((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/60 hover:text-white text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Tokens
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#74c69d] hover:bg-[#5dbc89] disabled:opacity-50 text-[#0f2a1e] font-bold text-sm transition-colors"
          >
            {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Token reference panel */}
      {showTokens && (
        <div className="bg-[#0a1f15] border border-white/5 rounded-2xl p-5">
          <div className="text-white/60 text-xs uppercase tracking-wider mb-3 font-semibold">Available Tokens</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {TOKENS.map(([token, desc]) => (
              <div key={token} className="flex items-center gap-2">
                <code className="text-[#74c69d] text-xs bg-white/5 px-2 py-0.5 rounded font-mono flex-shrink-0">{token}</code>
                <span className="text-white/40 text-xs">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Details */}
      <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#d4a843]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-white font-semibold text-sm">Company Details (Party A)</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Company Full Name</label>
            <input className={inputCls} value={template.company_full_name} onChange={(e) => setField("company_full_name", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Jurisdiction of Incorporation</label>
            <input className={inputCls} value={template.company_jurisdiction} onChange={(e) => setField("company_jurisdiction", e.target.value)} placeholder="the Federal Republic of Nigeria" />
          </div>
          <div>
            <label className={labelCls}>CEO / Signatory Name</label>
            <input className={inputCls} value={template.ceo_name} onChange={(e) => setField("ceo_name", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Legal Details */}
      <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#74c69d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <h2 className="text-white font-semibold text-sm">Legal & Dispute Terms</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Arbitration City</label>
            <input className={inputCls} value={template.arbitration_city} onChange={(e) => setField("arbitration_city", e.target.value)} placeholder="Lagos, Nigeria" />
          </div>
          <div>
            <label className={labelCls}>Governing Law Jurisdiction</label>
            <input className={inputCls} value={template.governing_law} onChange={(e) => setField("governing_law", e.target.value)} placeholder="the Federal Republic of Nigeria" />
          </div>
        </div>
      </div>

      {/* Articles Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-sm">Agreement Articles</h2>
            <p className="text-white/40 text-xs mt-0.5">{articles.length} articles · click to expand and edit</p>
          </div>
          <button
            onClick={resetToDefaults}
            className="text-white/30 hover:text-white/60 text-xs transition-colors"
          >
            Reset to defaults
          </button>
        </div>

        {articles.map((article, idx) => (
          <div key={idx} className="bg-[#1a3a2a] border border-white/10 rounded-2xl overflow-hidden">
            {/* Article header / toggle */}
            <button
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            >
              <div className="w-8 h-8 rounded-lg bg-[#0f2a1e] flex items-center justify-center flex-shrink-0">
                <span className="text-[#74c69d] text-xs font-bold">{article.num}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-semibold truncate">
                  ARTICLE {article.num} — {article.title}
                </div>
                {expandedIdx !== idx && (
                  <div className="text-white/30 text-xs truncate mt-0.5">{article.body.slice(0, 80)}…</div>
                )}
              </div>
              <svg
                className={`w-4 h-4 text-white/40 flex-shrink-0 transition-transform ${expandedIdx === idx ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expanded editor */}
            {expandedIdx === idx && (
              <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Article Number</label>
                    <input
                      className={inputCls}
                      value={article.num}
                      onChange={(e) => updateArticle(idx, "num", e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Article Title</label>
                    <input
                      className={inputCls}
                      value={article.title}
                      onChange={(e) => updateArticle(idx, "title", e.target.value)}
                      placeholder="DEFINITIONS"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Article Body — use {"{{tokens}}"} for dynamic values</label>
                  <textarea
                    id={`article-body-${idx}`}
                    className={textareaCls}
                    rows={12}
                    value={article.body}
                    onChange={(e) => updateArticle(idx, "body", e.target.value)}
                    spellCheck={false}
                  />
                </div>
                {/* Quick token insert */}
                <div className="flex flex-wrap gap-1.5">
                  {TOKENS.slice(0, 8).map(([token]) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => insertToken(token, `article-body-${idx}`)}
                      className="text-[10px] font-mono text-[#74c69d] bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-0.5 rounded transition-colors"
                    >
                      {token}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveArticle(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
                      title="Move up"
                    >
                      <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveArticle(idx, 1)}
                      disabled={idx === articles.length - 1}
                      className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
                      title="Move down"
                    >
                      <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <span className="text-white/20 text-xs">{idx + 1} of {articles.length}</span>
                  </div>
                  <button
                    onClick={() => deleteArticle(idx)}
                    className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete article
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add article button */}
        <button
          onClick={addArticle}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-white/15 text-white/40 hover:text-white/70 hover:border-white/30 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Article
        </button>
      </div>

      {/* Footer Note */}
      <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5">
        <label className={labelCls}>Agreement Footer Note (appears at bottom, e.g. legal disclaimers)</label>
        <textarea
          className={textareaCls}
          rows={3}
          placeholder="Optional..."
          value={template.footer_note}
          onChange={(e) => setField("footer_note", e.target.value)}
        />
      </div>

      {/* Preview link */}
      <div className="bg-[#0a1f15] border border-white/5 rounded-2xl p-4 text-center">
        <p className="text-white/30 text-xs">To preview a live agreement: <strong className="text-white/50">/admin/partners</strong> → expand a partner → "View Agreement" or "Download PDF"</p>
      </div>
    </div>
  );
}
