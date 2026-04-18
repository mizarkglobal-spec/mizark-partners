import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { fmt } from "@/lib/format";

function n(v: number | null | undefined) {
  return v != null ? fmt.naira(v) : "—";
}

function buildReportHtml(opts: {
  report: any;
  isAdmin: boolean;
  partnerRecord: any | null;
  partnerNames: Record<string, string>;
}) {
  const { report, isAdmin, partnerRecord, partnerNames } = opts;
  const data = report.data ?? {};
  const type: string = report.type;
  const period: string = report.period;

  function periodLabel(): string {
    if (type === "monthly") {
      const [y, m] = period.split("-");
      return new Date(+y, +m - 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
    }
    if (type === "quarterly") {
      const [y, q] = period.split("-Q");
      return `Q${q} ${y}`;
    }
    return `Annual ${period}`;
  }

  // Aggregate financials
  const fins: any[] = Array.isArray(data.financials) ? data.financials : data.financials ? [data.financials] : [];
  const totalLeadash = fins.reduce((s, f) => s + (f.leadash_rev ?? 0), 0);
  const totalAcademy = fins.reduce((s, f) => s + (f.academy_rev ?? 0), 0);
  const totalRev = fins.reduce((s, f) => s + (f.total_rev != null ? f.total_rev : (f.leadash_rev ?? 0) + (f.academy_rev ?? 0)), 0);
  const totalExp = fins.reduce((s, f) => s + (f.expenses ?? 0), 0);
  const totalNet = fins.reduce((s, f) => s + (f.net_profit != null ? f.net_profit : (f.total_rev ?? 0) - (f.expenses ?? 0)), 0);

  const distributions: any[] = data.distributions ?? [];

  // For partner: find their distribution
  const myDist = partnerRecord
    ? distributions.find((d: any) => d.partner_id === partnerRecord.id)
    : null;

  const noData = fins.length === 0;

  const monthTable = fins.length > 1 ? `
    <table class="data-table">
      <thead>
        <tr>
          <th>Month</th>
          <th class="right">Leadash Rev</th>
          <th class="right">Academy Rev</th>
          <th class="right">Total Rev</th>
          <th class="right">Expenses</th>
          <th class="right">Net Profit</th>
        </tr>
      </thead>
      <tbody>
        ${fins.map((f: any) => {
          const [y, m] = f.period.split("-");
          const monthName = new Date(+y, +m - 1).toLocaleDateString("en-NG", { month: "short", year: "numeric" });
          const net = f.net_profit ?? (f.total_rev - f.expenses);
          return `<tr>
            <td>${monthName}</td>
            <td class="right">${n(f.leadash_rev)}</td>
            <td class="right">${n(f.academy_rev)}</td>
            <td class="right bold">${n(f.total_rev ?? (f.leadash_rev + f.academy_rev))}</td>
            <td class="right">${n(f.expenses)}</td>
            <td class="right ${net < 0 ? "red" : "green"}">${n(net)}</td>
          </tr>`;
        }).join("")}
        <tr class="total-row">
          <td><strong>Total</strong></td>
          <td class="right"><strong>${n(totalLeadash)}</strong></td>
          <td class="right"><strong>${n(totalAcademy)}</strong></td>
          <td class="right"><strong>${n(totalRev)}</strong></td>
          <td class="right"><strong>${n(totalExp)}</strong></td>
          <td class="right ${totalNet < 0 ? "red" : "green"}"><strong>${n(totalNet)}</strong></td>
        </tr>
      </tbody>
    </table>` : "";

  const distTable = distributions.length > 0 && (isAdmin || myDist) ? `
    <div class="section">
      <h2 class="section-title">Partner Distributions</h2>
      <table class="data-table">
        <thead>
          <tr>
            ${isAdmin ? '<th>Partner</th>' : ''}
            <th class="right">Equity %</th>
            <th class="right">Distribution</th>
            <th class="right">Status</th>
            ${isAdmin ? '<th class="right">Paid At</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${(isAdmin ? distributions : distributions.filter((d: any) => d.partner_id === partnerRecord?.id))
            .map((d: any) => `<tr ${!isAdmin && d.partner_id === partnerRecord?.id ? 'class="highlight-row"' : ''}>
              ${isAdmin ? `<td>${partnerNames[d.partner_id] ?? d.partner_id.slice(0, 8) + "…"}</td>` : ""}
              <td class="right">${Number(d.partner_share ?? 0).toFixed(4)}%</td>
              <td class="right green bold">${n(d.amount)}</td>
              <td class="right">
                <span class="badge ${d.status === "paid" ? "badge-green" : d.status === "pending" ? "badge-yellow" : "badge-gray"}">${d.status}</span>
              </td>
              ${isAdmin ? `<td class="right">${d.paid_at ? fmt.shortDate(d.paid_at) : "—"}</td>` : ""}
            </tr>`).join("")}
        </tbody>
      </table>
    </div>` : "";

  const singleMonthTable = fins.length === 1 ? `
    <table class="data-table">
      <thead><tr><th>Metric</th><th class="right">Amount</th></tr></thead>
      <tbody>
        <tr><td>Leadash Revenue</td><td class="right">${n(fins[0].leadash_rev)}</td></tr>
        <tr><td>Academy Revenue</td><td class="right">${n(fins[0].academy_rev)}</td></tr>
        <tr class="total-row"><td><strong>Total Revenue</strong></td><td class="right bold">${n(totalRev)}</td></tr>
        <tr><td>Operating Expenses</td><td class="right">${n(fins[0].expenses)}</td></tr>
        <tr class="total-row"><td><strong>Net Profit</strong></td><td class="right ${totalNet < 0 ? "red" : "green"} bold">${n(totalNet)}</td></tr>
      </tbody>
    </table>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Mizark Global — ${periodLabel()} Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #111; background: #fff; line-height: 1.5; }
    .page { max-width: 820px; margin: 0 auto; padding: 40px 48px; }
    .header { border-bottom: 2px solid #0f2a1e; padding-bottom: 20px; margin-bottom: 32px; display: flex; align-items: center; justify-content: space-between; }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-mark { width: 36px; height: 36px; background: linear-gradient(145deg,#0c2016,#132d20); border: 1.5px solid rgba(212,168,67,0.35); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .logo-name { font-size: 15px; font-weight: 700; color: #0f2a1e; letter-spacing: -0.02em; }
    .logo-sub { font-size: 10px; color: #40916c; text-transform: uppercase; letter-spacing: 1.5px; }
    .header-right { text-align: right; font-size: 11px; color: #6b7280; }
    .report-title { text-align: center; margin-bottom: 28px; }
    .report-title h1 { font-size: 22px; font-weight: 700; color: #0f2a1e; }
    .report-title .badge { display: inline-block; margin-top: 6px; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
    .badge-quarterly { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .badge-monthly { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; }
    .badge-annual { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
    .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; text-align: center; }
    .stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .stat-value { font-size: 16px; font-weight: 700; color: #111; }
    .stat-value.green { color: #16a34a; }
    .stat-value.red { color: #dc2626; }
    .stat-value.gold { color: #d97706; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 13px; font-weight: 700; color: #0f2a1e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .data-table th { text-align: left; padding: 8px 10px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
    .data-table td { padding: 9px 10px; border-bottom: 1px solid #f3f4f6; }
    .data-table .right { text-align: right; }
    .data-table .bold { font-weight: 700; }
    .data-table .green { color: #16a34a; }
    .data-table .red { color: #dc2626; }
    .data-table .total-row { background: #f9fafb; }
    .data-table .highlight-row { background: #f0fdf4; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: capitalize; }
    .badge-green { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .badge-yellow { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .badge-gray { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }
    .no-data { text-align: center; padding: 32px; color: #9ca3af; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; }
    .my-dist { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; margin-bottom: 24px; }
    .my-dist-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; font-weight: 600; }
    .my-dist-amount { font-size: 24px; font-weight: 700; color: #16a34a; }
    .my-dist-sub { font-size: 11px; color: #6b7280; margin-top: 4px; }
    .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 10px; color: #9ca3af; text-align: center; }
    .notes-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #92400e; margin-top: 12px; }
    @media print { .no-print { display: none; } body { font-size: 11px; } .page { padding: 20px 28px; } }
  </style>
</head>
<body>
  <div class="no-print" style="background:#0f2a1e;padding:10px 24px;display:flex;justify-content:space-between;align-items:center">
    <span style="color:#74c69d;font-size:13px;font-weight:600">Mizark Global — ${periodLabel()} Report</span>
    <button onclick="window.print()" style="background:#d4a843;color:#0f2a1e;border:none;padding:7px 18px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer">⬇ Download / Print PDF</button>
  </div>
  <div class="page">
    <div class="header">
      <div class="logo">
        <div class="logo-mark">
          <svg viewBox="0 0 26 20" fill="none" width="17" height="13"><path d="M2 18V2L13 11L24 2V18" stroke="#d4a843" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div style="margin-left:10px">
          <div class="logo-name">Mizark</div>
          <div class="logo-sub">Financial Report</div>
        </div>
      </div>
      <div class="header-right">
        <div><strong>${periodLabel()}</strong></div>
        <div>Generated ${fmt.shortDate(report.generated_at)}</div>
        ${partnerRecord ? `<div>Prepared for: <strong>${partnerRecord.name}</strong></div>` : ""}
      </div>
    </div>

    <div class="report-title">
      <h1>${periodLabel()} Financial Report</h1>
      <span class="badge badge-${type}">${type}</span>
    </div>

    ${noData ? `<div class="no-data">No financial data recorded for this period yet.</div>` : `
    <!-- Summary stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Leadash Rev</div>
        <div class="stat-value">${n(totalLeadash)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Academy Rev</div>
        <div class="stat-value">${n(totalAcademy)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Revenue</div>
        <div class="stat-value gold">${n(totalRev)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Net Profit</div>
        <div class="stat-value ${totalNet < 0 ? "red" : "green"}">${n(totalNet)}</div>
      </div>
    </div>

    ${!isAdmin && myDist ? `
    <div class="my-dist">
      <div class="my-dist-label">Your Distribution — ${periodLabel()}</div>
      <div class="my-dist-amount">${n(myDist.amount)}</div>
      <div class="my-dist-sub">${Number(myDist.partner_share ?? 0).toFixed(4)}% equity stake · Status: <strong>${myDist.status}</strong>${myDist.paid_at ? ` · Paid ${fmt.shortDate(myDist.paid_at)}` : ""}</div>
    </div>` : ""}

    <!-- Financial details -->
    <div class="section">
      <h2 class="section-title">${fins.length > 1 ? "Monthly Breakdown" : "Financial Summary"}</h2>
      ${fins.length > 1 ? monthTable : singleMonthTable}
      ${fins[0]?.notes ? `<div class="notes-box">📝 ${fins[0].notes}</div>` : ""}
    </div>

    ${distTable}
    `}

    <div class="footer">
      Mizark Global Limited · Confidential Partner Report · ${periodLabel()}<br>
      Generated ${new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
    </div>
  </div>
</body>
</html>`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Determine auth: admin header, admin email, or active partner
  const adminSecret = req.headers.get("x-admin-secret");
  let isAdmin = !!(adminSecret && adminSecret === process.env.ADMIN_SECRET);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const db = createAdminClient();
  let partnerRecord: any = null;

  if (user) {
    if (!isAdmin && user.email === process.env.ADMIN_EMAIL) isAdmin = true;
    if (!isAdmin) {
      const { data: partner } = await db
        .from("partners")
        .select("id, name, equity_pct")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      partnerRecord = partner;
    }
  }

  if (!isAdmin && !partnerRecord) {
    return new NextResponse("Unauthorized — please sign in as a partner or admin", { status: 401 });
  }

  const { data: report } = await db.from("reports").select("*").eq("id", id).maybeSingle();
  if (!report) {
    return new NextResponse("Report not found", { status: 404 });
  }

  // Resolve partner names for admin view (distributions have partner_ids)
  let partnerNames: Record<string, string> = {};
  if (isAdmin) {
    const dists: any[] = report.data?.distributions ?? [];
    const ids = [...new Set(dists.map((d: any) => d.partner_id))].filter(Boolean);
    if (ids.length) {
      const { data: pts } = await db.from("partners").select("id, name").in("id", ids);
      (pts ?? []).forEach((p: any) => { partnerNames[p.id] = p.name; });
    }
  }

  const html = buildReportHtml({ report, isAdmin, partnerRecord, partnerNames });
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
