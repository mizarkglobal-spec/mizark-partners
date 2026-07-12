"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  DIVISIONS, TYPES, CATEGORIES, CATEGORY_DIVISION_DEFAULTS,
  computePeriodSummary, estimateCIT, estimateEducationTax, estimateVATOutput,
  type FinancialTransaction, type Division, type TxType,
} from "@/lib/financials";
import { fmtN } from "@/lib/projections";

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n === 0) return "—";
  return fmtN(n);
}

function cls(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

const inputCls = "w-full bg-[#0f2a1e] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#74c69d]/50";
const labelCls = "block text-white/50 text-xs mb-1";

const DIV_COLORS: Record<Division, { accent: string; bg: string }> = {
  learn_mizark: { accent: "#74c69d", bg: "rgba(116,198,157,0.07)" },
  leadash:      { accent: "#60a5fa", bg: "rgba(96,165,250,0.07)" },
  shared:       { accent: "#a78bfa", bg: "rgba(167,139,250,0.07)" },
};
const TYPE_COLORS: Record<TxType, string> = {
  revenue: "text-[#74c69d]",
  cogs:    "text-red-400",
  opex:    "text-amber-400",
  tax:     "text-purple-400",
};

// ─── period helpers ───────────────────────────────────────────────────────────
function todayYYYYMM() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function periodRange(yyyymm: string): { start: string; end: string } | null {
  if (yyyymm === "all") return null;
  const [y, m] = yyyymm.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${lastDay}`;
  return { start, end };
}

function formatPeriodLabel(yyyymm: string) {
  if (yyyymm === "all") return "All time";
  const [y, m] = yyyymm.split("-").map(Number);
  return new Date(y, m - 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

// ─── form types ───────────────────────────────────────────────────────────────
interface TxForm {
  date: string;
  division: Division;
  type: TxType;
  category: string;
  amount: string;
  description: string;
  reference: string;
}

function blankForm(): TxForm {
  return {
    date: new Date().toISOString().slice(0, 10),
    division: "learn_mizark",
    type: "revenue",
    category: "revenue.challenge",
    amount: "",
    description: "",
    reference: "",
  };
}

// ─── P&L table sub-components ────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <tr className="bg-white/[0.03]">
      <td colSpan={5} className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-white/30 font-semibold">{label}</td>
    </tr>
  );
}

function PLRow({ label, lm, ld, sh, total, indent, accent, dimZero }: {
  label: string; lm: number; ld: number; sh: number; total: number;
  indent?: boolean; accent?: string; dimZero?: boolean;
}) {
  const cell = (v: number) => {
    const zero = v === 0 && dimZero;
    return (
      <td className={cls("px-4 py-2 text-right text-sm", zero ? "text-white/20" : "")}
        style={!zero && accent ? { color: accent } : undefined}>
        {zero ? "—" : fmt(v)}
      </td>
    );
  };
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
      <td className={cls("px-4 py-2 text-sm text-white/60", indent && "pl-8")}>{label}</td>
      {cell(lm)}{cell(ld)}{cell(sh)}{cell(total)}
    </tr>
  );
}

function TotalRow({ label, lm, ld, sh, total, accent }: {
  label: string; lm: number; ld: number; sh: number; total: number; accent?: string;
}) {
  const cell = (v: number) => (
    <td className="px-4 py-3 text-right font-bold" style={{ color: accent ?? (v >= 0 ? "#74c69d" : "#f87171") }}>
      {fmt(v)}
    </td>
  );
  return (
    <tr className="border-t-2 border-white/20 bg-white/[0.04]">
      <td className="px-4 py-3 font-bold text-white text-sm">{label}</td>
      {cell(lm)}{cell(ld)}{cell(sh)}{cell(total)}
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
interface LeadashSync {
  id: string;
  period_month: string;
  payload: {
    revenue?: Record<string, number>;
    total_revenue?: number;
    total_cogs?: number;
    total_opex?: number;
    total_tax_expense?: number;
    net_profit?: number;
    transaction_count?: number;
  };
  status: "pending" | "approved" | "rejected" | "stale";
  synced_at: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_note: string | null;
}

const SYNC_STATUS_STYLES: Record<LeadashSync["status"], string> = {
  pending:  "bg-[#d4a843]/15 text-[#d4a843]",
  approved: "bg-[#74c69d]/15 text-[#74c69d]",
  rejected: "bg-[#f87171]/15 text-[#f87171]",
  stale:    "bg-white/10 text-white/40",
};

export default function FinancialsPage() {
  const [tab, setTab] = useState<"dashboard" | "ledger" | "tax" | "syncs">("dashboard");
  const [syncs, setSyncs] = useState<LeadashSync[]>([]);
  const [syncsLoading, setSyncsLoading] = useState(false);
  const [syncActing, setSyncActing] = useState<string | null>(null);
  const [period, setPeriod] = useState(todayYYYYMM());
  const [txs, setTxs] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDiv, setFilterDiv] = useState<"all" | Division>("all");
  const [filterType, setFilterType] = useState<"all" | TxType>("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editTx, setEditTx] = useState<FinancialTransaction | null>(null);
  const [form, setForm] = useState<TxForm>(blankForm());
  const [saving, setSaving] = useState(false);

  const loadTxs = useCallback(async () => {
    setLoading(true);
    const range = periodRange(period);
    const params = new URLSearchParams();
    if (range) { params.set("start", range.start); params.set("end", range.end); }
    const r = await fetch(`/api/admin/financials/transactions?${params}`);
    const d = await r.json();
    setTxs(d.transactions ?? []);
    setLoading(false);
  }, [period]);

  useEffect(() => { loadTxs(); }, [loadTxs]);

  const loadSyncs = useCallback(async () => {
    setSyncsLoading(true);
    try {
      const r = await fetch("/api/admin/leadash-syncs");
      const d = await r.json();
      setSyncs(d.syncs ?? []);
    } finally {
      setSyncsLoading(false);
    }
  }, []);

  useEffect(() => { if (tab === "syncs") loadSyncs(); }, [tab, loadSyncs]);

  async function handleSyncAction(id: string, action: "approve" | "reject") {
    let note: string | undefined;
    if (action === "reject") {
      note = window.prompt("Rejection note (why are these figures not ready for investors)?") ?? undefined;
      if (note === undefined) return;
    } else if (!window.confirm("Approve this month's Leadash figures for investor reporting?")) {
      return;
    }
    setSyncActing(id);
    try {
      const r = await fetch("/api/admin/leadash-syncs", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, action, note }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        alert(d.error ?? "Action failed");
      }
      await loadSyncs();
    } finally {
      setSyncActing(null);
    }
  }

  const summary = useMemo(() => computePeriodSummary(txs), [txs]);
  const { learn_mizark: lm, leadash: ld, shared: sh, total } = summary.divisions;

  const filteredTxs = useMemo(() => txs.filter((tx) => {
    if (filterDiv !== "all" && tx.division !== filterDiv) return false;
    if (filterType !== "all" && tx.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (tx.description ?? "").toLowerCase().includes(q) ||
        (tx.reference ?? "").toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        (CATEGORIES[tx.type][tx.category] ?? "").toLowerCase().includes(q);
    }
    return true;
  }), [txs, filterDiv, filterType, search]);

  // P&L helper: collect all non-zero categories across all divisions for a type
  function catRows(type: TxType) {
    const cats = new Set([...Object.keys(lm[type]), ...Object.keys(ld[type]), ...Object.keys(sh[type])]);
    return Array.from(cats).map((cat) => ({
      cat, label: CATEGORIES[type][cat] ?? cat,
      lmV: lm[type][cat] ?? 0, ldV: ld[type][cat] ?? 0,
      shV: sh[type][cat] ?? 0, tot: total[type][cat] ?? 0,
    }));
  }

  // ─── modal helpers ─────────────────────────────────────────────────────────
  function openAdd() { setForm(blankForm()); setEditTx(null); setModal("add"); }
  function openEdit(tx: FinancialTransaction) {
    setForm({ date: tx.date, division: tx.division, type: tx.type, category: tx.category,
      amount: String(tx.amount), description: tx.description ?? "", reference: tx.reference ?? "" });
    setEditTx(tx); setModal("edit");
  }

  function setF<K extends keyof TxForm>(k: K, v: TxForm[K]) {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "category") next.division = CATEGORY_DIVISION_DEFAULTS[v as string] ?? f.division;
      if (k === "type") {
        const firstCat = Object.keys(CATEGORIES[v as TxType])[0];
        next.category = firstCat;
        next.division = CATEGORY_DIVISION_DEFAULTS[firstCat] ?? "shared";
      }
      return next;
    });
  }

  async function handleSave() {
    if (!form.amount || !form.category) return;
    setSaving(true);
    const payload = { date: form.date, division: form.division, type: form.type,
      category: form.category, amount: parseFloat(form.amount),
      description: form.description || null, reference: form.reference || null };
    const isEdit = modal === "edit" && editTx;
    const url = isEdit ? `/api/admin/financials/transactions/${editTx.id}` : "/api/admin/financials/transactions";
    const r = await fetch(url, { method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!r.ok) { const d = await r.json(); alert(d.error); return; }
    setModal(null); loadTxs();
  }

  async function handleDelete(tx: FinancialTransaction) {
    if (!confirm(`Delete: ${CATEGORIES[tx.type][tx.category] ?? tx.category} — ${fmtN(tx.amount)}?`)) return;
    const r = await fetch(`/api/admin/financials/transactions/${tx.id}`, { method: "DELETE" });
    if (r.ok) setTxs((p) => p.filter((t) => t.id !== tx.id));
    else { const d = await r.json(); alert(d.error); }
  }

  // ─── Tax estimates ─────────────────────────────────────────────────────────
  const annFactor = period === "all" ? 1 : 12;
  const annEbitda = total.ebitda * annFactor;
  const annRevenue = total.total_revenue * annFactor;
  const citEstimate = estimateCIT(annEbitda, annRevenue);
  const eduEstimate = estimateEducationTax(annEbitda);
  const vatEstimate = estimateVATOutput(total.total_revenue);
  const citRate = annRevenue >= 100_000_000 ? "30%" : annRevenue >= 25_000_000 ? "20%" : "0% (small company)";

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Financials</h1>
          <p className="text-white/40 text-sm">Transaction-level P&amp;L across Learn by Mizark and Leadash.</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}
            className="bg-[#1a3a2a] border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none">
            <option value="all">All time</option>
            {Array.from({ length: 48 }, (_, i) => {
              const d = new Date(2026, 4 + i);
              const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
              return <option key={val} value={val}>{d.toLocaleDateString("en-NG", { month: "long", year: "numeric" })}</option>;
            })}
          </select>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-[#74c69d] hover:bg-[#5dbc89] text-[#0f2a1e] font-bold text-sm px-4 py-2 rounded-xl transition-colors">
            <span className="text-lg leading-none">+</span> Add Transaction
          </button>
        </div>
      </div>

      <p className="text-white/30 text-xs -mt-2">
        {formatPeriodLabel(period)}
        {!loading && <span className="ml-3 text-white/20">· {txs.length} transaction{txs.length !== 1 ? "s" : ""}</span>}
      </p>

      {/* KPI cards */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Revenue",  value: total.total_revenue,  accent: "#74c69d" },
            { label: "Gross Profit",   value: total.gross_profit,   sub: total.total_revenue > 0 ? `${total.gross_margin_pct.toFixed(1)}% margin` : undefined, accent: total.gross_profit >= 0 ? "#74c69d" : "#f87171" },
            { label: "EBITDA",         value: total.ebitda,         accent: total.ebitda >= 0 ? "#d4a843" : "#f87171" },
            { label: "Net Profit",     value: total.net_profit,     accent: total.net_profit >= 0 ? "#a78bfa" : "#f87171" },
          ].map((c) => (
            <div key={c.label} className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-4">
              <p className="text-white/40 text-xs mb-2">{c.label}</p>
              <p className="font-bold text-xl" style={{ color: c.accent }}>{fmt(c.value)}</p>
              {c.sub && <p className="text-white/30 text-xs mt-0.5">{c.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0a1f15] rounded-xl p-1 w-fit">
        {(["dashboard", "ledger", "tax", "syncs"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cls("px-5 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t ? "bg-[#1a3a2a] text-white" : "text-white/40 hover:text-white/70")}>
            {t === "dashboard" ? "P&L" : t === "tax" ? "Tax & Compliance" : t === "syncs" ? "Leadash Syncs" : "Ledger"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── P&L DASHBOARD ────────────────────────────────────────────── */}
          {tab === "dashboard" && (
            txs.length === 0 ? (
              <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-12 text-center">
                <p className="text-white/30 text-sm mb-3">No transactions for this period.</p>
                <button onClick={openAdd} className="text-[#74c69d] text-sm hover:underline">Add the first transaction →</button>
              </div>
            ) : (
              <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase w-56">Line Item</th>
                        {(["learn_mizark", "leadash", "shared", "total"] as const).map((d) => (
                          <th key={d} className="text-right px-4 py-3 text-xs font-medium uppercase whitespace-nowrap"
                            style={{ color: d === "total" ? "#fff" : DIV_COLORS[d as Division]?.accent }}>
                            {d === "total" ? "Total" : DIVISIONS[d as Division]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <SectionHeader label="Revenue" />
                      {catRows("revenue").map(({ cat, label, lmV, ldV, shV, tot }) => (
                        <PLRow key={cat} label={label} lm={lmV} ld={ldV} sh={shV} total={tot} indent accent="#74c69d" dimZero />
                      ))}
                      <TotalRow label="Total Revenue" lm={lm.total_revenue} ld={ld.total_revenue} sh={sh.total_revenue} total={total.total_revenue} accent="#74c69d" />

                      <SectionHeader label="Cost of Sales" />
                      {catRows("cogs").map(({ cat, label, lmV, ldV, shV, tot }) => (
                        <PLRow key={cat} label={label} lm={lmV} ld={ldV} sh={shV} total={tot} indent dimZero />
                      ))}
                      <TotalRow label="Total COGS" lm={lm.total_cogs} ld={ld.total_cogs} sh={sh.total_cogs} total={total.total_cogs} accent="#f87171" />

                      <TotalRow label="Gross Profit" lm={lm.gross_profit} ld={ld.gross_profit} sh={sh.gross_profit} total={total.gross_profit} />
                      <PLRow label="Gross Margin %" lm={lm.gross_margin_pct} ld={ld.gross_margin_pct} sh={sh.gross_margin_pct} total={total.gross_margin_pct} dimZero />

                      <SectionHeader label="Operating Expenses" />
                      {catRows("opex").map(({ cat, label, lmV, ldV, shV, tot }) => (
                        <PLRow key={cat} label={label} lm={lmV} ld={ldV} sh={shV} total={tot} indent dimZero />
                      ))}
                      <TotalRow label="Total OpEx" lm={lm.total_opex} ld={ld.total_opex} sh={sh.total_opex} total={total.total_opex} accent="#f87171" />

                      <TotalRow label="EBITDA" lm={lm.ebitda} ld={ld.ebitda} sh={sh.ebitda} total={total.ebitda} />

                      <SectionHeader label="Tax & Compliance (recorded)" />
                      {catRows("tax").map(({ cat, label, lmV, ldV, shV, tot }) => (
                        <PLRow key={cat} label={label} lm={lmV} ld={ldV} sh={shV} total={tot} indent dimZero />
                      ))}
                      <TotalRow label="Total Tax Expense" lm={lm.total_tax_expense} ld={ld.total_tax_expense} sh={sh.total_tax_expense} total={total.total_tax_expense} accent="#f87171" />

                      <TotalRow label="Net Profit (after tax)" lm={lm.net_profit} ld={ld.net_profit} sh={sh.net_profit} total={total.net_profit} />
                    </tbody>
                  </table>
                </div>
                <p className="px-4 py-3 text-white/20 text-xs border-t border-white/5">
                  Shared costs are attributed to the Shared division and not automatically allocated to other units. VAT is excluded from net profit (it is a pass-through — manage via Tax tab).
                </p>
              </div>
            )
          )}

          {/* ── LEDGER ───────────────────────────────────────────────────── */}
          {tab === "ledger" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <select value={filterDiv} onChange={(e) => setFilterDiv(e.target.value as any)}
                  className="bg-[#1a3a2a] border border-white/10 text-white/70 text-xs rounded-lg px-3 py-2">
                  <option value="all">All Divisions</option>
                  {(Object.entries(DIVISIONS) as [Division, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-[#1a3a2a] border border-white/10 text-white/70 text-xs rounded-lg px-3 py-2">
                  <option value="all">All Types</option>
                  {(Object.entries(TYPES) as [TxType, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="bg-[#1a3a2a] border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none min-w-[180px]" />
                <span className="text-white/30 text-xs ml-auto">{filteredTxs.length} row{filteredTxs.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10">
                        {["Date","Division","Type","Category","Description","Amount","Ref",""].map((h) => (
                          <th key={h} className="text-left px-3 py-3 text-white/40 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTxs.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-12 text-white/20 text-sm">No transactions found.</td></tr>
                      ) : filteredTxs.map((tx) => (
                        <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-3 py-2.5 text-white/50 whitespace-nowrap">{tx.date}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md font-medium"
                              style={{ background: DIV_COLORS[tx.division]?.bg, color: DIV_COLORS[tx.division]?.accent }}>
                              {DIVISIONS[tx.division]}
                            </span>
                          </td>
                          <td className={cls("px-3 py-2.5 font-medium whitespace-nowrap", TYPE_COLORS[tx.type])}>
                            {TYPES[tx.type]}
                          </td>
                          <td className="px-3 py-2.5 text-white/60 whitespace-nowrap">{CATEGORIES[tx.type][tx.category] ?? tx.category}</td>
                          <td className="px-3 py-2.5 text-white/40 max-w-[180px] truncate">{tx.description ?? "—"}</td>
                          <td className={cls("px-3 py-2.5 font-bold whitespace-nowrap", tx.type === "revenue" ? "text-[#74c69d]" : "text-red-400")}>
                            {tx.type === "revenue" ? "+" : "−"}{fmtN(tx.amount)}
                          </td>
                          <td className="px-3 py-2.5 text-white/30">{tx.reference ?? "—"}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-2">
                              <button onClick={() => openEdit(tx)} className="text-white/30 hover:text-white transition-colors">Edit</button>
                              <button onClick={() => handleDelete(tx)} className="text-white/20 hover:text-red-400 transition-colors">Del</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAX & COMPLIANCE ─────────────────────────────────────────── */}
          {tab === "tax" && (
            <div className="space-y-4 max-w-3xl">
              <div className="bg-amber-950/40 border border-amber-700/30 rounded-2xl p-4 text-amber-300 text-xs leading-relaxed">
                Advisory only — consult your accountant for formal filings. Figures derive from transactions entered for the selected period.
              </div>

              {/* VAT */}
              <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#74c69d]" /> VAT — 7.5%
                </h3>
                {[
                  { label: "Output VAT recorded (collected from customers)", value: total.vat_output, color: "text-red-400" },
                  { label: "Input VAT recorded (claimable on purchases)", value: total.vat_input, color: "text-[#74c69d]" },
                  { label: "Net VAT liability (to remit to FIRS)", value: total.vat_net, color: total.vat_net > 0 ? "text-amber-400" : "text-[#74c69d]" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                    <span className="text-white/60">{label}</span>
                    <span className={cls("font-bold", color)}>{fmt(value)}</span>
                  </div>
                ))}
                <p className="text-white/25 text-xs pt-1">Advisory: 7.5% of this period's revenue = {fmtN(vatEstimate)}. Record as <em>tax.vat_output</em> transaction if not yet entered.</p>
              </div>

              {/* CIT */}
              <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#d4a843]" /> Company Income Tax (CIT) & Education Tax
                </h3>
                <div className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                  <span className="text-white/60">Recorded CIT + Education Tax</span>
                  <span className="font-bold text-amber-400">{fmt(total.tax_cit + total.tax_education)}</span>
                </div>
                <div className="bg-[#0f2a1e] rounded-xl p-4 space-y-2 text-xs">
                  <p className="text-white/30 font-semibold uppercase tracking-wider text-[10px] mb-3">Annual Estimate (period × 12)</p>
                  {[
                    ["Annualised EBITDA", fmtN(annEbitda)],
                    ["Annualised Revenue", fmtN(annRevenue)],
                    ["CIT Rate", citRate],
                    ["Estimated CIT", fmtN(citEstimate)],
                    ["Education Tax (2%)", fmtN(eduEstimate)],
                    ["Total Estimated Income Tax", fmtN(citEstimate + eduEstimate)],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between text-white/50">
                      <span>{l}</span><span className="text-white/70 font-medium">{v}</span>
                    </div>
                  ))}
                </div>
                <p className="text-white/25 text-xs">&lt;₦25M revenue: CIT exempt. ₦25M–₦100M: 20%. &gt;₦100M: 30%. Education Tax: 2% of assessable profit on top.</p>
              </div>

              {/* WHT & PAYE */}
              <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" /> WHT & PAYE
                </h3>
                {[
                  { label: "Withholding Tax recorded (contractors, services)", value: total.tax_wht },
                  { label: "PAYE recorded (employee income tax)", value: total.tax_paye },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                    <span className="text-white/60">{label}</span>
                    <span className="font-bold text-purple-400">{fmt(value)}</span>
                  </div>
                ))}
                <p className="text-white/25 text-xs">WHT on contractors: 5–10%. WHT on partner distributions: 10% (deducted at source on Distributions page). PAYE: 7–24% progressive on gross salary.</p>
              </div>

              {/* Distribution preview */}
              <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#74c69d]" /> Partner Distribution Preview
                </h3>
                {[
                  { label: "Net Profit (after recorded tax)", value: fmtN(total.net_profit) },
                  { label: "Gross distributable pool (30% of net profit)", value: fmtN(Math.max(0, total.net_profit) * 0.30) },
                  { label: "WHT deducted at source (10%)", value: `−${fmtN(Math.max(0, total.net_profit) * 0.30 * 0.10)}` },
                  { label: "Net cash to partners", value: fmtN(Math.max(0, total.net_profit) * 0.30 * 0.90) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                    <span className="text-white/60">{label}</span>
                    <span className="font-bold text-[#74c69d]">{value}</span>
                  </div>
                ))}
                <p className="text-white/25 text-xs">30% profit pool is the system default. Process actual distributions on the Distributions page — which now reads from this ledger.</p>
              </div>
            </div>
          )}

          {/* ── LEADASH SYNCS ────────────────────────────────────────────── */}
          {tab === "syncs" && (
            <div className="space-y-4">
              <p className="text-white/40 text-xs max-w-2xl">
                Closed-month summaries pushed automatically from Leadash when the accountant signs off a month.
                Nothing here reaches investor reports until you approve it — approval writes the figures into
                Monthly Financials. A re-synced month (numbers changed after a reopen) returns to pending.
              </p>
              {syncsLoading ? (
                <div className="flex justify-center py-16">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              ) : syncs.length === 0 ? (
                <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-12 text-center">
                  <p className="text-white/30 text-sm">No syncs from Leadash yet — they appear when a month is closed there.</p>
                </div>
              ) : (
                <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          {["Month", "Revenue", "COGS", "OpEx", "Net Profit", "Status", "Synced", ""].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {syncs.map((s) => (
                          <tr key={s.id} className="border-b border-white/5">
                            <td className="px-4 py-3 text-white text-sm font-medium whitespace-nowrap">{s.period_month.slice(0, 7)}</td>
                            <td className="px-4 py-3 text-[#74c69d] text-sm">{fmt(s.payload.total_revenue ?? 0)}</td>
                            <td className="px-4 py-3 text-white/60 text-sm">{fmt(s.payload.total_cogs ?? 0)}</td>
                            <td className="px-4 py-3 text-white/60 text-sm">{fmt(s.payload.total_opex ?? 0)}</td>
                            <td className="px-4 py-3 text-sm font-semibold" style={{ color: (s.payload.net_profit ?? 0) >= 0 ? "#a78bfa" : "#f87171" }}>
                              {fmt(s.payload.net_profit ?? 0)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={cls("px-2 py-0.5 rounded-md text-[11px] font-semibold", SYNC_STATUS_STYLES[s.status])}>
                                {s.status}
                              </span>
                              {s.rejection_note && <p className="text-white/25 text-[10px] mt-1 max-w-[160px]">{s.rejection_note}</p>}
                            </td>
                            <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">
                              {new Date(s.synced_at).toLocaleDateString()}
                              {s.approved_by && <p className="text-white/20 text-[10px]">by {s.approved_by}</p>}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {s.status === "pending" && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSyncAction(s.id, "approve")}
                                    disabled={syncActing === s.id}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#74c69d]/15 text-[#74c69d] hover:bg-[#74c69d]/25 disabled:opacity-40 transition-colors">
                                    {syncActing === s.id ? "…" : "Approve"}
                                  </button>
                                  <button
                                    onClick={() => handleSyncAction(s.id, "reject")}
                                    disabled={syncActing === s.id}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171]/20 disabled:opacity-40 transition-colors">
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Add / Edit Modal ──────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">{modal === "add" ? "Add Transaction" : "Edit Transaction"}</h3>
              <button onClick={() => setModal(null)} className="text-white/30 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Date</label>
                  <input type="date" className={inputCls} value={form.date} onChange={(e) => setF("date", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <select className={inputCls} value={form.type} onChange={(e) => setF("type", e.target.value as TxType)}>
                    {(Object.entries(TYPES) as [TxType, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select className={inputCls} value={form.category} onChange={(e) => setF("category", e.target.value)}>
                  {Object.entries(CATEGORIES[form.type]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Division</label>
                <select className={inputCls} value={form.division} onChange={(e) => setF("division", e.target.value as Division)}>
                  {(Object.entries(DIVISIONS) as [Division, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <p className="text-white/25 text-xs mt-1">Auto-suggested from category — override if needed.</p>
              </div>
              <div>
                <label className={labelCls}>Amount ₦</label>
                <input type="number" min="0" step="1000" className={inputCls} value={form.amount}
                  onChange={(e) => setF("amount", e.target.value)} placeholder="e.g. 5000000" />
                {form.amount && !isNaN(parseFloat(form.amount)) && parseFloat(form.amount) > 0 && (
                  <p className="text-white/30 text-xs mt-1">{fmtN(parseFloat(form.amount))}</p>
                )}
              </div>
              <div>
                <label className={labelCls}>Description (optional)</label>
                <input type="text" className={inputCls} value={form.description}
                  onChange={(e) => setF("description", e.target.value)} placeholder="e.g. May 2026 Facebook ad spend" />
              </div>
              <div>
                <label className={labelCls}>Reference / Invoice # (optional)</label>
                <input type="text" className={inputCls} value={form.reference}
                  onChange={(e) => setF("reference", e.target.value)} placeholder="e.g. INV-0042" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)}
                className="flex-1 border border-white/20 text-white/60 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.amount || !form.category}
                className="flex-1 bg-[#74c69d] hover:bg-[#5dbc89] disabled:opacity-40 text-[#0f2a1e] font-bold py-2.5 rounded-xl text-sm transition-colors">
                {saving ? "Saving…" : modal === "add" ? "Add Transaction" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
