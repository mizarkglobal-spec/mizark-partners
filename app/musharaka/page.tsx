import Link from "next/link";
import MizarkLogo from "@/components/MizarkLogo";

export const metadata = {
  title: "Musharakah Explained | Mizark Partners",
  description: "Learn about the Islamic partnership principles — Musharakah — that govern the Mizark Global Partner Programme.",
};

const sections = [
  {
    id: "what-is",
    title: "What is Musharakah?",
    icon: "📖",
    content: [
      { type: "p", text: "Musharakah (مشاركة) is an Islamic finance contract meaning \"partnership\" or \"sharing\". It is one of the most important concepts in Islamic commercial law, derived from the Arabic root shirka — to share." },
      { type: "p", text: "In a Musharakah arrangement, two or more parties pool capital to jointly own a business venture and share in its profits and losses according to a pre-agreed ratio. Unlike conventional loans, no fixed return is guaranteed — profits and losses are distributed proportionally to each partner's equity stake." },
      { type: "highlight", text: "Your partnership with Mizark Global is a Musharakah co-ownership structure where you hold a fixed equity stake for the 3-year term. All operations are guided by Shariah law as the primary framework." },
    ],
  },
  {
    id: "principles",
    title: "Core Shariah Principles",
    icon: "⚖️",
    content: [
      {
        type: "list",
        items: [
          { heading: "No Riba (Interest)", detail: "All returns are profit-based, not interest-based. Your earnings come from genuine business profits — never from a predetermined fixed rate." },
          { heading: "Shared Risk & Reward", detail: "Both partners bear the business risk proportionally. Profits are shared; losses (if any) are absorbed in proportion to capital contributed." },
          { heading: "Transparency (Amanah)", detail: "Full disclosure of financial results is an obligation. Mizark Global publishes quarterly reports and distribution statements to all partners." },
          { heading: "Halal Business Activities", detail: "The entire business — products, revenue streams, marketing, and expenditures — is guided by Islamic law. No haram income sources are permitted." },
          { heading: "Mutual Consent (Ijab & Qabul)", detail: "The partnership is formalised through a written agreement signed by both parties, satisfying the Islamic requirement of offer and acceptance." },
        ],
      },
    ],
  },
  {
    id: "structure",
    title: "How the Partnership Works",
    icon: "🏗️",
    content: [
      {
        type: "steps",
        items: [
          { step: "01", heading: "Capital Contribution", detail: "Partners invest a fixed amount (minimum ₦1,000,000) into Mizark Global's operating pool. Each partner's equity percentage is calculated proportionally to the total pool." },
          { step: "02", heading: "Equity Allocation", detail: "Your equity stake represents your proportional ownership of the business for the 3-year term. Formula: Your Investment ÷ Total Pool × Total Partner Equity %." },
          { step: "03", heading: "Business Operations", detail: "Mizark Global deploys the capital across its Shariah-compliant operations: the LeadAsh SaaS platform, the trading challenge programme, and the trading academy." },
          { step: "04", heading: "Quarterly Profit Distribution", detail: "After each quarter, net profits are calculated. A distribution pool is allocated to partners and shared proportionally to each partner's equity stake." },
          { step: "05", heading: "Reporting & Transparency", detail: "Partners receive quarterly distribution statements and have access to a partner dashboard at all times." },
        ],
      },
    ],
  },
  {
    id: "profits",
    title: "Profit & Loss Distribution",
    icon: "📊",
    content: [
      { type: "p", text: "Profit distribution in Musharakah must be based on a pre-agreed ratio — your ratio is simply your equity percentage. The formula for your quarterly distribution is:" },
      { type: "formula", text: "Your Share = Net Quarterly Profit × Distribution Pool % × Your Equity %" },
      { type: "p", text: "In the event of a loss in any given quarter, no distribution is paid. Losses reduce the business's retained earnings and are not passed directly to partners as personal liability — your risk is limited to your capital contribution." },
    ],
  },
  {
    id: "governance",
    title: "Governance & Dispute Resolution",
    icon: "🕌",
    content: [
      { type: "p", text: "All matters relating to this partnership are governed by Shariah law as the primary legal framework. Nigerian civil law applies secondarily for formal enforcement matters only." },
      {
        type: "list",
        items: [
          { heading: "Primary: Shariah Court", detail: "Any dispute is first brought before a Shariah court of competent jurisdiction." },
          { heading: "Secondary: Islamic Arbitration", detail: "Where a Shariah court ruling is not practical, an Islamic arbitration panel with a qualified Shariah scholar is convened. Both parties have equal appointment rights." },
          { heading: "Civil Courts (Limited)", detail: "Nigerian civil courts may only be used for urgent interim relief (e.g., injunctions), not for substantive dispute resolution." },
        ],
      },
    ],
  },
  {
    id: "rights",
    title: "Partner Rights",
    icon: "✅",
    content: [
      {
        type: "list",
        items: [
          { heading: "Right to Profits", detail: "You are entitled to your proportional share of all distributed profits each quarter." },
          { heading: "Right to Information", detail: "You may request financial statements and operational reports at any time." },
          { heading: "Right to Exit", detail: "You may exit the partnership at the end of the 3-year term or through mutual agreement." },
          { heading: "Right to Dispute Resolution", detail: "You have full access to Shariah-compliant dispute resolution mechanisms." },
          { heading: "Right to Documentation", detail: "A signed copy of your agreement is accessible at all times through your partner dashboard." },
        ],
      },
    ],
  },
  {
    id: "glossary",
    title: "Glossary of Terms",
    icon: "📚",
    content: [
      {
        type: "glossary",
        items: [
          { term: "Musharakah", def: "Islamic partnership contract based on shared ownership and profit/loss sharing." },
          { term: "Riba", def: "Interest — prohibited in Islam. All Mizark returns are profit-based, not interest-based." },
          { term: "Equity Stake", def: "Your proportional ownership percentage in the business for the duration of the term." },
          { term: "Distribution Pool", def: "The portion of net profit set aside each quarter to be shared among all partners." },
          { term: "Shariah", def: "Islamic law derived from the Quran and Sunnah, governing all aspects of commerce." },
          { term: "Amanah", def: "Trustworthiness and transparency — a core Islamic commercial principle." },
          { term: "Halal", def: "Permissible under Islamic law." },
          { term: "Haram", def: "Prohibited under Islamic law (e.g., interest, gambling, alcohol)." },
          { term: "Ijab & Qabul", def: "Offer and acceptance — the contractual basis of Islamic agreements." },
          { term: "Arbitration", def: "Alternative dispute resolution outside of court, using a neutral third party." },
        ],
      },
    ],
  },
];

export default function MusharakaPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-geist), 'Segoe UI', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.08]" style={{ background: "rgba(15,42,30,0.97)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[62px] flex items-center justify-between">
          <Link href="/"><MizarkLogo subtitle="Partner Programme" /></Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-white/50 hover:text-white text-sm transition-colors">Sign In</Link>
            <Link
              href="/apply"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-[10px] font-semibold text-[13px] transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#d4a843,#c49a38)", color: "#0f2a1e" }}
            >
              Apply Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: "linear-gradient(160deg,#081a11,#0f2a1e)" }} className="py-16 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#74c69d] mb-3">Islamic Finance</p>
          <h1 className="text-[36px] sm:text-[48px] font-bold text-white tracking-[-0.025em] mb-4">Musharakah Explained</h1>
          <p className="text-white/60 text-[15px] leading-relaxed max-w-xl">
            Understanding the Shariah-compliant partnership principles behind the Mizark Global Partner Programme — what they mean, how they protect you, and why they matter.
          </p>
        </div>
      </div>

      {/* Quick nav */}
      <div className="border-b border-gray-100 sticky top-[62px] z-40 bg-white/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-3 flex gap-2 overflow-x-auto">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-[#40916c] hover:text-[#40916c] transition-colors whitespace-nowrap"
            >
              {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 space-y-8">
        {sections.map((section) => (
          <div key={section.id} id={section.id} className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{section.icon}</span>
              <h2 className="text-xl font-bold text-gray-900" style={{ letterSpacing: "-0.02em" }}>{section.title}</h2>
            </div>
            <div className="space-y-4 pl-1">
              {section.content.map((block, bi) => {
                if (block.type === "p") return <p key={bi} className="text-gray-600 leading-relaxed">{block.text}</p>;
                if (block.type === "highlight") return (
                  <div key={bi} className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-5 py-4">
                    <p className="text-[#166534] leading-relaxed text-sm">{block.text}</p>
                  </div>
                );
                if (block.type === "formula") return (
                  <div key={bi} className="rounded-xl px-5 py-4 text-center" style={{ background: "#0f2a1e" }}>
                    <p className="text-[#74c69d] font-mono text-sm font-semibold">{block.text}</p>
                  </div>
                );
                if (block.type === "list") return (
                  <div key={bi} className="space-y-3">
                    {block.items!.map((item, ii) => (
                      <div key={ii} className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#40916c] mt-2.5 flex-shrink-0" />
                        <div><span className="font-semibold text-gray-800">{item.heading}: </span><span className="text-gray-600">{item.detail}</span></div>
                      </div>
                    ))}
                  </div>
                );
                if (block.type === "steps") return (
                  <div key={bi} className="space-y-5">
                    {block.items!.map((item, ii) => (
                      <div key={ii} className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-[#0f2a1e] text-[#74c69d] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {item.step}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 mb-1">{item.heading}</div>
                          <div className="text-gray-500 leading-relaxed text-sm">{item.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
                if (block.type === "glossary") return (
                  <div key={bi} className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                    {block.items!.map((item, ii) => (
                      <div key={ii} className="py-3 px-4 flex gap-4">
                        <div className="w-36 flex-shrink-0 font-semibold text-[#0f2a1e] text-sm">{item.term}</div>
                        <div className="text-gray-500 text-sm">{item.def}</div>
                      </div>
                    ))}
                  </div>
                );
                return null;
              })}
            </div>
            <div className="mt-8 border-b border-gray-100" />
          </div>
        ))}

        {/* CTA */}
        <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg,#081a11,#0f2a1e)" }}>
          <p className="text-[#74c69d] text-xs uppercase tracking-widest font-semibold mb-3">Ready to Join?</p>
          <h3 className="text-2xl font-bold text-white mb-3" style={{ letterSpacing: "-0.02em" }}>Become a Musharakah Partner</h3>
          <p className="text-white/50 text-sm mb-6 max-w-sm mx-auto">
            Apply to join the Mizark Global Partner Programme and earn Shariah-compliant returns on your investment.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#d4a843,#c49a38)", color: "#0f2a1e" }}
          >
            Apply Now →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 flex flex-wrap gap-5 justify-center text-xs text-gray-400">
          <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
          <Link href="/apply" className="hover:text-gray-600 transition-colors">Apply</Link>
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
          <a href="mailto:partners@mizarkglobal.com" className="hover:text-gray-600 transition-colors">partners@mizarkglobal.com</a>
        </div>
      </footer>
    </div>
  );
}
