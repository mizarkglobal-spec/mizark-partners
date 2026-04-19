"use client";
import { useEffect, useState } from "react";
import { fmt } from "@/lib/format";
import { PROJECTION_DEFAULTS, computeYearSummaries, fmtN, type YearSummary } from "@/lib/projections";

type Status = "all" | "pending" | "approved" | "rejected";

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  amount_intent: number;
  motivation: string;
  status: string;
  created_at: string;
  pitch_token: string | null;
  review_note: string | null;
}

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status>("all");
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [projYears, setProjYears] = useState<YearSummary[]>([]);

  async function load() {
    setLoading(true);
    const url = filter === "all" ? "/api/admin/applications" : `/api/admin/applications?status=${filter}`;
    const r = await fetch(url);
    const d = await r.json();
    setApps(d.applications ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    fetch("/api/admin/projections")
      .then((r) => r.json())
      .then((d) => {
        const assumptions = { ...PROJECTION_DEFAULTS, ...(d.projections ?? {}) };
        setProjYears(computeYearSummaries(assumptions));
      })
      .catch(() => setProjYears(computeYearSummaries(PROJECTION_DEFAULTS)));
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete application from ${name}? This cannot be undone.`)) return;
    setActionLoading(`delete-${id}`);
    const r = await fetch("/api/admin/applications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const d = await r.json();
    if (!r.ok) alert(d.error);
    else { setApps((prev) => prev.filter((a) => a.id !== id)); if (expandedId === id) setExpandedId(null); }
    setActionLoading(null);
  }

  async function handleApprove(id: string) {
    setActionLoading(id);
    const r = await fetch(`/api/admin/applications/${id}/approve`, { method: "POST" });
    const d = await r.json();
    if (!r.ok) alert(d.error);
    else load();
    setActionLoading(null);
  }

  async function handleReject() {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    const r = await fetch(`/api/admin/applications/${rejectModal.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: rejectNote }),
    });
    const d = await r.json();
    if (!r.ok) alert(d.error);
    else { load(); setRejectModal(null); setRejectNote(""); }
    setActionLoading(null);
  }

  const statusColor = (s: string) => {
    switch (s) {
      case "pending": return "bg-yellow-900/50 text-yellow-300 border border-yellow-700";
      case "approved": return "bg-green-900/50 text-green-300 border border-green-700";
      case "rejected": return "bg-red-900/50 text-red-300 border border-red-700";
      default: return "bg-gray-900/50 text-gray-300 border border-gray-700";
    }
  };

  const yearColors = [
    { label: "Year 1", bg: "#1a3a2a", accent: "#74c69d", border: "rgba(116,198,157,0.2)" },
    { label: "Year 2", bg: "#1a1400", accent: "#d4a843", border: "rgba(212,168,67,0.2)" },
    { label: "Year 3", bg: "#0f0a1e", accent: "#a78bfa", border: "rgba(167,139,250,0.2)" },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Applications</h1>
        <p className="text-white/50 text-sm">Review and approve partnership applications.</p>
      </div>

      {/* Projection Summary */}
      {projYears.length > 0 && (
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3 font-medium">Financial Projections</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {projYears.map((y, i) => {
              const cs = yearColors[i];
              const academyRev = y.total_challenge_revenue + y.total_academy_revenue;
              return (
                <div
                  key={y.year}
                  className="rounded-2xl p-5 border"
                  style={{ background: cs.bg, borderColor: cs.border }}
                >
                  <p className="text-xs uppercase tracking-wider mb-3" style={{ color: cs.accent }}>{cs.label}</p>
                  <p className="text-white font-bold text-xl mb-0.5">{fmtN(y.total_revenue)}</p>
                  <p className="text-xs text-white/40 mb-3">Total Revenue</p>
                  <div className="pt-3 border-t space-y-1.5" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Academy Funnel</span>
                      <span className="font-semibold text-white/70">{fmtN(academyRev)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Leadash SaaS</span>
                      <span className="font-semibold text-white/70">{fmtN(y.total_leadash_revenue)}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1.5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      <span className="text-white/40">Net Profit</span>
                      <span className="font-bold" style={{ color: cs.accent }}>{fmtN(y.net_profit)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === s ? "bg-[#2d6a4f] text-white" : "bg-[#1a3a2a] text-white/50 hover:text-white border border-white/10"
            }`}
          >
            {s}
          </button>
        ))}
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
                  {["Name", "Email", "Amount", "Status", "Date", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <>
                    <tr
                      key={app.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                    >
                      <td className="px-4 py-3 text-white font-medium">{app.name}</td>
                      <td className="px-4 py-3 text-white/70">{app.email}</td>
                      <td className="px-4 py-3 text-[#d4a843] font-semibold">{fmt.naira(app.amount_intent)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${statusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/50">{fmt.shortDate(app.created_at)}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 flex-wrap">
                          {app.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(app.id)}
                                disabled={actionLoading === app.id}
                                className="bg-[#40916c] hover:bg-[#2d6a4f] disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                              >
                                {actionLoading === app.id ? "..." : "Approve"}
                              </button>
                              <button
                                onClick={() => setRejectModal({ id: app.id, name: app.name })}
                                className="bg-red-900/50 hover:bg-red-900/70 text-red-300 text-xs px-3 py-1.5 rounded-lg border border-red-700 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {app.status === "approved" && app.pitch_token && (
                            <a
                              href={`/pitch/${app.pitch_token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#74c69d] text-xs hover:underline"
                            >
                              View Pitch →
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(app.id, app.name)}
                            disabled={actionLoading === `delete-${app.id}`}
                            className="text-white/20 hover:text-red-400 disabled:opacity-50 transition-colors p-1"
                            title="Delete application"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === app.id && (
                      <tr key={`${app.id}-exp`} className="bg-[#0f2a1e]">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-white/40 text-xs mb-1">Phone</div>
                              <div className="text-white">{app.phone || "—"}</div>
                            </div>
                            <div>
                              <div className="text-white/40 text-xs mb-1">Location</div>
                              <div className="text-white">{app.location || "—"}</div>
                            </div>
                            {app.review_note && (
                              <div>
                                <div className="text-white/40 text-xs mb-1">Review Note</div>
                                <div className="text-white">{app.review_note}</div>
                              </div>
                            )}
                            <div className="sm:col-span-3">
                              <div className="text-white/40 text-xs mb-1">Motivation</div>
                              <div className="text-white/70">{app.motivation || "—"}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            {apps.length === 0 && (
              <div className="p-12 text-center text-white/30 text-sm">No applications found.</div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Reject Application</h3>
            <p className="text-white/50 text-sm mb-4">
              Reject <strong className="text-white">{rejectModal.name}</strong>? You can optionally add a note.
            </p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              placeholder="Optional note (will be emailed to applicant)..."
              className="w-full bg-[#0f2a1e] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#40916c] resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectNote(""); }}
                className="flex-1 border border-white/20 text-white/70 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!!actionLoading}
                className="flex-1 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {actionLoading ? "Rejecting..." : "Reject Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
