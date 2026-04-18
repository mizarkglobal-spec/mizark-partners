"use client";
import { useEffect, useState } from "react";
import { fmt } from "@/lib/format";

interface FinancialRow {
  id: string;
  period: string;
  leadash_rev: number;
  academy_rev: number;
  total_rev: number;
  expenses: number;
  net_profit: number;
  notes: string | null;
  updated_at: string;
}

interface ModalData {
  period: string;
  leadash_rev: string;
  academy_rev: string;
  expenses: string;
  notes: string;
  isEdit: boolean;
  editId?: string;
}

const emptyModal: ModalData = {
  period: "",
  leadash_rev: "",
  academy_rev: "",
  expenses: "",
  notes: "",
  isEdit: false,
};

export default function AdminFinancialsPage() {
  const [rows, setRows] = useState<FinancialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/admin/financials");
    const d = await r.json();
    setRows(d.financials ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setModal({ ...emptyModal, period });
    setError("");
  }

  function openEdit(row: FinancialRow) {
    setModal({
      period: row.period,
      leadash_rev: String(row.leadash_rev),
      academy_rev: String(row.academy_rev),
      expenses: String(row.expenses),
      notes: row.notes ?? "",
      isEdit: true,
      editId: row.id,
    });
    setError("");
  }

  function previewNetProfit() {
    if (!modal) return null;
    const l = parseInt(modal.leadash_rev) || 0;
    const a = parseInt(modal.academy_rev) || 0;
    const e = parseInt(modal.expenses) || 0;
    return l + a - e;
  }

  async function handleSave() {
    if (!modal) return;
    setError("");
    if (!modal.period.match(/^\d{4}-\d{2}$/)) {
      setError("Period must be in YYYY-MM format");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/admin/financials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period: modal.period,
          leadash_rev: parseInt(modal.leadash_rev) || 0,
          academy_rev: parseInt(modal.academy_rev) || 0,
          expenses: parseInt(modal.expenses) || 0,
          notes: modal.notes || null,
          id: modal.editId,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setModal(null);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const r = await fetch("/api/admin/financials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      load();
    } catch (e: any) {
      alert("Delete failed: " + e.message);
    } finally {
      setDeletingId(null);
    }
  }

  const netPreview = previewNetProfit();

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Monthly Financials</h1>
          <p className="text-white/50 text-sm">Enter and manage monthly revenue and expense data.</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-[#40916c] hover:bg-[#2d6a4f] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          + Add Month
        </button>
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
                  {["Period", "Leadash Rev", "Academy Rev", "Total Rev", "Expenses", "Net Profit", "Updated", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{fmt.month(row.period)}</td>
                    <td className="px-4 py-3 text-white/70">{fmt.naira(row.leadash_rev)}</td>
                    <td className="px-4 py-3 text-white/70">{fmt.naira(row.academy_rev)}</td>
                    <td className="px-4 py-3 text-white/70">{fmt.naira(row.total_rev)}</td>
                    <td className="px-4 py-3 text-white/70">{fmt.naira(row.expenses)}</td>
                    <td className={`px-4 py-3 font-semibold ${row.net_profit >= 0 ? "text-[#74c69d]" : "text-red-400"}`}>
                      {fmt.naira(row.net_profit)}
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs">{fmt.shortDate(row.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(row)}
                          className="text-[#74c69d] hover:text-white text-xs hover:underline transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${fmt.month(row.period)}? This cannot be undone.`)) {
                              handleDelete(row.id);
                            }
                          }}
                          disabled={deletingId === row.id}
                          className="text-red-400 hover:text-red-300 text-xs hover:underline transition-colors disabled:opacity-40"
                        >
                          {deletingId === row.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="p-12 text-center text-white/30 text-sm">No financial data yet. Add your first month.</div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-5">
              {modal.isEdit ? `Edit ${modal.period}` : "Add Month"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white/60 text-xs mb-1">Period (YYYY-MM)</label>
                <input
                  type="text"
                  value={modal.period}
                  onChange={(e) => setModal({ ...modal, period: e.target.value })}
                  disabled={modal.isEdit}
                  placeholder="2024-01"
                  className="w-full bg-[#0f2a1e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-[#40916c]"
                />
              </div>
              {[
                { key: "leadash_rev" as const, label: "Leadash Revenue (₦)" },
                { key: "academy_rev" as const, label: "Academy Revenue (₦)" },
                { key: "expenses" as const, label: "Total Expenses (₦)" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-white/60 text-xs mb-1">{label}</label>
                  <input
                    type="number"
                    value={modal[key]}
                    onChange={(e) => setModal({ ...modal, [key]: e.target.value })}
                    className="w-full bg-[#0f2a1e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#40916c]"
                  />
                </div>
              ))}
              {netPreview !== null && (
                <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                  netPreview >= 0 ? "bg-green-900/30 border border-green-700 text-[#74c69d]" : "bg-red-900/30 border border-red-700 text-red-400"
                }`}>
                  Net Profit Preview: {fmt.naira(netPreview)}
                </div>
              )}
              <div>
                <label className="block text-white/60 text-xs mb-1">Notes (optional)</label>
                <textarea
                  value={modal.notes}
                  onChange={(e) => setModal({ ...modal, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-[#0f2a1e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#40916c] resize-none"
                />
              </div>
            </div>
            {error && (
              <div className="mt-3 text-red-400 text-sm">{error}</div>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setModal(null)}
                className="flex-1 border border-white/20 text-white/70 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#40916c] hover:bg-[#2d6a4f] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
