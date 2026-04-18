const FROM    = process.env.FROM_EMAIL ?? "partners@mizarkglobal.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://partners.mizarkglobal.com";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.warn("[email] No RESEND_API_KEY — skipping send"); return; }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `Mizark Global <${FROM}>`, to: [opts.to], subject: opts.subject, html: opts.html, text: opts.text }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend error ${res.status}: ${body}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

// ── Application received ────────────────────────────────────────────────────
export async function sendApplicationReceived(opts: { name: string; email: string; amount: string }) {
  await sendEmail({
    to: opts.email,
    subject: "Your Mizark Global partnership application is received",
    text: `Assalamu Alaikum ${opts.name},\n\nJazakAllah Khair for your interest in partnering with Mizark Global. We have received your application and will review it within 2–3 business days.\n\nIf approved, you will receive a private link to review our full pitch materials.\n\nBest regards,\nMizark Global Team`,
    html: baseEmail(`
      <p style="font-size:16px;margin-top:0">Assalamu Alaikum <strong>${opts.name}</strong>,</p>
      <p style="color:#6b7280">JazakAllah Khair for your interest in partnering with Mizark Global.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:24px 0">
        <p style="margin:0 0 8px;font-weight:600;color:#15803d;font-size:13px;text-transform:uppercase;letter-spacing:0.5px">Application Received</p>
        <p style="margin:0;font-size:14px;color:#374151">Investment intent: <strong>₦${opts.amount}</strong></p>
      </div>
      <p style="color:#6b7280;font-size:14px">We review every application personally and will get back to you within <strong>2–3 business days</strong>. If approved, you will receive a private link to review our full pitch materials and financial details.</p>
      <p style="color:#9ca3af;font-size:13px;margin-top:32px">— Mizark Global Partnership Team</p>
    `),
  });
}

// ── Application approved ────────────────────────────────────────────────────
export async function sendApplicationApproved(opts: { name: string; email: string; token: string }) {
  const pitchUrl = `${APP_URL}/pitch/${opts.token}`;
  await sendEmail({
    to: opts.email,
    subject: "Your Mizark Global application is approved — view pitch materials",
    text: `Assalamu Alaikum ${opts.name},\n\nAlhamdulillah, your partnership application has been approved.\n\nPlease use your private link to review our full pitch materials:\n${pitchUrl}\n\nThis link is private and unique to you.\n\n— Mizark Global Team`,
    html: baseEmail(`
      <p style="font-size:16px;margin-top:0">Assalamu Alaikum <strong>${opts.name}</strong>,</p>
      <p>Alhamdulillah, your partnership application has been <strong style="color:#16a34a">approved!</strong></p>
      <p style="color:#6b7280">Please use your private link below to review our full pitch materials, financial details, and partnership terms.</p>
      <p style="margin:28px 0"><a href="${pitchUrl}" style="display:inline-block;background:#1a3a2a;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">View Pitch Materials →</a></p>
      <p style="color:#9ca3af;font-size:12px">This link is private and unique to you. Do not share it.</p>
      <p style="color:#9ca3af;font-size:13px;margin-top:32px">— Mizark Global Partnership Team</p>
    `),
  });
}

// ── Application rejected ────────────────────────────────────────────────────
export async function sendApplicationRejected(opts: { name: string; email: string; note?: string }) {
  await sendEmail({
    to: opts.email,
    subject: "Update on your Mizark Global partnership application",
    text: `Assalamu Alaikum ${opts.name},\n\nJazakAllah Khair for your interest in partnering with Mizark Global.\n\nAfter careful consideration, we are unable to proceed with your application at this time. We may open future rounds — we encourage you to stay connected.\n\n${opts.note ? `Note: ${opts.note}\n\n` : ""}— Mizark Global Team`,
    html: baseEmail(`
      <p style="font-size:16px;margin-top:0">Assalamu Alaikum <strong>${opts.name}</strong>,</p>
      <p style="color:#6b7280">JazakAllah Khair for your interest in partnering with Mizark Global.</p>
      <p style="color:#6b7280">After careful consideration, we are unable to proceed with your application at this time. We may open future rounds and will reach out if a suitable opportunity arises.</p>
      ${opts.note ? `<div style="background:#fef2f2;border-left:3px solid #fca5a5;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0;font-size:14px;color:#7f1d1d">${opts.note}</div>` : ""}
      <p style="color:#9ca3af;font-size:13px;margin-top:32px">— Mizark Global Partnership Team</p>
    `),
  });
}

// ── Agreement ready for signing ─────────────────────────────────────────────
export async function sendAgreementReady(opts: { name: string; email: string; token: string }) {
  const agreementUrl = `${APP_URL}/agreement/${opts.token}`;
  await sendEmail({
    to: opts.email,
    subject: "Your Mizark Global Musharakah Agreement is ready to sign",
    text: `Assalamu Alaikum ${opts.name},\n\nYour partnership agreement is ready. Please review and sign it at:\n${agreementUrl}\n\n— Mizark Global Team`,
    html: baseEmail(`
      <p style="font-size:16px;margin-top:0">Assalamu Alaikum <strong>${opts.name}</strong>,</p>
      <p style="color:#6b7280">Your Musharakah Partnership Agreement is ready for review and signature.</p>
      <p style="margin:28px 0"><a href="${agreementUrl}" style="display:inline-block;background:#1a3a2a;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">Review &amp; Sign Agreement →</a></p>
      <p style="color:#9ca3af;font-size:12px">Please review the agreement carefully before signing.</p>
      <p style="color:#9ca3af;font-size:13px;margin-top:32px">— Mizark Global Partnership Team</p>
    `),
  });
}

// ── Payment instructions ────────────────────────────────────────────────────
export async function sendPaymentInstructions(opts: { name: string; email: string; token: string; amount: number }) {
  const paymentUrl = `${APP_URL}/payment/${opts.token}`;
  const formatted  = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(opts.amount);
  await sendEmail({
    to: opts.email,
    subject: `Complete your Mizark Global partnership investment — ${formatted}`,
    text: `Assalamu Alaikum ${opts.name},\n\nYour agreement has been countersigned. Please complete your investment payment of ${formatted} at:\n${paymentUrl}\n\n— Mizark Global Team`,
    html: baseEmail(`
      <p style="font-size:16px;margin-top:0">Assalamu Alaikum <strong>${opts.name}</strong>,</p>
      <p style="color:#6b7280">Your agreement has been countersigned by Mizark Global. You are one step away from becoming a partner.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:24px 0;text-align:center">
        <p style="margin:0 0 4px;color:#6b7280;font-size:13px">Investment Amount</p>
        <p style="margin:0;font-size:28px;font-weight:700;color:#111">${formatted}</p>
      </div>
      <p style="margin:28px 0;text-align:center"><a href="${paymentUrl}" style="display:inline-block;background:#1a3a2a;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">Complete Payment →</a></p>
      <p style="color:#9ca3af;font-size:13px;margin-top:32px">— Mizark Global Partnership Team</p>
    `),
  });
}

// ── Welcome / partner activated ─────────────────────────────────────────────
export async function sendWelcomePartner(opts: { name: string; email: string; equityPct: number; amount: number; setupUrl?: string }) {
  const dashUrl   = `${APP_URL}/dashboard`;
  const actionUrl = opts.setupUrl ?? dashUrl;
  const formatted = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(opts.amount);
  await sendEmail({
    to: opts.email,
    subject: "Welcome to Mizark Global — you are now a partner",
    text: `Assalamu Alaikum ${opts.name},\n\nAlhamdulillah! Your investment has been confirmed and you are now an official Musharakah partner of Mizark Global.\n\nInvestment: ${formatted}\nEquity stake: ${opts.equityPct.toFixed(3)}%\n\nSet up your account to access your dashboard:\n${actionUrl}\n\n— Mizark Global Team`,
    html: baseEmail(`
      <p style="font-size:16px;margin-top:0">Assalamu Alaikum <strong>${opts.name}</strong>,</p>
      <p>Alhamdulillah! Your investment has been confirmed. <strong>Welcome to the Mizark Global family.</strong></p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:24px 0">
        <p style="margin:0 0 12px;font-weight:600;color:#15803d;font-size:13px;text-transform:uppercase;letter-spacing:0.5px">Your Partnership Details</p>
        <table style="font-size:14px;color:#374151;border-spacing:0;width:100%">
          <tr><td style="padding:4px 0;color:#6b7280">Investment</td><td style="text-align:right;font-weight:600">${formatted}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280">Equity Stake</td><td style="text-align:right;font-weight:600">${opts.equityPct.toFixed(3)}%</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280">Term</td><td style="text-align:right">3 Years (Musharakah)</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280">Distributions</td><td style="text-align:right">Quarterly</td></tr>
        </table>
      </div>
      <p style="color:#6b7280;font-size:14px">Set up your password or sign in with Google to access your partner dashboard.</p>
      <p style="margin:28px 0"><a href="${actionUrl}" style="display:inline-block;background:#1a3a2a;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">Set Up Your Account →</a></p>
      <p style="color:#9ca3af;font-size:12px">This link expires in 24 hours. After setup you can sign in at <a href="${APP_URL}/login" style="color:#9ca3af">${APP_URL}/login</a></p>
      <p style="color:#9ca3af;font-size:13px;margin-top:32px">— Mizark Global Partnership Team</p>
    `),
  });
}

// ── Admin invite ────────────────────────────────────────────────────────────
export async function sendAdminInvite(opts: { name?: string; email: string; invitedBy: string; loginUrl: string }) {
  const displayName = opts.name || opts.email;
  await sendEmail({
    to: opts.email,
    subject: "You've been invited as a Mizark Global admin",
    text: `Assalamu Alaikum ${displayName},\n\n${opts.invitedBy} has invited you to access the Mizark Global Partner Portal as an admin.\n\nClick the link below to accept and sign in:\n${opts.loginUrl}\n\nThis link expires in 24 hours.\n\n— Mizark Global Team`,
    html: baseEmail(`
      <p style="font-size:16px;margin-top:0">Assalamu Alaikum${opts.name ? ` <strong>${opts.name}</strong>` : ""},</p>
      <p style="color:#6b7280"><strong>${opts.invitedBy}</strong> has invited you to access the Mizark Global Partner Portal as an administrator.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:24px 0">
        <p style="margin:0 0 4px;font-weight:600;color:#15803d;font-size:13px;text-transform:uppercase;letter-spacing:0.5px">Admin Access</p>
        <p style="margin:0;font-size:14px;color:#374151">You will have full access to the admin panel — partners, financials, distributions, and settings.</p>
      </div>
      <p style="margin:28px 0"><a href="${opts.loginUrl}" style="display:inline-block;background:#1a3a2a;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">Accept Invitation →</a></p>
      <p style="color:#9ca3af;font-size:12px">This link expires in 24 hours. If you did not expect this invitation, you can safely ignore this email.</p>
      <p style="color:#9ca3af;font-size:13px;margin-top:32px">— Mizark Global Partnership Team</p>
    `),
  });
}

// ── Distribution paid ───────────────────────────────────────────────────────
export async function sendDistributionPaid(opts: { name: string; email: string; amount: number; period: string }) {
  const dashUrl   = `${APP_URL}/dashboard/returns`;
  const formatted = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(opts.amount);
  await sendEmail({
    to: opts.email,
    subject: `Your Q${opts.period} profit distribution — ${formatted}`,
    text: `Assalamu Alaikum ${opts.name},\n\nYour quarterly profit distribution of ${formatted} for the period ${opts.period} has been processed.\n\nView your returns: ${dashUrl}\n\n— Mizark Global Team`,
    html: baseEmail(`
      <p style="font-size:16px;margin-top:0">Assalamu Alaikum <strong>${opts.name}</strong>,</p>
      <p style="color:#6b7280">Your quarterly profit distribution has been processed and sent to your account.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin:24px 0;text-align:center">
        <p style="margin:0 0 4px;color:#6b7280;font-size:13px">Distribution — ${opts.period}</p>
        <p style="margin:0;font-size:32px;font-weight:700;color:#16a34a">${formatted}</p>
      </div>
      <p style="margin:28px 0;text-align:center"><a href="${dashUrl}" style="display:inline-block;background:#1a3a2a;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">View Returns Dashboard →</a></p>
      <p style="color:#9ca3af;font-size:13px;margin-top:32px">— Mizark Global Partnership Team</p>
    `),
  });
}

// ── Base email wrapper ──────────────────────────────────────────────────────
function baseEmail(content: string): string {
  return `
    <div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#374151;background:#f9fafb;padding:24px">
      <div style="background:#1a3a2a;padding:24px 32px;border-radius:12px 12px 0 0;display:flex;align-items:center;gap:12px">
        <div>
          <p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.3px">Mizark Global</p>
          <p style="margin:0;font-size:11px;color:#6ee7b7;letter-spacing:0.5px;text-transform:uppercase">Partnership Programme</p>
        </div>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:32px">
        ${content}
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:16px">
        Mizark Global Limited · Nigeria<br>
        <a href="${APP_URL}" style="color:#9ca3af">${APP_URL}</a>
      </p>
    </div>
  `;
}
