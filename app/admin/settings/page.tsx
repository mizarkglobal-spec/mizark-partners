"use client";
import { useEffect, useState } from "react";
import { fmt } from "@/lib/format";

// ── Admin Users ───────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  status: "invited" | "active" | "revoked";
  invited_by: string | null;
  invited_at: string;
  activated_at: string | null;
}

function AdminUsersSection() {
  const [admins, setAdmins]       = useState<AdminUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName]   = useState("");
  const [inviting, setInviting]   = useState(false);
  const [revoking, setRevoking]   = useState<string | null>(null);
  const [feedback, setFeedback]   = useState("");

  function load() {
    setLoading(true);
    fetch("/api/admin/admins")
      .then((r) => r.json())
      .then((d) => { setAdmins(d.admins ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setFeedback("");
    setInviting(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, name: inviteName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFeedback("Invite sent!");
      setInviteEmail("");
      setInviteName("");
      load();
    } catch (e: any) {
      setFeedback(e.message ?? "Failed to invite");
    } finally {
      setInviting(false);
      setTimeout(() => setFeedback(""), 4000);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this admin's access?")) return;
    setRevoking(id);
    await fetch(`/api/admin/admins/${id}`, { method: "DELETE" }).catch(() => {});
    setRevoking(null);
    load();
  }

  const statusBadge: Record<string, string> = {
    invited: "bg-amber-900/30 text-amber-300 border border-amber-700/30",
    active:  "bg-emerald-900/30 text-emerald-300 border border-emerald-700/30",
    revoked: "bg-red-900/20 text-red-400 border border-red-700/20",
  };

  return (
    <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-5 col-span-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-white font-semibold text-sm">Admin Users</h2>
      </div>

      {/* Invite form */}
      <form onSubmit={handleInvite} className="flex gap-2 flex-wrap">
        <input
          type="text"
          value={inviteName}
          onChange={(e) => setInviteName(e.target.value)}
          placeholder="Name (optional)"
          className="flex-1 min-w-[140px] bg-[#0f2a1e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#74c69d]/50 transition-colors placeholder:text-white/30"
        />
        <input
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="Email address"
          required
          className="flex-[2] min-w-[180px] bg-[#0f2a1e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#74c69d]/50 transition-colors placeholder:text-white/30"
        />
        <button
          type="submit"
          disabled={inviting}
          className="px-5 py-2.5 bg-[#74c69d] hover:bg-[#5dbc89] disabled:opacity-50 text-[#0f2a1e] font-bold text-sm rounded-xl transition-colors whitespace-nowrap"
        >
          {inviting ? "Sending…" : "Send Invite"}
        </button>
      </form>

      {feedback && (
        <p className={`text-xs px-1 ${feedback === "Invite sent!" ? "text-[#74c69d]" : "text-red-400"}`}>
          {feedback}
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : admins.length === 0 ? (
        <p className="text-white/30 text-xs">No additional admins invited yet.</p>
      ) : (
        <div className="space-y-2">
          {admins.map((a) => (
            <div key={a.id} className="flex items-center gap-3 bg-[#0f2a1e] rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{a.name || a.email}</div>
                {a.name && <div className="text-white/40 text-xs truncate">{a.email}</div>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[a.status]}`}>
                {a.status}
              </span>
              {a.status !== "revoked" && (
                <button
                  onClick={() => handleRevoke(a.id)}
                  disabled={revoking === a.id}
                  className="text-white/30 hover:text-red-400 transition-colors text-xs ml-1"
                  title="Revoke access"
                >
                  {revoking === a.id ? "…" : "Revoke"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-white/20 text-xs">
        Invited admins receive a magic link via email. They will have full admin access once they sign in.
      </p>
    </div>
  );
}

const SETUP_SQL = `-- Run this once in your Supabase SQL editor
CREATE TABLE IF NOT EXISTS program_config (
  id      int PRIMARY KEY,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO program_config (id, settings) VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;`;

interface Settings {
  total_pool_amount: number;
  total_equity_pct: number;
  profit_dist_pct: number;
  max_partners: number;
  min_investment: number;
  term_years: number;
  company_valuation: number | null;
  founder_name: string;
  company_name: string;
  programme_name: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tableExists, setTableExists] = useState(true);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings);
        setTableExists(d.tableExists ?? true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  function set(key: keyof Settings, value: any) {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  const inputClass = "w-full bg-[#0f2a1e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#74c69d]/50 transition-colors";
  const labelClass = "block text-white/60 text-xs mb-1.5";

  if (loading) {
    return (
      <div className="p-8 flex justify-center pt-20">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  // Derived values for preview
  const impliedValuation = settings.company_valuation
    ? fmt.naira(settings.company_valuation)
    : `Implied: ${fmt.naira(Math.round(settings.total_pool_amount / (settings.total_equity_pct / 100)))}`;

  const equityPerSlot = settings.total_equity_pct / settings.max_partners;
  const investmentPerSlot = settings.total_pool_amount / settings.max_partners;

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Programme Settings</h1>
          <p className="text-white/50 text-sm">Configure the partnership pool, equity structure, and terms. Changes apply to new partners only.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#74c69d] hover:bg-[#5dbc89] disabled:opacity-50 text-[#0f2a1e] font-bold text-sm transition-colors"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Saving...
            </>
          ) : saved ? "✓ Saved!" : "Save Changes"}
        </button>
      </div>

      {/* DB setup notice */}
      {!tableExists && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="text-amber-300 font-semibold text-sm mb-1">Database setup required</div>
              <p className="text-amber-400/70 text-xs mb-3">The <code className="bg-amber-900/40 px-1 rounded">program_config</code> table doesn&apos;t exist yet. Run the SQL below in your Supabase editor to enable persistent settings.</p>
              <button
                onClick={() => setShowSql(!showSql)}
                className="text-xs text-amber-400 hover:text-amber-300 underline"
              >
                {showSql ? "Hide SQL" : "Show SQL to run"}
              </button>
              {showSql && (
                <pre className="mt-3 bg-[#0a1a10] border border-white/10 rounded-xl p-4 text-xs text-white/70 overflow-x-auto">
                  {SETUP_SQL}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Preview */}
      <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5">
        <div className="text-white/40 text-xs uppercase tracking-widest mb-3">Live Preview — Per-Partner Defaults</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-white/40 text-xs mb-1">Equity per slot</div>
            <div className="text-[#74c69d] font-bold">{equityPerSlot.toFixed(4)}%</div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Investment per slot</div>
            <div className="text-[#d4a843] font-bold">{fmt.naira(investmentPerSlot)}</div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Implied valuation</div>
            <div className="text-white font-semibold text-xs">{impliedValuation}</div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Partner profit pool</div>
            <div className="text-white font-semibold">{settings.profit_dist_pct}% of net profit</div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">

        {/* Pool Configuration */}
        <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#d4a843]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#d4a843]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-white font-semibold text-sm">Pool Configuration</h2>
          </div>

          <div>
            <label className={labelClass}>Total Investment Pool (₦)</label>
            <input
              type="number"
              value={settings.total_pool_amount}
              onChange={(e) => set("total_pool_amount", Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Total Equity Offered to Partners (%)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="49"
              value={settings.total_equity_pct}
              onChange={(e) => set("total_equity_pct", Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Max Partners (Slots)</label>
            <input
              type="number"
              min="1"
              value={settings.max_partners}
              onChange={(e) => set("max_partners", Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Minimum Investment per Partner (₦)</label>
            <input
              type="number"
              value={settings.min_investment}
              onChange={(e) => set("min_investment", Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        {/* Profit & Term */}
        <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#74c69d]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#74c69d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-white font-semibold text-sm">Profit & Term</h2>
          </div>

          <div>
            <label className={labelClass}>Profit Distribution to Partners (%)</label>
            <input
              type="number"
              step="1"
              min="1"
              max="100"
              value={settings.profit_dist_pct}
              onChange={(e) => set("profit_dist_pct", Number(e.target.value))}
              className={inputClass}
            />
            <p className="text-white/30 text-xs mt-1">% of quarterly net profit paid out to all partners proportionally</p>
          </div>
          <div>
            <label className={labelClass}>Partnership Term (Years)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.term_years}
              onChange={(e) => set("term_years", Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Company Valuation (₦) — Optional</label>
            <input
              type="number"
              value={settings.company_valuation ?? ""}
              placeholder="Leave blank to auto-calculate"
              onChange={(e) => set("company_valuation", e.target.value ? Number(e.target.value) : null)}
              className={inputClass}
            />
            <p className="text-white/30 text-xs mt-1">Used for display only. Blank = implied from pool ÷ equity %</p>
          </div>
        </div>

        {/* Company Details */}
        <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-white font-semibold text-sm">Company Details</h2>
          </div>

          <div>
            <label className={labelClass}>Company Name</label>
            <input
              type="text"
              value={settings.company_name}
              onChange={(e) => set("company_name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Programme Name</label>
            <input
              type="text"
              value={settings.programme_name}
              onChange={(e) => set("programme_name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Founder Name (for agreements)</label>
            <input
              type="text"
              value={settings.founder_name}
              onChange={(e) => set("founder_name", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-[#0f2a1e] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-white/40 text-xs uppercase tracking-widest mb-3">Important Notes</div>
            <ul className="space-y-3 text-white/50 text-xs leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#d4a843] flex-shrink-0 mt-0.5">→</span>
                Changes here affect <strong className="text-white/70">new partners only</strong>. Existing signed agreements are locked to their original terms.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#d4a843] flex-shrink-0 mt-0.5">→</span>
                Equity % and amounts in the agreement text are calculated from pool size ÷ partner investment.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#d4a843] flex-shrink-0 mt-0.5">→</span>
                If you increase the pool, manually re-invite partners or adjust existing equity stakes via the Partners page.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#d4a843] flex-shrink-0 mt-0.5">→</span>
                The profit distribution % is informational only — actual distributions are recorded manually in Distributions.
              </li>
            </ul>
          </div>
          <div className="mt-6 pt-5 border-t border-white/5">
            <div className="text-white/30 text-xs">Settings saved to Supabase <code className="bg-white/5 px-1.5 py-0.5 rounded">program_config</code> table.</div>
          </div>
        </div>

        <AdminUsersSection />

      </div>
    </div>
  );
}
