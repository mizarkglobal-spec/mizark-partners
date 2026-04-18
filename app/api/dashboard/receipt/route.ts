import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function formatNaira(n: number) {
  return "₦" + Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const db = createAdminClient();

  let { data: partner } = await db
    .from("partners")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!partner) {
    const { data: byEmail } = await db
      .from("partners")
      .select("*")
      .eq("email", user.email!)
      .eq("status", "active")
      .maybeSingle();
    if (byEmail) partner = byEmail;
  }

  if (!partner) {
    return new Response("Partner account not found.", { status: 404 });
  }

  const receiptNumber = `MG-${String(partner.id).slice(0, 8).toUpperCase()}-${new Date(partner.activated_at || partner.created_at).getFullYear()}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Receipt — Mizark Global Partners</title>
  <style>
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
    .logo-mark { width: 38px; height: 38px; border-radius: 8px; background: linear-gradient(145deg,#0c2016,#132d20); border: 1.5px solid rgba(212,168,67,0.35); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .logo-text { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
    .logo-sub { font-size: 11px; color: #40916c; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px; }
    .receipt-label {
      text-align: right;
    }
    .receipt-label h2 { font-size: 22px; font-weight: 800; color: #d4a843; }
    .receipt-label p { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 3px; }
    .body { padding: 40px; }
    .section-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #9ca3af;
      margin-bottom: 12px;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 8px;
    }
    .partner-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 32px;
    }
    .field label {
      display: block;
      font-size: 11px;
      color: #9ca3af;
      margin-bottom: 3px;
    }
    .field span {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }
    .amount-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }
    .amount-box .label { font-size: 13px; color: #374151; font-weight: 500; }
    .amount-box .amount { font-size: 28px; font-weight: 800; color: #d4a843; }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 32px;
    }
    .detail-card {
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 10px;
      padding: 14px;
    }
    .detail-card .dc-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .detail-card .dc-value { font-size: 15px; font-weight: 700; color: #111827; }
    .detail-card .dc-value.green { color: #40916c; }
    .footer-note {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 14px 18px;
      font-size: 12px;
      color: #92400e;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .stamp-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #f3f4f6;
      padding-top: 24px;
    }
    .stamp {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .stamp-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid #40916c;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #40916c;
      font-size: 20px;
    }
    .stamp-text { font-size: 13px; font-weight: 700; color: #40916c; }
    .stamp-sub { font-size: 10px; color: #9ca3af; }
    .receipt-no {
      text-align: right;
      font-size: 11px;
      color: #9ca3af;
    }
    .receipt-no strong { color: #374151; display: block; font-size: 13px; }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; border: none; border-radius: 0; }
      .print-btn { display: none !important; }
    }
    .print-btn {
      display: block;
      text-align: center;
      margin: 24px auto 0;
      background: #0f2a1e;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 12px 28px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      max-width: 200px;
      width: 100%;
    }
    .print-btn:hover { background: #1a4030; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-row">
        <div class="logo-mark">
          <svg viewBox="0 0 26 20" fill="none" width="18" height="14"><path d="M2 18V2L13 11L24 2V18" stroke="#d4a843" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div>
          <div class="logo-text">Mizark</div>
          <div class="logo-sub">Partner Portal</div>
        </div>
      </div>
      <div class="receipt-label">
        <h2>RECEIPT</h2>
        <p>Investment Payment Confirmation</p>
      </div>
    </div>

    <div class="body">
      <div class="section-label">Partner Details</div>
      <div class="partner-grid">
        <div class="field">
          <label>Full Name</label>
          <span>${partner.name}</span>
        </div>
        <div class="field">
          <label>Email Address</label>
          <span>${partner.email}</span>
        </div>
        ${partner.phone ? `<div class="field">
          <label>Phone</label>
          <span>${partner.phone}</span>
        </div>` : ""}
        <div class="field">
          <label>Date Activated</label>
          <span>${formatDate(partner.activated_at)}</span>
        </div>
      </div>

      <div class="section-label">Payment Summary</div>
      <div class="amount-box">
        <div class="label">Total Investment Received</div>
        <div class="amount">${formatNaira(partner.investment_amount)}</div>
      </div>

      <div class="section-label">Partnership Terms</div>
      <div class="details-grid">
        <div class="detail-card">
          <div class="dc-label">Equity Stake</div>
          <div class="dc-value green">${Number(partner.equity_pct).toFixed(3)}%</div>
        </div>
        <div class="detail-card">
          <div class="dc-label">Term Start</div>
          <div class="dc-value">${formatDate(partner.start_date)}</div>
        </div>
        <div class="detail-card">
          <div class="dc-label">Term End</div>
          <div class="dc-value">${formatDate(partner.term_end_date)}</div>
        </div>
      </div>

      <div class="footer-note">
        <strong>Important:</strong> This receipt confirms receipt of your investment capital into the Mizark Global Musharakah Partnership. Your equity stake entitles you to ${Number(partner.equity_pct).toFixed(3)}% of net profits distributed quarterly. Capital is returned at term end, subject to business performance. This is a Shariah-compliant Musharakah arrangement — not a loan or fixed-return instrument.
      </div>

      <div class="stamp-row">
        <div class="stamp">
          <div class="stamp-circle">✓</div>
          <div>
            <div class="stamp-text">Payment Confirmed</div>
            <div class="stamp-sub">Mizark Global Partners Ltd.</div>
          </div>
        </div>
        <div class="receipt-no">
          <strong>${receiptNumber}</strong>
          Receipt Number
        </div>
      </div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">Print Receipt</button>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
