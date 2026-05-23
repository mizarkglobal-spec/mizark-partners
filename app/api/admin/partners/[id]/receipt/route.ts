import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatNaira(n: number) {
  return "₦" + Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

const METHOD_LABEL: Record<string, string> = {
  paystack: "Paystack",
  bank_transfer: "Bank Transfer",
  manual: "Manual",
  other: "Other",
};

const SHARED_STYLES = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #f7f8f7;
  color: #111827;
  padding: 40px 20px;
  min-height: 100vh;
}
.container {
  max-width: 680px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}
.header {
  background: #0f2a1e;
  color: white;
  padding: 32px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo-row { display: flex; align-items: center; gap: 12px; }
.logo-mark {
  width: 38px; height: 38px; border-radius: 8px;
  background: linear-gradient(145deg,#0c2016,#132d20);
  border: 1.5px solid rgba(212,168,67,0.35);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.logo-text { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
.logo-sub { font-size: 11px; color: #40916c; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px; }
.receipt-label { text-align: right; }
.receipt-label h2 { font-size: 22px; font-weight: 800; color: #d4a843; }
.receipt-label p { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 3px; }
.badge {
  display: inline-block; border-radius: 6px; padding: 5px 12px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; margin-bottom: 24px;
}
.badge-partial { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.badge-complete { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
.badge-admin { background: rgba(212,168,67,0.15); color: #d4a843; border: 1px solid rgba(212,168,67,0.3); }
.body { padding: 40px; }
.section-label {
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 12px;
  border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;
}
.partner-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
.field label { display: block; font-size: 11px; color: #9ca3af; margin-bottom: 3px; }
.field span { font-size: 14px; font-weight: 600; color: #111827; }
.amount-box {
  background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;
  padding: 20px 24px; margin-bottom: 32px;
}
.amount-box .row { display: flex; justify-content: space-between; align-items: center; }
.amount-box .label { font-size: 13px; color: #374151; font-weight: 500; }
.amount-box .amount { font-size: 28px; font-weight: 800; color: #d4a843; }
.amount-box .sub-row { display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid #d1fae5; }
.amount-box .sub-item { font-size: 12px; color: #374151; }
.amount-box .sub-item strong { color: #111827; }
.progress-bar { height: 6px; background: #d1fae5; border-radius: 3px; margin-top: 12px; }
.progress-fill { height: 6px; background: #40916c; border-radius: 3px; }
.details-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 32px; }
.detail-card { background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 10px; padding: 14px; }
.detail-card .dc-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
.detail-card .dc-value { font-size: 15px; font-weight: 700; color: #111827; }
.detail-card .dc-value.green { color: #40916c; }
.detail-card .dc-value.amber { color: #d4a843; }
.table-wrap { margin-bottom: 32px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
td { padding: 10px; border-bottom: 1px solid #f9fafb; color: #374151; }
tr.highlight td { background: #fffbeb; font-weight: 600; }
.footer-note {
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;
  padding: 14px 18px; font-size: 12px; color: #92400e; line-height: 1.6; margin-bottom: 24px;
}
.stamp-row {
  display: flex; align-items: center; justify-content: space-between;
  border-top: 1px solid #f3f4f6; padding-top: 24px;
}
.stamp { display: flex; align-items: center; gap: 8px; }
.stamp-circle {
  width: 48px; height: 48px; border-radius: 50%;
  border: 2px solid #40916c; display: flex; align-items: center;
  justify-content: center; color: #40916c; font-size: 20px;
}
.stamp-text { font-size: 13px; font-weight: 700; color: #40916c; }
.stamp-sub { font-size: 10px; color: #9ca3af; }
.receipt-no { text-align: right; font-size: 11px; color: #9ca3af; }
.receipt-no strong { color: #374151; display: block; font-size: 13px; }
@media print {
  body { background: white; padding: 0; }
  .container { box-shadow: none; border: none; border-radius: 0; }
  .print-btn { display: none !important; }
}
.print-btn {
  display: block; text-align: center; margin: 24px auto 0;
  background: #0f2a1e; color: white; border: none; border-radius: 10px;
  padding: 12px 28px; font-size: 14px; font-weight: 600; cursor: pointer;
  max-width: 200px; width: 100%;
}
.print-btn:hover { background: #1a4030; }
`;

function logoSvg() {
  return `<svg viewBox="0 0 26 20" fill="none" width="18" height="14"><path d="M2 18V2L13 11L24 2V18" stroke="#d4a843" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function header(subtitle: string) {
  return `
  <div class="header">
    <div class="logo-row">
      <div class="logo-mark">${logoSvg()}</div>
      <div>
        <div class="logo-text">Mizark</div>
        <div class="logo-sub">${subtitle}</div>
      </div>
    </div>
    <div class="receipt-label">
      <h2>RECEIPT</h2>
      <p>Investment Payment Confirmation</p>
    </div>
  </div>`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { db } = auth;

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const installmentId = searchParams.get("installment_id");

  const { data: partner } = await db
    .from("partners")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!partner) return new Response("Partner not found.", { status: 404 });

  const { data: allInstallments } = await db
    .from("partner_installments")
    .select("*")
    .eq("partner_id", id)
    .order("payment_date", { ascending: true });

  const installments: any[] = allInstallments ?? [];

  const committedAmount = Number(partner.committed_amount ?? partner.investment_amount ?? 0);
  const paidAmount = Number(partner.paid_amount ?? partner.investment_amount ?? 0);
  const equityPct = Number(partner.equity_pct ?? 0);
  const committedEquityPct = Number(partner.equity_committed_pct ?? equityPct);
  const isPartial = paidAmount < committedAmount;

  // Per-installment receipt
  if (installmentId) {
    const inst = installments.find((i) => i.id === installmentId);
    if (!inst) return new Response("Installment not found.", { status: 404 });

    const paidBefore = installments
      .filter((i) => new Date(i.payment_date) < new Date(inst.payment_date) ||
        (i.payment_date === inst.payment_date && i.created_at < inst.created_at))
      .reduce((s, i) => s + Number(i.amount), 0);
    const paidAfter = paidBefore + Number(inst.amount);
    const outstanding = committedAmount - paidAfter;
    const isLast = outstanding <= 0;

    const receiptNo = `MG-${String(partner.id).slice(0, 8).toUpperCase()}-INS-${String(inst.id).slice(0, 6).toUpperCase()}`;

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Installment Receipt — ${partner.name}</title><style>${SHARED_STYLES}</style></head><body>
  <div class="container">
    ${header("Installment Receipt")}
    <div class="body">
      <span class="badge ${isLast ? "badge-complete" : "badge-partial"}">${isLast ? "Final Payment — Commitment Complete" : "Partial Payment"}</span>

      <div class="section-label">Partner Details</div>
      <div class="partner-grid">
        <div class="field"><label>Full Name</label><span>${partner.name}</span></div>
        <div class="field"><label>Email Address</label><span>${partner.email}</span></div>
        ${partner.phone ? `<div class="field"><label>Phone</label><span>${partner.phone}</span></div>` : ""}
        <div class="field"><label>Payment Date</label><span>${formatDate(inst.payment_date)}</span></div>
        <div class="field"><label>Payment Method</label><span>${METHOD_LABEL[inst.method] ?? inst.method}</span></div>
        ${inst.reference ? `<div class="field"><label>Reference</label><span style="font-size:12px;">${inst.reference}</span></div>` : ""}
      </div>

      <div class="section-label">This Payment</div>
      <div class="amount-box">
        <div class="row">
          <div class="label">Amount Received</div>
          <div class="amount">${formatNaira(Number(inst.amount))}</div>
        </div>
        <div class="sub-row">
          <div class="sub-item">Total Paid: <strong>${formatNaira(paidAfter)}</strong></div>
          <div class="sub-item">Committed: <strong>${formatNaira(committedAmount)}</strong></div>
          ${outstanding > 0 ? `<div class="sub-item" style="color:#92400e;">Outstanding: <strong>${formatNaira(outstanding)}</strong></div>` : ""}
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, (paidAfter / committedAmount) * 100).toFixed(1)}%"></div></div>
      </div>

      <div class="section-label">Equity Position</div>
      <div class="details-grid">
        <div class="detail-card">
          <div class="dc-label">Active Equity</div>
          <div class="dc-value green">${((paidAfter / 20_000_000) * 20).toFixed(3)}%</div>
        </div>
        <div class="detail-card">
          <div class="dc-label">Committed Equity</div>
          <div class="dc-value amber">${committedEquityPct.toFixed(3)}%</div>
        </div>
        <div class="detail-card">
          <div class="dc-label">Payments Made</div>
          <div class="dc-value">${installments.filter(i => i.payment_date <= inst.payment_date).length}</div>
        </div>
      </div>

      ${inst.notes ? `<div class="footer-note"><strong>Notes:</strong> ${inst.notes}</div>` : ""}

      <div class="footer-note">
        This receipt confirms receipt of ₦${Number(inst.amount).toLocaleString("en-NG")} from ${partner.name} toward their Mizark Global Musharakah Partnership investment. ${isLast ? "Full commitment satisfied." : `Remaining balance of ${formatNaira(outstanding)} is outstanding.`} Active equity (${((paidAfter / 20_000_000) * 20).toFixed(3)}%) reflects paid-up capital only.
      </div>

      <div class="stamp-row">
        <div class="stamp">
          <div class="stamp-circle">✓</div>
          <div>
            <div class="stamp-text">Payment Received</div>
            <div class="stamp-sub">Mizark Global Partners Ltd.</div>
          </div>
        </div>
        <div class="receipt-no"><strong>${receiptNo}</strong>Receipt Number</div>
      </div>
    </div>
  </div>
  <button class="print-btn" onclick="window.print()">Print Receipt</button>
</body></html>`;

    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  // Full partner receipt
  const receiptNumber = `MG-${String(partner.id).slice(0, 8).toUpperCase()}-${new Date(partner.activated_at || partner.created_at).getFullYear()}`;

  const installmentRows = installments.map((inst, i) => {
    let running = installments.slice(0, i + 1).reduce((s, x) => s + Number(x.amount), 0);
    return `<tr>
      <td>${formatDate(inst.payment_date)}</td>
      <td>${formatNaira(Number(inst.amount))}</td>
      <td>${METHOD_LABEL[inst.method] ?? inst.method}</td>
      <td>${formatNaira(running)}</td>
      <td>${inst.reference ?? "—"}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Payment Receipt — ${partner.name} — Mizark Global</title><style>${SHARED_STYLES}</style></head><body>
  <div class="container">
    ${header("Admin — Receipt Copy")}
    <div class="body">
      <span class="badge ${isPartial ? "badge-partial" : "badge-complete"}">${isPartial ? "Partial Payment — Investment In Progress" : "Payment Complete"}</span>
      <span class="badge badge-admin" style="margin-left:8px;">Admin Copy</span>

      <div class="section-label">Partner Details</div>
      <div class="partner-grid">
        <div class="field"><label>Full Name</label><span>${partner.name}</span></div>
        <div class="field"><label>Email Address</label><span>${partner.email}</span></div>
        ${partner.phone ? `<div class="field"><label>Phone</label><span>${partner.phone}</span></div>` : ""}
        <div class="field"><label>Date Activated</label><span>${formatDate(partner.activated_at)}</span></div>
        <div class="field"><label>Partner ID</label><span style="font-size:11px;color:#9ca3af;">${partner.id}</span></div>
      </div>

      <div class="section-label">Payment Summary</div>
      <div class="amount-box">
        <div class="row">
          <div class="label">Total Paid to Date</div>
          <div class="amount">${formatNaira(paidAmount)}</div>
        </div>
        ${committedAmount !== paidAmount ? `
        <div class="sub-row">
          <div class="sub-item">Committed: <strong>${formatNaira(committedAmount)}</strong></div>
          <div class="sub-item" style="color:#92400e;">Outstanding: <strong>${formatNaira(committedAmount - paidAmount)}</strong></div>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, (paidAmount / committedAmount) * 100).toFixed(1)}%"></div></div>` : ""}
      </div>

      <div class="section-label">Equity Position</div>
      <div class="details-grid">
        <div class="detail-card">
          <div class="dc-label">Active Equity</div>
          <div class="dc-value green">${equityPct.toFixed(3)}%</div>
        </div>
        <div class="detail-card">
          <div class="dc-label">Committed Equity</div>
          <div class="dc-value amber">${committedEquityPct.toFixed(3)}%</div>
        </div>
        <div class="detail-card">
          <div class="dc-label">Term</div>
          <div class="dc-value" style="font-size:11px;">${formatDate(partner.start_date)} – ${formatDate(partner.term_end_date)}</div>
        </div>
      </div>

      ${installments.length > 0 ? `
      <div class="section-label">Payment History</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Running Total</th><th>Reference</th></tr></thead>
          <tbody>${installmentRows}</tbody>
        </table>
      </div>` : ""}

      <div class="footer-note">
        <strong>Note:</strong> This receipt confirms investment capital received from ${partner.name} into the Mizark Global Musharakah Partnership. Active equity (${equityPct.toFixed(3)}%) reflects paid-up capital only. Committed equity (${committedEquityPct.toFixed(3)}%) will be fully active upon completion of investment.
      </div>

      <div class="stamp-row">
        <div class="stamp">
          <div class="stamp-circle">✓</div>
          <div>
            <div class="stamp-text">${isPartial ? "Partial Payment Confirmed" : "Payment Confirmed"}</div>
            <div class="stamp-sub">Mizark Global Partners Ltd.</div>
          </div>
        </div>
        <div class="receipt-no"><strong>${receiptNumber}</strong>Receipt Number</div>
      </div>
    </div>
  </div>
  <button class="print-btn" onclick="window.print()">Print Receipt</button>
</body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
