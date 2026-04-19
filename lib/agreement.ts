import { fmt } from "./format";

export interface AgreementPartner {
  name: string;
  email: string;
  investment_amount: number;
  start_date?: string | null;
  term_end_date?: string | null;
}

export interface Article {
  num: string;    // "1", "2", "13A", anything
  title: string;  // "DEFINITIONS", "INVESTMENT & EQUITY"
  body: string;   // clause text with {{tokens}}
}

export interface AgreementConfig {
  company_full_name?: string;
  company_jurisdiction?: string;
  ceo_name?: string;
  arbitration_city?: string;
  governing_law?: string;
  total_pool_amount?: number;
  total_equity_pct?: number;
  term_years?: number;
  articles?: Article[];           // overrides entire articles list when non-empty
  custom_article_14?: string;     // legacy — used only when articles is empty
  footer_note?: string;
}

const CONFIG_DEFAULTS: Required<Omit<AgreementConfig, "articles">> & { articles: Article[] } = {
  company_full_name: "Mizark Global Limited",
  company_jurisdiction: "the Federal Republic of Nigeria",
  ceo_name: "Malik Adelaja",
  arbitration_city: "Lagos, Nigeria",
  governing_law: "the Federal Republic of Nigeria",
  total_pool_amount: 20_000_000,
  total_equity_pct: 20,
  term_years: 3,
  custom_article_14: "",
  footer_note: "",
  articles: [],
};

export const DEFAULT_ARTICLES: Article[] = [
  {
    num: "1",
    title: "DEFINITIONS",
    body: `1.1 "Musharakah" means a Shariah-compliant joint venture in which both parties contribute capital and/or effort, and share profits and losses on agreed proportional terms.

1.2 "Partnership Capital" means the total aggregate investment pool of {{total_pool}} contributed by all partners participating in this Programme.

1.3 "The Partner's Investment" means the sum of {{investment_amount}} contributed by the Partner.

1.4 "The Partner's Equity Stake" means {{equity_pct}}% of the total equity offered to partners, calculated as the Partner's Investment divided by the total Partnership Capital multiplied by {{total_equity_pct}}%.

1.5 "Net Profit" means the aggregate net profit of {{company_name}} from both the Leadash and Learn by Mizark business lines, after all operating expenses, for a given period, as determined from the Company's accounting records.

1.6 "Distribution Period" means each calendar quarter (Q1: Jan–Mar, Q2: Apr–Jun, Q3: Jul–Sep, Q4: Oct–Dec).

1.7 "Term" means the {{term_years}} year period commencing on the Activation Date.`,
  },
  {
    num: "2",
    title: "INVESTMENT & EQUITY",
    body: `2.1 The Partner agrees to invest the sum of {{investment_amount}} into {{company_name}} as part of the Musharakah Partnership Programme.

2.2 In consideration for this investment, the Partner shall receive an equity stake of {{equity_pct}}% in the profits of {{company_name}} as defined in this Agreement.

2.3 This equity stake does not confer any voting rights or management authority over the Company. The Partner is a silent equity partner for the duration of this Agreement.

2.4 The equity stake is based on the proportion of the Partner's Investment relative to the total Partnership Capital pool of {{total_pool}}, applied to a {{total_equity_pct}}% equity allotment ring-fenced for partners.`,
  },
  {
    num: "3",
    title: "PROFIT SHARING",
    body: `3.1 The Company shall calculate Net Profit at the end of each Distribution Period using its accounting records (currently maintained on Zoho Books).

3.2 The Partner's share of profit for each Distribution Period shall be calculated as: Net Profit × {{equity_pct}}%.

3.3 If Net Profit in any Distribution Period is zero or negative, no distribution shall be made for that period. There shall be no carry-forward of unpaid distributions to future periods.

3.4 Distributions shall be paid within thirty (30) days of the end of each quarter, subject to available cash flow.

3.5 The Company shall provide the Partner with a quarterly statement showing total revenue, total expenses, net profit, and the Partner's calculated distribution amount.`,
  },
  {
    num: "4",
    title: "LOSS SHARING",
    body: `4.1 In the event of a net loss in any Distribution Period, no distribution is made and the loss is absorbed by the Company's operations.

4.2 The Partner's capital loss exposure is limited to their invested amount of {{investment_amount}}.

4.3 The Partner acknowledges that in a sustained loss scenario, their invested capital may be partially or fully eroded and may not be returned in full at term end.`,
  },
  {
    num: "5",
    title: "MANAGEMENT",
    body: `5.1 {{company_name}}, acting through its founder and CEO {{ceo_name}}, shall manage all business operations, including product development, sales, marketing, hiring, and financial management.

5.2 The Partner has no right to participate in day-to-day management decisions.

5.3 The Company shall act in good faith and in the best interests of all Musharakah partners, ensuring that the Partnership Capital is deployed prudently and in accordance with Shariah principles.

5.4 Major decisions that materially affect partner equity (e.g., new funding rounds, sale of the Company) shall require written notice to all active partners.`,
  },
  {
    num: "6",
    title: "PARTNER RIGHTS",
    body: `6.1 The Partner shall have the right to:
   (a) Receive quarterly financial reports via the Partner Dashboard;
   (b) Receive timely notification of material business developments;
   (c) Inspect, upon reasonable written request, financial statements relating to the Partnership;
   (d) Receive their proportional share of net profits as defined in Article 3;
   (e) Access the Partner Dashboard 24/7 to review performance data.`,
  },
  {
    num: "7",
    title: "RESTRICTIONS",
    body: `7.1 The Partner shall not:
   (a) Transfer, assign, or sell their equity stake to any third party without prior written consent from the Company;
   (b) Disclose the terms of this Agreement or any confidential financial information to third parties;
   (c) Use their position as a partner to compete with or disadvantage {{company_name}}.

7.2 All pitch materials, financial data, and partner communications are strictly confidential.`,
  },
  {
    num: "8",
    title: "TERM & DURATION",
    body: `8.1 This Agreement shall commence on the Activation Date (the date the Partner's payment is confirmed) and shall continue for a period of {{term_years}} years.

8.2 Partnership Start Date: {{term_start}}
8.3 Partnership End Date: {{term_end}}

8.4 At the expiry of the Term, the Company shall use reasonable best efforts to return the Partner's original investment capital, subject to the financial position of the Company at that time.`,
  },
  {
    num: "9",
    title: "EARLY EXIT",
    body: `9.1 Neither Party may terminate this Agreement before the end of the Term except:
   (a) By mutual written consent of both Parties;
   (b) In the event of material breach that is not remedied within 30 days of written notice;
   (c) In the event of insolvency of the Company.

9.2 If early exit is agreed, the Company shall make reasonable commercial efforts to return the Partner's invested capital, less any accumulated losses.`,
  },
  {
    num: "10",
    title: "SHARIAH COMPLIANCE & BUSINESS PRINCIPLES",
    body: `10.1 This Agreement is structured as a Musharakah and shall at all times comply with Shariah principles as the primary framework governing the relationship between the Parties.

10.2 The entire business of {{company_name}} — including its products, services, revenue streams, expenditures, and partnerships — is guided by and operated in accordance with Islamic (Shariah) law.

10.3 No interest (riba) shall be charged, received, or paid under any circumstances, whether in connection with this Agreement or the underlying business operations.

10.4 The business activities of {{company_name}} shall remain within Shariah-permissible (halal) sectors at all times. Any proposed new business activity that may be impermissible under Shariah shall be subject to review before adoption.

10.5 Any distribution of profits is conditional on the existence of real, verified profits from lawful (halal) business activity and shall not be from capital.

10.6 Both Parties affirm that the funds contributed under this Agreement are from halal (permissible) sources.`,
  },
  {
    num: "11",
    title: "DISPUTE RESOLUTION",
    body: `11.1 The Parties shall endeavour to resolve any disputes amicably through good-faith negotiation guided by Islamic principles of fairness and consultation (shura).

11.2 If a dispute cannot be resolved within 30 days of written notice, it shall be referred to a Shariah court of competent jurisdiction for resolution in accordance with Islamic law.

11.3 Where a Shariah court is not readily accessible to either Party, the dispute shall be referred to a mutually agreed Islamic arbitration panel — comprising at least one qualified Shariah scholar — applying Shariah principles. Each Party shall have equal input in the appointment of the panel.

11.4 The decision of the Shariah court or Islamic arbitration panel shall be final and binding on both Parties.

11.5 Nothing in this Article prevents either Party from seeking urgent interim relief from a Nigerian civil court where necessary to preserve rights pending Shariah resolution.`,
  },
  {
    num: "12",
    title: "GOVERNING LAW",
    body: `12.1 This Agreement is primarily governed by and construed in accordance with Islamic (Shariah) law, which forms the foundational framework for all rights, obligations, and interpretations under this Agreement.

12.2 To the extent that any matter is not addressed by Shariah law or requires enforcement through civil courts, the laws of {{governing_law}} shall apply as the secondary governing framework.

12.3 Any proceedings arising from this Agreement shall be conducted in English.`,
  },
  {
    num: "13",
    title: "ENTIRE AGREEMENT",
    body: `13.1 This Agreement constitutes the entire agreement between the Parties with respect to its subject matter and supersedes all prior representations, negotiations, or understandings.

13.2 This Agreement may only be amended in writing signed by both Parties.

13.3 If any provision of this Agreement is held invalid, the remainder shall continue in full force and effect.`,
  },
];

function resolveTokens(text: string, tokens: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => tokens[key] ?? `{{${key}}}`);
}

export function buildAgreementText(partner: AgreementPartner, config?: AgreementConfig): string {
  const c = { ...CONFIG_DEFAULTS, ...config };
  const equity = (partner.investment_amount / c.total_pool_amount) * c.total_equity_pct;
  const termStart = partner.start_date ? fmt.date(partner.start_date) : "[To be confirmed upon payment]";
  const termEnd = partner.term_end_date ? fmt.date(partner.term_end_date) : `[${c.term_years} years from start date]`;

  const tokens: Record<string, string> = {
    partner_name: partner.name,
    partner_email: partner.email,
    investment_amount: fmt.naira(partner.investment_amount),
    equity_pct: equity.toFixed(6),
    equity_pct_3: equity.toFixed(3),
    total_pool: fmt.naira(c.total_pool_amount),
    total_equity_pct: String(c.total_equity_pct),
    company_name: c.company_full_name,
    company_jurisdiction: c.company_jurisdiction,
    ceo_name: c.ceo_name,
    arbitration_city: c.arbitration_city,
    governing_law: c.governing_law,
    term_start: termStart,
    term_end: termEnd,
    term_years: String(c.term_years),
  };

  // Use custom articles if stored, otherwise use defaults + legacy custom_article_14
  let articles = c.articles?.length ? c.articles : [...DEFAULT_ARTICLES];
  if (!c.articles?.length && c.custom_article_14?.trim()) {
    articles = [...articles, { num: "14", title: "SPECIAL CONDITIONS", body: c.custom_article_14 }];
  }

  const sep = "━".repeat(40);

  const header = `MUSHARAKAH PARTNERSHIP AGREEMENT

This Musharakah Partnership Agreement ("Agreement") is entered into between:

PARTY A (THE COMPANY):
${c.company_full_name}, a company registered under the laws of ${c.company_jurisdiction}
("Mizark Global" or "the Company")

PARTY B (THE PARTNER):
${partner.name}
Email: ${partner.email}
("the Partner")

Collectively referred to as "the Parties."`;

  const articleBlocks = articles
    .map((a) => `ARTICLE ${a.num} — ${a.title}\n\n${resolveTokens(a.body, tokens)}`)
    .join(`\n\n${sep}\n\n`);

  const summary = `PARTNER DETAILS SUMMARY

Partner Name: ${partner.name}
Email: ${partner.email}
Investment Amount: ${fmt.naira(partner.investment_amount)}
Equity Stake: ${equity.toFixed(6)}%
Term Start: ${termStart}
Term End: ${termEnd}
Distribution Frequency: Quarterly
Agreement Version: 1.0`;

  const closing = `By signing below, the Partner confirms that they have read and understood this Agreement in its entirety, and agree to be bound by its terms.${c.footer_note ? `\n\n${c.footer_note}` : ""}`;

  return [header, articleBlocks, summary, closing].join(`\n\n${sep}\n\n`);
}

export function buildAgreementPrintHtml(opts: {
  partner: AgreementPartner;
  signedName?: string | null;
  signedAt?: string | null;
  countersignedAt?: string | null;
  countersignedBy?: string | null;
  config?: AgreementConfig;
}): string {
  const { partner, signedName, signedAt, countersignedAt, countersignedBy, config } = opts;
  const c = { ...CONFIG_DEFAULTS, ...config };
  const equity = (partner.investment_amount / c.total_pool_amount) * c.total_equity_pct;
  const agreementText = buildAgreementText(partner, config);

  const partnerSigBlock = signedName
    ? `<div class="sig-value">${signedName}</div>
       <div class="sig-label">Electronic Signature — Partner</div>
       <div class="sig-date">${signedAt ? fmt.date(signedAt) : ""}</div>`
    : `<div class="sig-empty">Not yet signed</div>`;

  const companySigBlock = countersignedAt
    ? `<div class="sig-value">${countersignedBy ?? c.ceo_name}</div>
       <div class="sig-label">Countersignature — ${c.company_full_name}</div>
       <div class="sig-date">${fmt.date(countersignedAt)}</div>`
    : `<div class="sig-empty">Pending countersignature</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Musharakah Agreement — ${partner.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #111; background: #fff; line-height: 1.6; }
    .page { max-width: 750px; margin: 0 auto; padding: 40px 48px; }
    .header { border-bottom: 2px solid #0f2a1e; padding-bottom: 20px; margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between; }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-mark { width: 36px; height: 36px; background: linear-gradient(145deg,#0c2016,#132d20); border: 1.5px solid rgba(212,168,67,0.35); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .logo-name { font-size: 16px; font-weight: 700; color: #0f2a1e; line-height: 1.2; letter-spacing: -0.02em; font-family: sans-serif; }
    .logo-sub { font-size: 9px; color: #40916c; text-transform: uppercase; letter-spacing: 1.5px; font-family: sans-serif; }
    .header-right { text-align: right; font-size: 10px; color: #666; font-family: sans-serif; }
    .summary { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 28px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-family: sans-serif; }
    .sum-item .label { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
    .sum-item .value { font-size: 13px; font-weight: 700; color: #111; }
    .sum-item .value.gold { color: #d4a843; }
    .sum-item .value.green { color: #40916c; }
    .agreement-body { white-space: pre-wrap; font-size: 11pt; line-height: 1.7; color: #222; margin-bottom: 40px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; border-top: 2px solid #0f2a1e; padding-top: 24px; margin-top: 32px; font-family: sans-serif; }
    .sig-party { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 600; }
    .sig-value { font-size: 20pt; font-family: 'Brush Script MT', cursive; color: #0f2a1e; border-bottom: 1px solid #0f2a1e; padding-bottom: 4px; min-height: 36px; margin-bottom: 6px; }
    .sig-label { font-size: 10px; color: #374151; font-weight: 600; }
    .sig-date { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .sig-empty { font-size: 11px; color: #d1d5db; border-bottom: 1px solid #d1d5db; padding: 8px 0; min-height: 36px; margin-bottom: 6px; font-style: italic; }
    .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 9pt; color: #9ca3af; text-align: center; font-family: sans-serif; }
    .verified-badge { display: inline-flex; align-items: center; gap: 6px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 20px; padding: 4px 12px; font-size: 10px; color: #16a34a; font-weight: 600; font-family: sans-serif; margin-bottom: 24px; }
    @media print { body { font-size: 11pt; } .page { padding: 20px 32px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="background:#0f2a1e;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;font-family:sans-serif">
    <span style="color:#74c69d;font-size:13px;font-weight:600">${c.company_full_name} — Partnership Agreement</span>
    <button onclick="window.print()" style="background:#d4a843;color:#0f2a1e;border:none;padding:8px 20px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer">
      ⬇ Download / Print PDF
    </button>
  </div>
  <div class="page">
    <div class="header">
      <div class="logo">
        <div class="logo-mark">
          <svg viewBox="0 0 26 20" fill="none" width="17" height="13"><path d="M2 18V2L13 11L24 2V18" stroke="#d4a843" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div style="margin-left:10px">
          <div class="logo-name">Mizark</div>
          <div class="logo-sub">Musharakah Partnership</div>
        </div>
      </div>
      <div class="header-right">
        <div>Agreement Version 1.0</div>
        <div>Prepared for: ${partner.name}</div>
        ${signedAt ? `<div>Signed: ${fmt.date(signedAt)}</div>` : ""}
        ${countersignedAt ? `<div>Countersigned: ${fmt.date(countersignedAt)}</div>` : ""}
      </div>
    </div>

    ${countersignedAt && signedAt ? `
    <div style="text-align:center;margin-bottom:24px">
      <div class="verified-badge">✓ Fully Executed — Both Parties Have Signed</div>
    </div>` : signedAt ? `
    <div style="text-align:center;margin-bottom:24px">
      <div class="verified-badge" style="background:#fffbeb;border-color:#fde68a;color:#d97706">⏳ Awaiting Countersignature from ${c.company_full_name}</div>
    </div>` : ""}

    <div class="summary">
      <div class="sum-item">
        <div class="label">Partner</div>
        <div class="value">${partner.name}</div>
      </div>
      <div class="sum-item">
        <div class="label">Investment</div>
        <div class="value gold">${fmt.naira(partner.investment_amount)}</div>
      </div>
      <div class="sum-item">
        <div class="label">Equity Stake</div>
        <div class="value green">${equity.toFixed(3)}%</div>
      </div>
      <div class="sum-item">
        <div class="label">Term</div>
        <div class="value">${c.term_years} Years</div>
      </div>
    </div>

    <div class="agreement-body">${agreementText.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-party">Party B — The Partner</div>
        ${partnerSigBlock}
      </div>
      <div class="sig-block">
        <div class="sig-party">Party A — ${c.company_full_name}</div>
        ${companySigBlock}
      </div>
    </div>

    <div class="footer">
      This is a legally binding Musharakah agreement governed by Shariah law and the laws of ${c.governing_law}.<br>
      ${c.company_full_name} · partners.mizarkglobal.com<br>
      Document generated ${new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
    </div>
  </div>
</body>
</html>`;
}
