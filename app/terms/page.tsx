import Link from "next/link";
import MizarkLogo from "@/components/MizarkLogo";

export const metadata = {
  title: "Terms of Service | Mizark Partners",
  description: "Terms governing participation in the Mizark Global Partner Programme.",
};

export default function TermsPage() {
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
          <h1 className="text-[36px] sm:text-[48px] font-bold text-white tracking-[-0.025em] mb-4">Terms of Service</h1>
          <p className="text-white/40 text-[14px]">Last updated: {updated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <div className="max-w-none">

          <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-5 mb-10 flex gap-4">
            <span className="text-[20px] flex-shrink-0 mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold text-amber-900 text-[14px] mb-1">Important Disclaimer</p>
              <p className="text-amber-800 text-[13px] leading-relaxed">
                Participation in the Mizark Global Partner Programme is an equity investment. Your capital is at risk. Returns are not guaranteed. Only invest funds you can afford to commit for the full partnership term. These Terms of Service govern your use of the Platform and do not constitute financial advice.
              </p>
            </div>
          </div>

          <Section title="1. Definitions">
            <p>In these Terms:</p>
            <ul>
              <li><strong>"Agreement"</strong> means the Musharakah Partnership Agreement you sign as part of the investment process.</li>
              <li><strong>"Company"</strong>, <strong>"Mizark"</strong>, <strong>"we"</strong>, <strong>"us"</strong>, or <strong>"our"</strong> refers to Mizark Global Limited, a company registered in Nigeria.</li>
              <li><strong>"Partner"</strong> or <strong>"you"</strong> refers to an approved individual who has signed a Musharakah Agreement and made an investment.</li>
              <li><strong>"Platform"</strong> refers to the web application accessible at growbymizark.site, including the public website, application portal, and partner dashboard.</li>
              <li><strong>"Programme"</strong> refers to the Mizark Global Partner Programme — a private equity partnership opportunity structured as a Musharakah.</li>
              <li><strong>"Services"</strong> refers to all features and functionality provided through the Platform.</li>
            </ul>
          </Section>

          <Section title="2. Acceptance of Terms">
            <p>
              By accessing the Platform, submitting an application, or using any Services, you confirm that you have read, understood, and agree to be bound by these Terms of Service and our <Link href="/privacy" className="text-[#40916c] hover:underline">Privacy Policy</Link>. If you do not agree, you must not use the Platform or Services.
            </p>
            <p>
              These Terms apply to all visitors, applicants, and Partners. Your ongoing use of the Platform constitutes continued acceptance of any updates to these Terms.
            </p>
          </Section>

          <Section title="3. Eligibility">
            <p>To participate in the Programme, you must:</p>
            <ul>
              <li>Be at least 18 years of age.</li>
              <li>Be legally able to enter into binding contracts under Nigerian law.</li>
              <li>Have a valid Nigerian bank account for receiving distributions.</li>
              <li>Not be prohibited from investing under any applicable law or regulation.</li>
              <li>Have received and accepted an invitation to apply, or have been approved following our review process.</li>
            </ul>
            <p>
              We reserve the right to decline any application at our sole discretion and without obligation to provide reasons.
            </p>
          </Section>

          <Section title="4. The Partner Programme">
            <Subsection title="4.1 Nature of Investment">
              <p>
                The Programme is structured as a <strong>Musharakah</strong> (Islamic equity partnership). You acquire a proportional equity stake in Mizark Global Limited in exchange for your capital contribution. This is a genuine profit-and-loss sharing arrangement — not a loan, not a fixed-return product.
              </p>
            </Subsection>
            <Subsection title="4.2 Binding Agreement">
              <p>
                Your investment is governed by the Musharakah Partnership Agreement you sign during onboarding. These Terms of Service apply to your use of the Platform. Where there is a conflict between these Terms and your signed Agreement, the Agreement prevails with respect to investment terms.
              </p>
            </Subsection>
            <Subsection title="4.3 Investment Amounts">
              <p>
                Minimum and maximum investment amounts are set by Mizark and communicated on the Platform. These may change for future investment rounds but will not affect existing Partners' stakes once an Agreement is signed and payment confirmed.
              </p>
            </Subsection>
            <Subsection title="4.4 Profit Distributions">
              <p>
                Distributions are made quarterly — within 30 days of each quarter end (March, June, September, December). The distribution amount is calculated as a percentage of net quarterly profit, as specified in your Agreement, allocated proportionally to your equity stake. No distribution is made in a loss quarter.
              </p>
            </Subsection>
          </Section>

          <Section title="5. Platform Use">
            <Subsection title="5.1 Account Security">
              <p>
                You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately at <a href="mailto:partners@mizarkglobal.com" className="text-[#40916c] hover:underline">partners@mizarkglobal.com</a> if you suspect unauthorised access to your account.
              </p>
            </Subsection>
            <Subsection title="5.2 Prohibited Uses">
              <p>You must not:</p>
              <ul>
                <li>Use the Platform for any unlawful purpose or in violation of any Nigerian law or regulation.</li>
                <li>Attempt to gain unauthorised access to any part of the Platform or other users' accounts.</li>
                <li>Transmit viruses, malware, or other harmful code.</li>
                <li>Scrape, copy, or redistribute any content from the Platform without written permission.</li>
                <li>Impersonate Mizark, its employees, or other Partners.</li>
                <li>Use the Platform to engage in fraudulent, deceptive, or misleading conduct.</li>
              </ul>
            </Subsection>
            <Subsection title="5.3 Accuracy of Information">
              <p>
                You agree to provide accurate, complete, and current information in your application and throughout your tenure as a Partner. Providing false information may result in immediate termination of your participation and may have legal consequences.
              </p>
            </Subsection>
          </Section>

          <Section title="6. Intellectual Property">
            <p>
              All content on the Platform — including text, graphics, logos, software, financial models, and data — is the property of Mizark Global Limited or its licensors and is protected by applicable Nigerian intellectual property laws. You may not reproduce, distribute, or create derivative works without our prior written consent.
            </p>
            <p>
              Nothing in these Terms grants you any licence to use Mizark's trademarks, trade names, or logos.
            </p>
          </Section>

          <Section title="7. Financial Information and Risk">
            <Subsection title="7.1 Not Financial Advice">
              <p>
                All financial information on the Platform — including projections, historical performance data, and investment calculators — is provided for informational purposes only and does not constitute financial, investment, legal, or tax advice. You should seek independent professional advice before making any investment decision.
              </p>
            </Subsection>
            <Subsection title="7.2 Investment Risk">
              <p>
                Equity investment carries significant risk. You may receive less than you invested, or lose your entire investment. Past financial performance is not indicative of future results. Projections and estimates are based on assumptions that may not be realised.
              </p>
            </Subsection>
            <Subsection title="7.3 Liquidity Risk">
              <p>
                Your investment is illiquid for the duration of the partnership term. Early exit requires board approval and identification of a willing, approved buyer. We do not guarantee liquidity before term end.
              </p>
            </Subsection>
          </Section>

          <Section title="8. Confidentiality">
            <p>
              As a Partner, you will have access to confidential business information — including financial data, projections, business strategy, and partner details — via your dashboard and shared materials. You agree to keep all such information strictly confidential and not to disclose it to any third party without Mizark's prior written consent.
            </p>
            <p>
              This confidentiality obligation survives termination of your participation in the Programme for a period of <strong>5 years</strong>.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              To the fullest extent permitted by Nigerian law, Mizark Global Limited, its officers, directors, and employees shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the Platform or participation in the Programme, including but not limited to investment losses, lost profits, or data loss.
            </p>
            <p>
              Our total aggregate liability to you for any claim arising under these Terms shall not exceed the amount of fees (if any) paid by you to access the Platform in the 12 months preceding the claim.
            </p>
          </Section>

          <Section title="10. Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless Mizark Global Limited and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising from: (a) your breach of these Terms; (b) your use of the Platform; (c) your violation of any applicable law or third-party rights; or (d) any information you submit to the Platform.
            </p>
          </Section>

          <Section title="11. Termination">
            <p>
              We may suspend or terminate your access to the Platform at any time, with or without notice, if we reasonably believe you have violated these Terms or your Musharakah Agreement. Termination of Platform access does not automatically terminate your rights under a signed and paid-up Musharakah Agreement, which is governed by its own terms.
            </p>
            <p>
              You may close your account at any time by contacting us. Closure of your account does not release you from any obligations under your signed Agreement.
            </p>
          </Section>

          <Section title="12. Changes to These Terms">
            <p>
              We may update these Terms from time to time. We will notify active Partners of material changes via email at least 14 days before they take effect. The "Last updated" date at the top reflects the most recent revision. Your continued use of the Platform after changes take effect constitutes acceptance.
            </p>
          </Section>

          <Section title="13. Governing Law and Disputes">
            <p>
              These Terms are governed by the laws of the Federal Republic of Nigeria. Any dispute arising from or relating to these Terms or your use of the Platform shall first be subject to good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to arbitration in Lagos, Nigeria, under the Arbitration and Mediation Act 2023, before recourse to Nigerian courts.
            </p>
          </Section>

          <Section title="14. Severability">
            <p>
              If any provision of these Terms is found to be unenforceable or invalid under applicable law, that provision shall be limited or eliminated to the minimum extent necessary so that the remaining Terms shall continue in full force and effect.
            </p>
          </Section>

          <Section title="15. Entire Agreement">
            <p>
              These Terms, together with our Privacy Policy and your signed Musharakah Agreement (if applicable), constitute the entire agreement between you and Mizark Global Limited regarding your use of the Platform and participation in the Programme, and supersede all prior agreements and understandings.
            </p>
          </Section>

          <Section title="16. Contact">
            <p>For any questions about these Terms:</p>
            <div className="bg-gray-50 rounded-[16px] p-6 mt-4">
              <p className="font-semibold text-[#0f2a1e]">Mizark Global Limited</p>
              <p className="text-gray-600 text-[14px] mt-1">Email: <a href="mailto:partners@mizarkglobal.com" className="text-[#40916c] hover:underline">partners@mizarkglobal.com</a></p>
              <p className="text-gray-600 text-[14px]">Registered in Nigeria</p>
            </div>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-4">
          <Link href="/privacy" className="text-[#40916c] hover:underline text-[14px] font-medium">Privacy Policy →</Link>
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
          <Link href="/privacy" className="text-white/30 hover:text-white/60 text-[13px] transition-colors">Privacy</Link>
          <Link href="/terms" className="text-white/50 hover:text-white/70 text-[13px] transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
