"use client";
import { useEffect, useState } from "react";
import { fmt } from "@/lib/format";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Partner {
  id: string;
  name: string;
  email: string;
  investment_amount: number;
  equity_pct: number;
  status: string;
}

interface Principal {
  id: string;
  name: string;
  role: string;
  equity_pct: number;
  bio?: string;
  is_founder?: boolean;
}

const COLORS = ["#d4a843", "#74c69d", "#40916c", "#2d6a4f", "#1a3a2a", "#52b788", "#95d5b2", "#b7e4c7"];

const inputCls = "w-full bg-[#0f2a1e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#74c69d]/50";
const labelCls = "block text-white/50 text-xs mb-1";

export default function CapTablePage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [loading, setLoading] = useState(true);

  // Principals editing state
  const [editingPrincipal, setEditingPrincipal] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Principal>>({});
  const [savingPrincipal, setSavingPrincipal] = useState(false);
  const [showAddPrincipal, setShowAddPrincipal] = useState(false);
  const [addForm, setAddForm] = useState<Partial<Principal>>({ name: "", role: "", equity_pct: 0, bio: "", is_founder: false });
  const [addingPrincipal, setAddingPrincipal] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/partners").then((r) => r.json()),
      fetch("/api/admin/principals").then((r) => r.json()),
    ]).then(([partnerData, principalData]) => {
      setPartners((partnerData.partners ?? []).filter((p: Partner) => p.status === "active"));
      setPrincipals(principalData.principals ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalRaised = partners.reduce((s, p) => s + p.investment_amount, 0);
  const partnerEquity = partners.reduce((s, p) => s + Number(p.equity_pct), 0);
  const principalEquity = principals.reduce((s, p) => s + Number(p.equity_pct), 0);
  const remainingPool = 20_000_000 - totalRaised;
  const totalEquityAllocated = principalEquity + partnerEquity;
  const unallocated = Math.max(0, 100 - totalEquityAllocated);

  const pieData = [
    ...principals.map((p) => ({ name: `${p.name} (${p.role})`, value: Number(p.equity_pct), amount: null })),
    ...partners.map((p) => ({ name: p.name, value: Number(p.equity_pct), amount: p.investment_amount })),
    ...(unallocated > 0.001 ? [{ name: "Unallocated", value: unallocated, amount: null }] : []),
  ];

  async function handleSavePrincipal(id: string) {
    setSavingPrincipal(true);
    try {
      const res = await fetch(`/api/admin/principals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to save");
      setPrincipals((prev) => prev.map((p) => p.id === id ? { ...p, ...editForm } as Principal : p));
      setEditingPrincipal(null);
      setEditForm({});
    } catch (e: any) { alert(e.message); }
    finally { setSavingPrincipal(false); }
  }

  async function handleDeletePrincipal(id: string, name: string) {
    if (!confirm(`Remove ${name} from principals? This only affects the cap table display.`)) return;
    const res = await fetch(`/api/admin/principals/${id}`, { method: "DELETE" });
    if (res.ok) setPrincipals((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleAddPrincipal() {
    setAddingPrincipal(true);
    try {
      const res = await fetch("/api/admin/principals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPrincipals((prev) => [...prev, data.principal]);
      setShowAddPrincipal(false);
      setAddForm({ name: "", role: "", equity_pct: 0, bio: "", is_founder: false });
    } catch (e: any) { alert(e.message); }
    finally { setAddingPrincipal(false); }
  }

  if (loading) return <div className="p-6 sm:p-8 flex justify-center pt-20"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Cap Table</h1>
        <p className="text-white/50 text-sm">Equity distribution across principals and partners.</p>
      </div>

      {/* Progress */}
      <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/50">Partner Pool Raised</span>
          <span className="text-white font-semibold">{fmt.naira(totalRaised)} / ₦20,000,000</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 mb-3">
          <div className="bg-gradient-to-r from-[#40916c] to-[#74c69d] h-3 rounded-full transition-all" style={{ width: `${Math.min((totalRaised / 20_000_000) * 100, 100)}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-white/40 text-xs mb-1">Active Partners</div>
            <div className="text-white font-semibold">{partners.length}</div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Partner Equity Sold</div>
            <div className="text-[#74c69d] font-semibold">{partnerEquity.toFixed(3)}%</div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Pool Remaining</div>
            <div className="text-[#d4a843] font-semibold">{fmt.naira(remainingPool)}</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Donut */}
        <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Equity Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#1a3a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [`${Number(v).toFixed(3)}%`]}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }} formatter={(v) => v.length > 22 ? v.slice(0, 22) + "…" : v} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stake Breakdown */}
        <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="text-white font-semibold">Stake Breakdown</h3>
          </div>
          <div className="overflow-y-auto max-h-72">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-2 text-white/40 font-medium text-xs">Name</th>
                  <th className="text-left px-4 py-2 text-white/40 font-medium text-xs">Role</th>
                  <th className="text-right px-4 py-2 text-white/40 font-medium text-xs">Equity</th>
                </tr>
              </thead>
              <tbody>
                {principals.map((p) => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="px-4 py-2.5 text-white font-medium">{p.name}</td>
                    <td className="px-4 py-2.5 text-white/50 text-xs">{p.role}</td>
                    <td className="px-4 py-2.5 text-right text-[#d4a843] font-semibold">{Number(p.equity_pct).toFixed(3)}%</td>
                  </tr>
                ))}
                {partners.map((p) => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="px-4 py-2.5 text-white">{p.name}</td>
                    <td className="px-4 py-2.5 text-white/50 text-xs">Partner</td>
                    <td className="px-4 py-2.5 text-right text-[#74c69d] font-semibold">{fmt.percent(Number(p.equity_pct))}</td>
                  </tr>
                ))}
                {unallocated > 0.001 && (
                  <tr className="border-b border-white/5">
                    <td className="px-4 py-2.5 text-white/30 italic">Unallocated</td>
                    <td className="px-4 py-2.5 text-white/30 text-xs">—</td>
                    <td className="px-4 py-2.5 text-right text-white/30">{unallocated.toFixed(3)}%</td>
                  </tr>
                )}
                <tr className="bg-[#0f2a1e]">
                  <td className="px-4 py-2.5 text-white font-bold" colSpan={2}>Total</td>
                  <td className="px-4 py-2.5 text-right text-white font-bold">{totalEquityAllocated.toFixed(3)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Principals Management */}
      <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Principals & Founders</h3>
            <p className="text-white/40 text-xs mt-0.5">Manage founder equity, co-founders, advisors, and reserved pools.</p>
          </div>
          <button
            onClick={() => setShowAddPrincipal(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-[#74c69d] hover:bg-[#5dbc89] text-[#0f2a1e] font-bold transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Principal
          </button>
        </div>

        <div className="divide-y divide-white/5">
          {principals.map((p) => (
            <div key={p.id} className="px-5 py-4">
              {editingPrincipal === p.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Name</label>
                      <input className={inputCls} value={editForm.name ?? ""} onChange={(e) => setEditForm(f => ({...f, name: e.target.value}))} />
                    </div>
                    <div>
                      <label className={labelCls}>Role / Title</label>
                      <input className={inputCls} value={editForm.role ?? ""} onChange={(e) => setEditForm(f => ({...f, role: e.target.value}))} />
                    </div>
                    <div>
                      <label className={labelCls}>Equity %</label>
                      <input type="number" step="0.001" className={inputCls} value={editForm.equity_pct ?? ""} onChange={(e) => setEditForm(f => ({...f, equity_pct: Number(e.target.value)}))} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Bio / Notes</label>
                    <input className={inputCls} value={editForm.bio ?? ""} onChange={(e) => setEditForm(f => ({...f, bio: e.target.value}))} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingPrincipal(null); setEditForm({}); }} className="text-white/40 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 transition-colors">Cancel</button>
                    <button onClick={() => handleSavePrincipal(p.id)} disabled={savingPrincipal} className="text-[#0f2a1e] bg-[#74c69d] hover:bg-[#5dbc89] disabled:opacity-50 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors">
                      {savingPrincipal ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#0f2a1e] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#d4a843] font-bold text-sm">{p.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-medium text-sm truncate">{p.name}</div>
                      <div className="text-white/40 text-xs">{p.role}</div>
                      {p.bio && <div className="text-white/30 text-xs truncate mt-0.5">{p.bio}</div>}
                    </div>
                  </div>
                  <div className="text-[#d4a843] font-bold flex-shrink-0">{Number(p.equity_pct).toFixed(3)}%</div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setEditingPrincipal(p.id); setEditForm({ name: p.name, role: p.role, equity_pct: p.equity_pct, bio: p.bio ?? "" }); }}
                      className="text-white/30 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button
                      onClick={() => handleDeletePrincipal(p.id, p.name)}
                      className="text-white/20 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {principals.length === 0 && (
            <div className="px-5 py-8 text-center text-white/30 text-sm">
              No principals yet. Add yourself as the founder.
            </div>
          )}
        </div>
      </div>

      {/* Add Principal Modal */}
      {showAddPrincipal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="bg-[#1a3a2a] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <h2 className="text-white font-bold">Add Principal</h2>
              <button onClick={() => setShowAddPrincipal(false)} className="text-white/30 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input className={inputCls} placeholder="Malik Adelaja" value={addForm.name} onChange={(e) => setAddForm(f => ({...f, name: e.target.value}))} />
                </div>
                <div>
                  <label className={labelCls}>Role / Title *</label>
                  <input className={inputCls} placeholder="Founder & CEO" value={addForm.role} onChange={(e) => setAddForm(f => ({...f, role: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Equity % *</label>
                <input type="number" step="0.001" min="0" max="100" className={inputCls} placeholder="80" value={addForm.equity_pct ?? ""} onChange={(e) => setAddForm(f => ({...f, equity_pct: Number(e.target.value)}))} />
              </div>
              <div>
                <label className={labelCls}>Bio / Notes (optional)</label>
                <input className={inputCls} placeholder="Founder, manages operations..." value={addForm.bio ?? ""} onChange={(e) => setAddForm(f => ({...f, bio: e.target.value}))} />
              </div>
              <button
                onClick={() => setAddForm(f => ({...f, is_founder: !f.is_founder}))}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all text-sm ${addForm.is_founder ? "border-[#d4a843]/40 bg-[#d4a843]/10 text-[#d4a843]" : "border-white/10 text-white/50"}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${addForm.is_founder ? "bg-[#d4a843] border-[#d4a843]" : "border-white/30"}`}>
                    {addForm.is_founder && <svg className="w-2.5 h-2.5 text-[#0f2a1e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  Mark as Founder
                </div>
              </button>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setShowAddPrincipal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm transition-colors">Cancel</button>
              <button
                onClick={handleAddPrincipal}
                disabled={addingPrincipal || !addForm.name || !addForm.role}
                className="flex-1 py-2.5 rounded-xl bg-[#74c69d] hover:bg-[#5dbc89] disabled:opacity-40 text-[#0f2a1e] font-bold text-sm transition-colors"
              >
                {addingPrincipal ? "Adding..." : "Add Principal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
