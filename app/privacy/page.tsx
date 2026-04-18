import Link from "next/link";
import MizarkLogo from "@/components/MizarkLogo";

export const metadata = {
  title: "Privacy Policy | Mizark Partners",
  description: "How Mizark Global Limited collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  const updated = "18 April 2026";

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-geist), 'Segoe UI', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 border-b border-white/[0.08]"
        style={{ background: "rgba(15,42,30,0.97)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[62px] flex items-center justify-between">
          <Link href="/">
            <MizarkLogo subtitle="Partner Programme" />
          </Link>
          <Link
            href="/apply"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-[10px] font-semibold text-[13px] transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#d4a843,#c49a38)", color: "#0f2a1e" }}
          >
            Apply Now
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#081a11,#0f2a1e)" }} className="py-16 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#74c69d] mb-3">Legal</p>
          <h1 className="text-[36px] sm:text-[48px] font-bold text-white tracking-[-0.025em] mb-4">Privacy Policy</h1>
          <p className="text-white/40 text-[14px]">Last updated: {updated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <div className="prose prose-gray max-w-none" style={{ color: "#374151" }}>

          <Section title="1. Who We Are">
            <p>
              Mizark Global Limited ("<strong>Mizark</strong>", "<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>") is a company registered in Nigeria. We operate the Mizark Partner Programme — a private equity partnership platform accessible at{" "}
              <span className="text-[#0f2a1e] font-medium">growbymizark.site</span> (the "<strong>Platform</strong>").
            </p>
            <p>
              For questions about this Policy, contact us at{" "}
              <a href="mailto:partners@mizarkglobal.com" className="text-[#40916c] hover:underline">
                partners@mizarkglobal.com
              </a>.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <Subsection title="2.1 Information you provide directly">
              <ul>
                <li><strong>Application data:</strong> full name, email address, phone number, investment amount of interest, and any other details submitted via the application form.</li>
                <li><strong>Account credentials:</strong> email address and password (stored in hashed form) or OAuth tokens if you sign in via Google.</li>
                <li><strong>Payment information:</strong> bank account details or card data provided to complete your investment. Card data is processed by Paystack and is not stored on our servers.</li>
                <li><strong>Agreement data:</strong> digital signature, date of signing, and agreement version accepted.</li>
                <li><strong>Communications:</strong> messages you send us via email or through the Platform.</li>
              </ul>
            </Subsection>
            <Subsection title="2.2 Information collected automatically">
              <ul>
                <li><strong>Usage data:</strong> pages visited, features used, timestamps, and session duration.</li>
                <li><strong>Device data:</strong> IP address, browser type, operating system, and referring URLs.</li>
                <li><strong>Cookies and similar technologies:</strong> authentication tokens and session cookies necessary for the Platform to function. We do not use advertising or tracking cookies.</li>
              </ul>
            </Subsection>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use your personal data only for the purposes described below:</p>
            <ul>
              <li><strong>To process your application</strong> and determine eligibility for the Partner Programme.</li>
              <li><strong>To create and manage your account</strong> and provide access to the partner dashboard.</li>
              <li><strong>To execute and manage your investment</strong>, including generating your Musharakah agreement and processing payments.</li>
              <li><strong>To distribute quarterly profits</strong> to your Nigerian bank account.</li>
              <li><strong>To send you transactional communications</strong> — application updates, account setup links, payment confirmations, and distribution notices. We do not send marketing emails without your explicit consent.</li>
              <li><strong>To comply with applicable Nigerian laws</strong>, including financial regulations and anti-money laundering obligations.</li>
              <li><strong>To improve the Platform</strong> using aggregated, anonymised usage analytics.</li>
            </ul>
          </Section>

          <Section title="4. Legal Basis for Processing">
            <p>We process your personal data on the following legal bases under the Nigeria Data Protection Act (NDPA) 2023:</p>
            <ul>
              <li><strong>Contract performance:</strong> processing necessary to execute and administer your Musharakah partnership agreement.</li>
              <li><strong>Legitimate interests:</strong> ensuring platform security, preventing fraud, and improving our services.</li>
              <li><strong>Legal obligation:</strong> complying with Nigerian financial, tax, and regulatory requirements.</li>
              <li><strong>Consent:</strong> where we have obtained your explicit consent (e.g., optional communications), which you may withdraw at any time.</li>
            </ul>
          </Section>

          <Section title="5. How We Share Your Information">
            <p>We do not sell your personal data. We share it only in these limited circumstances:</p>
            <ul>
              <li><strong>Service providers:</strong> Supabase (database and authentication hosting), Resend (transactional email delivery), Paystack (payment processing), and Vercel (web hosting). All service providers are contractually required to protect your data.</li>
              <li><strong>Legal requirements:</strong> when required by Nigerian law, court order, or regulatory authority.</li>
              <li><strong>Business transfer:</strong> in the event of a merger, acquisition, or sale of assets, subject to equivalent data protection obligations.</li>
              <li><strong>With your consent:</strong> for any other sharing you explicitly agree to.</li>
            </ul>
          </Section>

          <Section title="6. Data Retention">
            <p>
              We retain your personal data for as long as your account is active or as necessary to fulfil the purposes described in this Policy. For active partners, we retain records throughout the duration of the partnership and for <strong>7 years</strong> thereafter, as required by Nigerian financial regulations. Applicants who are not admitted have their data retained for <strong>12 months</strong> after our final decision, after which it is securely deleted.
            </p>
          </Section>

          <Section title="7. Data Security">
            <p>
              We implement appropriate technical and organisational measures to protect your data, including:
            </p>
            <ul>
              <li>Encryption of data in transit (TLS 1.2+) and at rest.</li>
              <li>Password hashing using bcrypt.</li>
              <li>Role-based access controls — only authorised team members can access personal data relevant to their function.</li>
              <li>Regular security reviews of our infrastructure and third-party providers.</li>
            </ul>
            <p>
              No transmission over the internet is 100% secure. You are responsible for keeping your account credentials confidential.
            </p>
          </Section>

          <Section title="8. Your Rights">
            <p>Under the Nigeria Data Protection Act 2023, you have the right to:</p>
            <ul>
              <li><strong>Access</strong> a copy of the personal data we hold about you.</li>
              <li><strong>Rectify</strong> inaccurate or incomplete data.</li>
              <li><strong>Erasure</strong> of data we no longer have a lawful basis to retain (subject to legal obligations).</li>
              <li><strong>Restrict</strong> or object to certain processing activities.</li>
              <li><strong>Data portability</strong> — receive your data in a structured, machine-readable format.</li>
              <li><strong>Withdraw consent</strong> where processing is based on consent, without affecting prior processing.</li>
            </ul>
            <p>
              To exercise any of these rights, email us at{" "}
              <a href="mailto:partners@mizarkglobal.com" className="text-[#40916c] hover:underline">
                partners@mizarkglobal.com
              </a>. We will respond within 30 days. Note that some rights may be limited where we are required by law to retain data.
            </p>
          </Section>

          <Section title="9. Cookies">
            <p>
              We use only essential cookies required for authentication and secure session management. We do not use cookies for advertising or third-party tracking. You can disable cookies in your browser settings, but this will prevent you from logging in to the Platform.
            </p>
          </Section>

          <Section title="10. Children's Privacy">
            <p>
              The Platform is intended for adults (18 years and above) only. We do not knowingly collect personal data from individuals under 18. If you believe we have inadvertently collected such data, please contact us immediately.
            </p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>
              We may update this Policy from time to time. We will notify active partners of material changes via email at least 14 days before the changes take effect. The "Last updated" date at the top of this page reflects the most recent revision. Continued use of the Platform after changes take effect constitutes acceptance of the updated Policy.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              For any questions, concerns, or requests regarding this Privacy Policy:
            </p>
            <div className="bg-gray-50 rounded-[16px] p-6 mt-4">
              <p className="font-semibold text-[#0f2a1e]">Mizark Global Limited</p>
              <p className="text-gray-600 text-[14px] mt-1">Email: <a href="mailto:partners@mizarkglobal.com" className="text-[#40916c] hover:underline">partners@mizarkglobal.com</a></p>
              <p className="text-gray-600 text-[14px]">Registered in Nigeria</p>
            </div>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-4">
          <Link href="/terms" className="text-[#40916c] hover:underline text-[14px] font-medium">Terms of Service →</Link>
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-[14px]">← Back to Home</Link>
        </div>
      </div>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-[20px] font-bold text-[#0f2a1e] tracking-[-0.01em] mb-4 pb-2 border-b border-gray-100">
        {title}
      </h2>
      <div className="space-y-3 text-[15px] leading-[1.75] text-gray-600">{children}</div>
    </div>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-[15px] font-semibold text-[#0f2a1e] mb-2">{title}</h3>
      <div className="text-[14px] leading-[1.75] text-gray-600">{children}</div>
    </div>
  );
}

function PublicFooter() {
  return (
    <footer style={{ background: "#060f09", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(145deg,#0c2016,#132d20)", border: "1.5px solid rgba(212,168,67,0.35)" }}
          >
            <svg viewBox="0 0 26 20" fill="none" className="w-[13px] h-[10px]" aria-hidden="true">
              <path d="M2 18V2L13 11L24 2V18" stroke="#d4a843" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-white/60 text-[13px] font-semibold">Mizark Global Limited</p>
            <p className="text-white/25 text-[11px]">Registered in Nigeria</p>
          </div>
        </div>
        <p className="text-white/20 text-[11px] text-center max-w-sm">
          Private placement. Not a public offer. Investment involves risk. Past performance does not guarantee future results.
        </p>
        <div className="flex gap-5">
          <Link href="/apply" className="text-white/30 hover:text-white/60 text-[13px] transition-colors">Apply</Link>
          <Link href="/login" className="text-white/30 hover:text-white/60 text-[13px] transition-colors">Partner Login</Link>
          <Link href="/privacy" className="text-white/50 hover:text-white/70 text-[13px] transition-colors">Privacy</Link>
          <Link href="/terms" className="text-white/30 hover:text-white/60 text-[13px] transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
