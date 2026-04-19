"use client";
import { useEffect, useState } from "react";
import { MUSHARAKA_DEFAULTS } from "@/lib/musharaka-defaults";

type FaqItem = { q: string; a: string };

export default function AdminMusharakaPage() {
  const [faq, setFaq] = useState<FaqItem[]>(MUSHARAKA_DEFAULTS.faq);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        const mc = d.settings?.musharaka_content;
        if (mc?.faq?.length) setFaq(mc.faq);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/musharaka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faq }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  function updateItem(i: number, field: "q" | "a", value: string) {
    setFaq((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  function addItem() {
    setFaq((prev) => [...prev, { q: "", a: "" }]);
  }

  function removeItem(i: number) {
    setFaq((prev) => prev.filter((_, idx) => idx !== i));
  }

  function moveItem(i: number, dir: -1 | 1) {
    const next = [...faq];
    const swap = i + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[i], next[swap]] = [next[swap], next[i]];
    setFaq(next);
  }

  const inputCls = "w-full bg-[#0f2a1e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#74c69d]/50";

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Musharaka Knowledgebase</h1>
          <p className="text-white/50 text-sm">Edit the FAQ section shown on both the partner dashboard and public knowledgebase page.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-[#74c69d] hover:bg-[#5dbc89] disabled:opacity-50 text-[#0f2a1e] font-bold text-sm transition-colors flex items-center gap-2"
        >
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
        </button>
      </div>

      <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5">
        <p className="text-white/40 text-xs mb-1">Note</p>
        <p className="text-white/60 text-sm">The scholarly content (Quranic verses, Hadith, madhab consensus) is fixed. Only the FAQ section below is editable. Profit % and term length are controlled in Settings.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">FAQ Items ({faq.length})</h2>
            <button
              onClick={addItem}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#1a3a2a] border border-white/10 text-[#74c69d] hover:bg-[#243d2e] transition-colors"
            >
              + Add Question
            </button>
          </div>

          {faq.map((item, i) => (
            <div key={i} className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Question {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="p-1 text-white/20 hover:text-white disabled:opacity-20 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button onClick={() => moveItem(i, 1)} disabled={i === faq.length - 1} className="p-1 text-white/20 hover:text-white disabled:opacity-20 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button onClick={() => removeItem(i)} className="p-1 text-white/20 hover:text-red-400 transition-colors ml-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-white/40 text-xs mb-1">Question</label>
                <input
                  className={inputCls}
                  value={item.q}
                  onChange={(e) => updateItem(i, "q", e.target.value)}
                  placeholder="Enter the question..."
                />
              </div>
              <div>
                <label className="block text-white/40 text-xs mb-1">Answer</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  value={item.a}
                  onChange={(e) => updateItem(i, "a", e.target.value)}
                  placeholder="Enter the answer..."
                />
              </div>
            </div>
          ))}

          <button
            onClick={addItem}
            className="w-full py-3 rounded-xl border border-dashed border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 text-sm transition-colors"
          >
            + Add another question
          </button>
        </div>
      )}
    </div>
  );
}
