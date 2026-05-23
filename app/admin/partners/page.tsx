"use client";
import { useEffect, useState } from "react";
import { fmt } from "@/lib/format";

interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  investment_amount: number;
  committed_amount: number | null;
  paid_amount: number | null;
  equity_pct: number;
  equity_committed_pct: number | null;
  payment_status: string | null;
  start_date: string;
  term_end_date: string;
  status: string;
  activated_at: string | null;
  created_at: string;
  notes: string | null;
  agreement_token: string | null;
  payment_token: string | null;
  onboarding_completed: boolean;
  kyc_data: Record<string, string> | null;
}

interface Installment {
  id: string;
  amount: number;
  payment_date: string;
  reference: string | null;
  method: string;
  notes: string | null;
  created_at: string;
}

const METHOD_LABEL: Record<string, string> = {
  paystack: "Paystack",
  bank_transfer: "Bank Transfer",
  manual: "Manual",
  other: "Other",
};

const statusColor = (s: string) => {
  switch (s) {
    case "active": return "bg-green-900/50 text-green-300 border border-green-700";
    case "pending_payment": return "bg-yellow-900/50 text-yellow-300 border border-yellow-700";
    case "agreement_signed": return "bg-blue-900/50 text-blue-300 border border-blue-700";
    case "awaiting_payment": return "bg-orange-900/50 text-orange-300 border border-orange-700";
    default: return "bg-gray-900/50 text-gray-300 border border-gray-700";
  }
};

const paymentStatusColor = (s: string | null) => {
  switch (s) {
    case "complete": return "text-green-400";
    case "partial": return "text-amber-400";
    case "awaiting_first": return "text-white/40";
    default: return "text-white/40";
  }
};

const inputCls = "w-full bg-[#0f2a1e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#74c69d]/50";
const labelCls = "block text-white/50 text-xs mb-1";

const EMPTY_LOG_FORM = {
  amount: "",
  payment_date: new Date().toISOString().slice(0, 10),
  method: "bank_transfer" as const,
  reference: "",
  notes: "",
};

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [distributions, setDistributions] = useState<Record<string, number>>({});
  const [installments, setInstallments] = useState<Record<string, Installment[]>>({});
  const [loadingInstallments, setLoadingInstallments] = useState<string | null>(null);

  // Action states
  const [deleting, setDeleting] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Partner>>({});
  const [saving, setSaving] = useState(false);

  // Add partner modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", email: "", phone: "",
    investment_amount: "", start_date: new Date().toISOString().slice(0, 10),
    notes: "", send_agreement: true,
  });
  const [adding, setAdding] = useState(false);

  // Log payment modal
  const [logPaymentPartnerId, setLogPaymentPartnerId] = useState<string | null>(null);
  const [logForm, setLogForm] = useState({ ...EMPTY_LOG_FORM });
  const [loggingPayment, setLoggingPayment] = useState(false);

  useEffect(() => {
    loadPartners();
  }, []);

  async function loadPartners() {
    const res = await fetch("/api/admin/partners");
    const d = await res.json();
    setPartners(d.partners ?? []);
    if (d.totalDistributed) setDistributions(d.totalDistributed);
    setLoading(false);
  }

  async function loadInstallments(partnerId: string) {
    if (installments[partnerId]) return;
    setLoadingInstallments(partnerId);
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/payment`);
      const d = await res.json();
      setInstallments((prev) => ({ ...prev, [partnerId]: d.installments ?? [] }));
    } finally {
      setLoadingInstallments(null);
    }
  }

  function handleExpand(partnerId: string) {
    const next = expandedId === partnerId ? null : partnerId;
    setExpandedId(next);
    if (next) loadInstallments(next);
  }

  async function handleDelete(partnerId: string, name: string) {
    if (!confirm(`Delete ${name}? This permanently removes the partner and all related records. This cannot be undone.`)) return;
    setDeleting(partnerId);
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setPartners((prev) => prev.filter((p) => p.id !== partnerId));
      if (expandedId === partnerId) setExpandedId(null);
    } catch (e: any) { alert(e.message); }
    finally { setDeleting(null); }
  }

  async function handleResend(partnerId: string, type: "agreement" | "payment" | "welcome") {
    const labels = { agreement: "agreement link", payment: "payment link", welcome: "welcome email" };
    setResending(`${partnerId}-${type}`);
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`✓ ${labels[type]} resent successfully`);
    } catch (e: any) { alert(e.message); }
    finally { setResending(null); }
  }

  async function handleSaveEdit(partnerId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPartners((prev) => prev.map((p) => p.id === partnerId ? { ...p, ...editForm } as Partner : p));
      setEditingId(null);
      setEditForm({});
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function handleAddPartner() {
    setAdding(true);
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          investment_amount: Number(addForm.investment_amount.replace(/,/g, "")),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowAddModal(false);
      setAddForm({ name: "", email: "", phone: "", investment_amount: "", start_date: new Date().toISOString().slice(0, 10), notes: "", send_agreement: true });
      loadPartners();
    } catch (e: any) { alert(e.message); }
    finally { setAdding(false); }
  }

  async function handleLogPayment() {
    if (!logPaymentPartnerId) return;
    setLoggingPayment(true);
    try {
      const res = await fetch(`/api/admin/partners/${logPaymentPartnerId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(logForm.amount.replace(/,/g, "")),
          payment_date: logForm.payment_date,
          method: logForm.method,
          reference: logForm.reference || null,
          notes: logForm.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLogPaymentPartnerId(null);
      setLogForm({ ...EMPTY_LOG_FORM });
      // Refresh partner row and installments
      delete installments[logPaymentPartnerId];
      setInstallments({ ...installments });
      loadPartners();
      loadInstallments(logPaymentPartnerId);
    } catch (e: any) { alert(e.message); }
    finally { setLoggingPayment(false); }
  }

  const totalCommitted = partners.reduce((s, p) => s + Number(p.committed_amount ?? p.investment_amount ?? 0), 0);
  const totalPaid = partners.filter(p => p.status === "active").reduce((s, p) => s + Number(p.paid_amount ?? p.investment_amount ?? 0), 0);
  const activeCount = partners.filter((p) => p.status === "active").length;

  const logPartner = partners.find((p) => p.id === logPaymentPartnerId);

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Partners</h1>
          <p className="text-white/50 text-sm">All partners across all stages.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#74c69d] hover:bg-[#5dbc89] text-[#0f2a1e] font-bold text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Partner
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-4">
          <div className="text-white/40 text-xs mb-1">Total Partners</div>
          <div className="text-2xl font-bold text-white">{partners.length}</div>
        </div>
        <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-4">
          <div className="text-white/40 text-xs mb-1">Active Partners</div>
          <div className="text-2xl font-bold text-[#74c69d]">{activeCount}</div>
        </div>
        <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-4">
          <div className="text-white/40 text-xs mb-1">Paid-up Capital</div>
          <div className="text-2xl font-bold text-[#d4a843]">{fmt.naira(totalPaid)}</div>
          {totalCommitted !== totalPaid && (
            <div className="text-white/30 text-xs mt-1">Committed: {fmt.naira(totalCommitted)}</div>
          )}
        </div>
        <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-4">
          <div className="text-white/40 text-xs mb-1">Slots Available</div>
          <div className="text-2xl font-bold text-white">{40 - activeCount} / 40</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["Name", "Email", "Paid / Committed", "Active Equity", "Start Date", "Status", "Distributed", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => {
                  const committed = Number(p.committed_amount ?? p.investment_amount ?? 0);
                  const paid = Number(p.paid_amount ?? p.investment_amount ?? 0);
                  const pct = committed > 0 ? Math.min(100, (paid / committed) * 100) : 100;
                  const isPartial = paid < committed;
                  return (
                    <>
                      <tr
                        key={p.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => handleExpand(p.id)}
                      >
                        <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                        <td className="px-4 py-3 text-white/70">{p.email}</td>
                        <td className="px-4 py-3">
                          <div className={`font-semibold ${isPartial ? "text-amber-400" : "text-[#d4a843]"}`}>
                            {fmt.naira(paid)}
                          </div>
                          {isPartial && (
                            <>
                              <div className="text-white/30 text-xs mt-0.5">of {fmt.naira(committed)}</div>
                              <div className="h-1 bg-white/10 rounded-full mt-1.5 w-24">
                                <div className="h-1 bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[#74c69d]">{fmt.percent(Number(p.equity_pct))}</div>
                          {p.equity_committed_pct && Number(p.equity_committed_pct) !== Number(p.equity_pct) && (
                            <div className="text-white/30 text-xs mt-0.5">{fmt.percent(Number(p.equity_committed_pct))} committed</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white/50">{p.start_date ? fmt.shortDate(p.start_date) : "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${statusColor(p.status)}`}>
                            {p.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/70">
                          {distributions[p.id] !== undefined ? fmt.naira(distributions[p.id]) : "—"}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            disabled={deleting === p.id}
                            className="text-white/20 hover:text-red-400 transition-colors p-1"
                            title="Delete partner"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                      {expandedId === p.id && (
                        <tr key={`${p.id}-exp`} className="bg-[#0f2a1e]">
                          <td colSpan={8} className="px-6 py-5">
                            <div className="space-y-5">

                              {/* Edit mode toggle */}
                              <div className="flex items-center justify-between">
                                <div className="text-white/40 text-xs uppercase tracking-widest">Partner Details</div>
                                {editingId !== p.id ? (
                                  <button
                                    onClick={() => { setEditingId(p.id); setEditForm({ name: p.name, email: p.email, phone: p.phone, investment_amount: p.investment_amount, equity_pct: p.equity_pct, start_date: p.start_date, term_end_date: p.term_end_date, status: p.status, notes: p.notes }); }}
                                    className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => { setEditingId(null); setEditForm({}); }}
                                      className="text-white/40 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleSaveEdit(p.id)}
                                      disabled={saving}
                                      className="text-[#0f2a1e] bg-[#74c69d] hover:bg-[#5dbc89] disabled:opacity-50 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                                    >
                                      {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {editingId === p.id ? (
                                <div className="grid sm:grid-cols-3 gap-3">
                                  <div><label className={labelCls}>Name</label><input className={inputCls} value={editForm.name ?? ""} onChange={(e) => setEditForm(f => ({...f, name: e.target.value}))} /></div>
                                  <div><label className={labelCls}>Email</label><input className={inputCls} value={editForm.email ?? ""} onChange={(e) => setEditForm(f => ({...f, email: e.target.value}))} /></div>
                                  <div><label className={labelCls}>Phone</label><input className={inputCls} value={editForm.phone ?? ""} onChange={(e) => setEditForm(f => ({...f, phone: e.target.value}))} /></div>
                                  <div><label className={labelCls}>Committed Amount (₦)</label><input type="number" className={inputCls} value={editForm.investment_amount ?? ""} onChange={(e) => setEditForm(f => ({...f, investment_amount: Number(e.target.value)}))} /></div>
                                  <div><label className={labelCls}>Equity % (override)</label><input type="number" step="0.000001" className={inputCls} value={editForm.equity_pct ?? ""} onChange={(e) => setEditForm(f => ({...f, equity_pct: Number(e.target.value)}))} /></div>
                                  <div>
                                    <label className={labelCls}>Status</label>
                                    <select className={inputCls} value={editForm.status ?? ""} onChange={(e) => setEditForm(f => ({...f, status: e.target.value}))}>
                                      {["pending_payment", "agreement_signed", "awaiting_payment", "active", "suspended", "exited"].map(s => (
                                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div><label className={labelCls}>Start Date</label><input type="date" className={inputCls} value={editForm.start_date ?? ""} onChange={(e) => setEditForm(f => ({...f, start_date: e.target.value}))} /></div>
                                  <div><label className={labelCls}>Term End Date</label><input type="date" className={inputCls} value={editForm.term_end_date ?? ""} onChange={(e) => setEditForm(f => ({...f, term_end_date: e.target.value}))} /></div>
                                  <div><label className={labelCls}>Notes</label><input className={inputCls} value={editForm.notes ?? ""} onChange={(e) => setEditForm(f => ({...f, notes: e.target.value}))} /></div>
                                </div>
                              ) : (
                                <div className="grid sm:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <div className="text-white/40 text-xs mb-1">Phone</div>
                                    <div className="text-white">{p.phone || "—"}</div>
                                  </div>
                                  <div>
                                    <div className="text-white/40 text-xs mb-1">Activated</div>
                                    <div className="text-white">{p.activated_at ? fmt.shortDate(p.activated_at) : "—"}</div>
                                  </div>
                                  <div>
                                    <div className="text-white/40 text-xs mb-1">Term Ends</div>
                                    <div className="text-white">{p.term_end_date ? fmt.shortDate(p.term_end_date) : "—"}</div>
                                  </div>
                                  {p.notes && (
                                    <div>
                                      <div className="text-white/40 text-xs mb-1">Notes</div>
                                      <div className="text-white/70 text-xs">{p.notes.slice(0, 200)}</div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Payment progress */}
                              {(() => {
                                const committed = Number(p.committed_amount ?? p.investment_amount ?? 0);
                                const paid = Number(p.paid_amount ?? p.investment_amount ?? 0);
                                const pctDone = committed > 0 ? Math.min(100, (paid / committed) * 100) : 100;
                                const outstanding = committed - paid;
                                return (
                                  <div className="pt-2 border-t border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="text-white/40 text-xs uppercase tracking-widest">Investment Progress</div>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setLogPaymentPartnerId(p.id); setLogForm({ ...EMPTY_LOG_FORM }); }}
                                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#74c69d]/10 hover:bg-[#74c69d]/20 text-[#74c69d] border border-[#74c69d]/20 transition-colors font-semibold"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        Log Payment
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                      <div className="bg-[#1a3a2a] rounded-xl p-3">
                                        <div className="text-white/40 text-xs mb-1">Committed</div>
                                        <div className="text-white font-semibold">{fmt.naira(committed)}</div>
                                        {p.equity_committed_pct && <div className="text-amber-400 text-xs mt-0.5">{fmt.percent(Number(p.equity_committed_pct))}</div>}
                                      </div>
                                      <div className="bg-[#1a3a2a] rounded-xl p-3">
                                        <div className="text-white/40 text-xs mb-1">Paid-up</div>
                                        <div className="text-[#74c69d] font-semibold">{fmt.naira(paid)}</div>
                                        <div className="text-[#74c69d] text-xs mt-0.5">{fmt.percent(Number(p.equity_pct))}</div>
                                      </div>
                                      <div className="bg-[#1a3a2a] rounded-xl p-3">
                                        <div className="text-white/40 text-xs mb-1">Outstanding</div>
                                        <div className={`font-semibold ${outstanding > 0 ? "text-amber-400" : "text-[#74c69d]"}`}>{outstanding > 0 ? fmt.naira(outstanding) : "Complete"}</div>
                                        <div className="text-white/30 text-xs mt-0.5">{pctDone.toFixed(0)}% paid</div>
                                      </div>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full">
                                      <div className="h-2 rounded-full transition-all" style={{ width: `${pctDone}%`, background: pctDone >= 100 ? "#74c69d" : "#d4a843" }} />
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Installment history */}
                              <div className="pt-2 border-t border-white/5">
                                <div className="text-white/40 text-xs uppercase tracking-widest mb-3">Payment History</div>
                                {loadingInstallments === p.id ? (
                                  <div className="flex justify-center py-4"><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
                                ) : (installments[p.id] ?? []).length === 0 ? (
                                  <div className="text-white/30 text-xs py-2">No payments recorded yet.</div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="text-white/30">
                                          <th className="text-left pb-2">Date</th>
                                          <th className="text-left pb-2">Amount</th>
                                          <th className="text-left pb-2">Method</th>
                                          <th className="text-left pb-2">Reference</th>
                                          <th className="text-left pb-2">Notes</th>
                                          <th className="text-left pb-2">Receipt</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(installments[p.id] ?? []).map((inst) => (
                                          <tr key={inst.id} className="border-t border-white/5">
                                            <td className="py-2 pr-4 text-white/70">{fmt.shortDate(inst.payment_date)}</td>
                                            <td className="py-2 pr-4 text-[#d4a843] font-semibold">{fmt.naira(inst.amount)}</td>
                                            <td className="py-2 pr-4 text-white/50">{METHOD_LABEL[inst.method] ?? inst.method}</td>
                                            <td className="py-2 pr-4 text-white/40">{inst.reference ?? "—"}</td>
                                            <td className="py-2 pr-4 text-white/40">{inst.notes ?? "—"}</td>
                                            <td className="py-2">
                                              <a
                                                href={`/api/admin/partners/${p.id}/receipt?installment_id=${inst.id}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="text-white/40 hover:text-[#74c69d] transition-colors text-xs underline"
                                              >
                                                Receipt
                                              </a>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>

                              {/* KYC Data */}
                              {p.onboarding_completed && p.kyc_data && (
                                <div className="pt-2 border-t border-white/5 space-y-3">
                                  <div className="text-white/40 text-xs uppercase tracking-widest">KYC / Partner Profile</div>
                                  <div className="grid sm:grid-cols-3 gap-3 text-xs">
                                    {[
                                      ["Address", [p.kyc_data.address_line1, p.kyc_data.address_city, p.kyc_data.address_state, p.kyc_data.address_country].filter(Boolean).join(", ")],
                                      ["Postal Code", p.kyc_data.address_postal],
                                      ["Date of Birth", p.kyc_data.date_of_birth],
                                      ["Nationality", p.kyc_data.nationality],
                                      ["WhatsApp", p.kyc_data.whatsapp_number],
                                      ["ID Type", p.kyc_data.id_type],
                                      ["ID Number", p.kyc_data.id_number],
                                      ["Bank", p.kyc_data.bank_name],
                                      ["Account Number", p.kyc_data.bank_account_number],
                                      ["Account Name", p.kyc_data.bank_account_name],
                                      ["Account Type", p.kyc_data.bank_account_type],
                                      ["Next of Kin", p.kyc_data.nok_name],
                                      ["NOK Relationship", p.kyc_data.nok_relationship],
                                      ["NOK Phone", p.kyc_data.nok_phone],
                                      ["Occupation", p.kyc_data.occupation],
                                      ["Employer", p.kyc_data.employer],
                                      ["Source of Funds", p.kyc_data.source_of_funds],
                                    ].filter(([, v]) => v).map(([k, v]) => (
                                      <div key={k as string} className="bg-[#0f2a1e] rounded-lg px-3 py-2">
                                        <div className="text-white/30 mb-0.5">{k}</div>
                                        <div className="text-white/80 break-all">{v}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {!p.onboarding_completed && p.status === "active" && (
                                <div className="pt-2 border-t border-white/5">
                                  <div className="text-xs text-amber-400/70 bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2">
                                    Partner has not completed their KYC onboarding yet.
                                  </div>
                                </div>
                              )}

                              {/* Document links */}
                              <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-white/5">
                                <div className="text-white/30 text-xs">Documents:</div>
                                {p.agreement_token && (
                                  <a href={`/agreement/${p.agreement_token}`} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    View Agreement
                                  </a>
                                )}
                                {p.agreement_token && (
                                  <a href={`/api/agreement/${p.agreement_token}/print`} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Download PDF
                                  </a>
                                )}
                                <a href={`/api/admin/partners/${p.id}/receipt`} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                  Full Receipt
                                </a>
                              </div>

                              {/* Resend actions */}
                              <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-white/5">
                                <div className="text-white/30 text-xs">Resend:</div>
                                {p.agreement_token && (
                                  <button
                                    onClick={() => handleResend(p.id, "agreement")}
                                    disabled={resending === `${p.id}-agreement`}
                                    className="text-xs text-white/40 hover:text-[#74c69d] transition-colors disabled:opacity-50"
                                  >
                                    {resending === `${p.id}-agreement` ? "Sending..." : "Agreement link"}
                                  </button>
                                )}
                                {p.payment_token && ["awaiting_payment", "pending_payment"].includes(p.status) && (
                                  <button
                                    onClick={() => handleResend(p.id, "payment")}
                                    disabled={resending === `${p.id}-payment`}
                                    className="text-xs text-white/40 hover:text-[#74c69d] transition-colors disabled:opacity-50"
                                  >
                                    {resending === `${p.id}-payment` ? "Sending..." : "Payment link"}
                                  </button>
                                )}
                                {p.status === "active" && (
                                  <button
                                    onClick={() => handleResend(p.id, "welcome")}
                                    disabled={resending === `${p.id}-welcome`}
                                    className="text-xs text-white/40 hover:text-[#74c69d] transition-colors disabled:opacity-50"
                                  >
                                    {resending === `${p.id}-welcome` ? "Sending..." : "Welcome email"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
            {partners.length === 0 && (
              <div className="p-12 text-center text-white/30 text-sm">No partners yet. Use "Add Partner" to get started.</div>
            )}
          </div>
        </div>
      )}

      {/* Log Payment Modal */}
      {logPaymentPartnerId && logPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="bg-[#1a3a2a] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div>
                <h2 className="text-white font-bold">Log Payment</h2>
                <p className="text-white/40 text-xs mt-0.5">{logPartner.name} — {fmt.naira(Number(logPartner.committed_amount ?? logPartner.investment_amount ?? 0))} committed</p>
              </div>
              <button onClick={() => setLogPaymentPartnerId(null)} className="text-white/30 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Amount (₦) *</label>
                  <input
                    className={inputCls}
                    placeholder="1,500,000"
                    value={logForm.amount}
                    onChange={(e) => setLogForm(f => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Payment Date *</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={logForm.payment_date}
                    onChange={(e) => setLogForm(f => ({ ...f, payment_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Method *</label>
                  <select
                    className={inputCls}
                    value={logForm.method}
                    onChange={(e) => setLogForm(f => ({ ...f, method: e.target.value as any }))}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paystack">Paystack</option>
                    <option value="manual">Manual</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Reference / Receipt No.</label>
                  <input
                    className={inputCls}
                    placeholder="Optional"
                    value={logForm.reference}
                    onChange={(e) => setLogForm(f => ({ ...f, reference: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <input
                  className={inputCls}
                  placeholder="Optional"
                  value={logForm.notes}
                  onChange={(e) => setLogForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              {/* Equity preview */}
              {logForm.amount && Number(logForm.amount.replace(/,/g, "")) > 0 && (() => {
                const thisPmt = Number(logForm.amount.replace(/,/g, ""));
                const currentPaid = Number(logPartner.paid_amount ?? logPartner.investment_amount ?? 0);
                const newPaid = currentPaid + thisPmt;
                const newEquity = (newPaid / 20_000_000) * 20;
                const committed = Number(logPartner.committed_amount ?? logPartner.investment_amount ?? 0);
                return (
                  <div className="bg-[#0f2a1e] border border-white/5 rounded-xl p-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">New total paid</span>
                      <span className="text-white font-semibold">{fmt.naira(newPaid)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">New active equity</span>
                      <span className="text-[#74c69d] font-semibold">{newEquity.toFixed(3)}%</span>
                    </div>
                    {newPaid < committed && (
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Outstanding after</span>
                        <span className="text-amber-400">{fmt.naira(committed - newPaid)}</span>
                      </div>
                    )}
                    {newPaid >= committed && (
                      <div className="text-[#74c69d] text-xs font-semibold">Commitment complete after this payment</div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setLogPaymentPartnerId(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm transition-colors">
                Cancel
              </button>
              <button
                onClick={handleLogPayment}
                disabled={loggingPayment || !logForm.amount || !logForm.payment_date}
                className="flex-1 py-2.5 rounded-xl bg-[#74c69d] hover:bg-[#5dbc89] disabled:opacity-40 text-[#0f2a1e] font-bold text-sm transition-colors"
              >
                {loggingPayment ? "Recording..." : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="bg-[#1a3a2a] border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div>
                <h2 className="text-white font-bold">Add Partner Manually</h2>
                <p className="text-white/40 text-xs mt-0.5">Create a partner record and optionally send the agreement email.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white/30 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input className={inputCls} placeholder="John Doe" value={addForm.name} onChange={(e) => setAddForm(f => ({...f, name: e.target.value}))} />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input type="email" className={inputCls} placeholder="john@example.com" value={addForm.email} onChange={(e) => setAddForm(f => ({...f, email: e.target.value}))} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input className={inputCls} placeholder="+234..." value={addForm.phone} onChange={(e) => setAddForm(f => ({...f, phone: e.target.value}))} />
                </div>
                <div>
                  <label className={labelCls}>Committed Amount (₦) *</label>
                  <input className={inputCls} placeholder="5,000,000" value={addForm.investment_amount} onChange={(e) => setAddForm(f => ({...f, investment_amount: e.target.value}))} />
                </div>
                <div>
                  <label className={labelCls}>Start Date</label>
                  <input type="date" className={inputCls} value={addForm.start_date} onChange={(e) => setAddForm(f => ({...f, start_date: e.target.value}))} />
                </div>
                <div>
                  <label className={labelCls}>Notes</label>
                  <input className={inputCls} placeholder="Optional..." value={addForm.notes} onChange={(e) => setAddForm(f => ({...f, notes: e.target.value}))} />
                </div>
              </div>

              {addForm.investment_amount && Number(addForm.investment_amount.replace(/,/g, "")) > 0 && (
                <div className="bg-[#0f2a1e] border border-white/5 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-white/50 text-xs">Committed equity</span>
                  <span className="text-amber-400 font-bold text-sm">
                    {((Number(addForm.investment_amount.replace(/,/g, "")) / 20_000_000) * 20).toFixed(4)}%
                  </span>
                </div>
              )}

              <button
                onClick={() => setAddForm(f => ({...f, send_agreement: !f.send_agreement}))}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all text-sm ${addForm.send_agreement ? "border-[#74c69d]/40 bg-[#74c69d]/10 text-[#74c69d]" : "border-white/10 text-white/50"}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${addForm.send_agreement ? "bg-[#74c69d] border-[#74c69d]" : "border-white/30"}`}>
                    {addForm.send_agreement && <svg className="w-2.5 h-2.5 text-[#0f2a1e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  Send agreement email to partner automatically
                </div>
              </button>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAddPartner}
                disabled={adding || !addForm.name || !addForm.email || !addForm.investment_amount}
                className="flex-1 py-2.5 rounded-xl bg-[#74c69d] hover:bg-[#5dbc89] disabled:opacity-40 text-[#0f2a1e] font-bold text-sm transition-colors"
              >
                {adding ? "Adding..." : "Add Partner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
