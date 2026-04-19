"use client";

interface Props {
  profitPct: number;
  termYears: number;
  faq: { q: string; a: string }[];
}

export default function MusharakaContent({ profitPct, termYears, faq }: Props) {
  return (
    <div className="space-y-8">

      {/* What is Musharaka */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
            <span className="text-[#40916c] text-lg">م</span>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#40916c] font-semibold">Definition</div>
            <h2 className="text-xl font-bold text-[#111827]">What is Musharaka?</h2>
          </div>
        </div>
        <p className="text-gray-600 leading-relaxed mb-4">
          <strong className="text-[#111827]">Musharaka</strong> (مشاركة) is an Arabic word derived from the root <em>sharika</em> — meaning to share, participate, or partner. In Islamic finance, it refers to a joint venture or partnership arrangement where two or more parties contribute capital and/or labour to a business enterprise.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          Profits are shared among the partners according to an agreed ratio — which may differ from their capital contribution ratios. Losses, however, are always borne strictly in proportion to each partner&apos;s capital contribution. This fundamental asymmetry distinguishes Musharaka from Western equity structures and protects against exploitation.
        </p>
        <div className="bg-[#f0fdf4] border border-[#d1fae5] rounded-xl p-4">
          <p className="text-[#065f46] text-sm font-medium">
            In our structure: you contribute capital, Mizark Global contributes capital, management, and labour. Profits are distributed {profitPct}% to all partners (proportional to equity) and {100 - profitPct}% reinvested in operations. Losses, if any, reduce capital proportionally.
          </p>
        </div>
      </section>

      {/* Types of Musharaka */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#fffbeb] flex items-center justify-center flex-shrink-0">
            <span className="text-[#d4a843] text-lg">📚</span>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#d4a843] font-semibold">Taxonomy</div>
            <h2 className="text-xl font-bold text-[#111827]">Types of Musharaka</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: "Shirkat al-Amwal", arabic: "شركة الأموال", desc: "Capital partnership — two or more parties each contribute monetary capital. This is our structure. Each partner is a co-owner in proportion to their contribution.", active: true },
            { title: "Shirkat al-A'mal", arabic: "شركة الأعمال", desc: "Labour/service partnership — partners contribute skills and work rather than capital. Common among craftsmen and professionals. Also called Shirkat al-Abdan.", active: false },
            { title: "Shirkat al-Wujooh", arabic: "شركة الوجوه", desc: "Goodwill/credit partnership — partners use their reputation and creditworthiness to acquire goods on credit, then sell them for profit. No capital contributed.", active: false },
            { title: "Musharaka Mutanaqisah", arabic: "مشاركة متناقصة", desc: "Diminishing Musharaka — the bank/financier gradually transfers their ownership share to the client over time. Widely used in Islamic home finance.", active: false },
          ].map((t) => (
            <div key={t.title} className={`rounded-xl p-4 border ${t.active ? "bg-[#f0fdf4] border-[#bbf7d0]" : "bg-gray-50 border-gray-100"}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className={`font-semibold text-sm ${t.active ? "text-[#065f46]" : "text-[#111827]"}`}>{t.title}</h3>
                {t.active && <span className="bg-[#40916c] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0">Our Structure</span>}
              </div>
              <div className={`text-base mb-2 ${t.active ? "text-[#40916c]" : "text-gray-400"}`}>{t.arabic}</div>
              <p className="text-gray-500 text-xs leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quranic Evidence */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
            <span className="text-[#40916c] text-lg">قرآن</span>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#40916c] font-semibold">Scriptural Basis</div>
            <h2 className="text-xl font-bold text-[#111827]">Quranic Evidence</h2>
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-5 leading-relaxed">
          The permissibility and ethics of partnership are grounded in multiple Quranic verses. The Quran does not prohibit partnership — on the contrary, it endorses fair dealing, mutual consent, and fulfilment of contracts.
        </p>
        <div className="space-y-4">
          {[
            { arabic: "وَإِنَّ كَثِيرًا مِّنَ الْخُلَطَاءِ لَيَبْغِي بَعْضُهُمْ عَلَىٰ بَعْضٍ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ", translation: "\"And indeed many partners oppress one another — except those who believe and do righteous deeds, and few are they.\"", ref: "Surah Sad (38:24)", note: "Scholars cite this as explicit Quranic recognition of partnerships (Khulata\u2019 — mixing of assets). The verse implicitly validates the concept while enjoining righteousness and justice in its execution." },
            { arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا أَوْفُوا بِالْعُقُودِ", translation: "\"O you who believe! Fulfil your contracts/obligations.\"", ref: "Surah Al-Ma\u2019idah (5:1)", note: "This verse establishes the binding nature of contracts in Islam, including partnership agreements. Our Musharakah agreement is a sacred obligation that both parties must honour in full." },
            { arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تَأْكُلُوا أَمْوَالَكُم بَيْنَكُم بِالْبَاطِلِ إِلَّا أَن تَكُونَ تِجَارَةً عَن تَرَاضٍ مِّنكُمْ", translation: "\"O you who believe! Do not consume one another\u2019s wealth unjustly — except it be a trade by mutual consent among you.\"", ref: "Surah An-Nisa (4:29)", note: "This verse establishes two foundational principles: prohibition of consuming wealth unjustly, and the permissibility of trade conducted with mutual consent. Musharaka embodies both." },
          ].map((v, i) => (
            <div key={i} className="bg-[#f0fdf4] border border-[#d1fae5] rounded-xl p-5">
              <div className="text-right text-xl leading-loose text-[#0f2a1e] mb-3" dir="rtl">{v.arabic}</div>
              <p className="text-[#065f46] text-sm leading-relaxed mb-2">{v.translation}</p>
              <div className="text-[#40916c] text-xs font-semibold">{v.ref}</div>
              <p className="text-gray-500 text-xs mt-2">{v.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hadith Evidence */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#fffbeb] flex items-center justify-center flex-shrink-0">
            <span className="text-[#d4a843] text-sm font-bold">ﷺ</span>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#d4a843] font-semibold">Prophetic Traditions</div>
            <h2 className="text-xl font-bold text-[#111827]">Hadith Evidence</h2>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-5">
            <div className="text-right text-lg leading-loose text-[#92400e] mb-3" dir="rtl">أَنَا ثَالِثُ الشَّرِيكَيْنِ مَا لَمْ يَخُنْ أَحَدُهُمَا صَاحِبَهُ، فَإِذَا خَانَهُ خَرَجْتُ مِنْ بَيْنِهِمَا</div>
            <p className="text-amber-800 text-sm leading-relaxed mb-2 font-medium italic">
              &ldquo;Allah says: I am the third partner of two partners, as long as neither of them betrays his partner. When one of them betrays the other, I withdraw from between them.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="text-amber-700 text-xs font-semibold">Hadith Qudsi — Abu Dawud 3383</div>
              <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full border border-green-200 font-semibold">Sahih (Authenticated)</span>
            </div>
            <p className="text-gray-500 text-xs mt-3 leading-relaxed">Narrated by Abu Hurairah (رضي الله عنه) and authenticated by Al-Hakim, Ibn Hibban, and graded Sahih by Sheikh Al-Albani. This Hadith Qudsi is the primary textual evidence for Musharaka — Allah Himself blesses faithful partnerships and withdraws His blessing upon betrayal.</p>
          </div>
          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-5">
            <p className="text-amber-800 text-sm leading-relaxed mb-2 font-medium italic">
              &ldquo;The Prophet (ﷺ) said: The hand of Allah is upon the two partners as long as they do not betray each other.&rdquo;
            </p>
            <div className="text-amber-700 text-xs font-semibold">Related narration — emphasizing Allah&apos;s continuous blessing on honest partnerships</div>
            <p className="text-gray-500 text-xs mt-3 leading-relaxed">Partnership in Islam is not merely a commercial arrangement — it is an act of worship when conducted with honesty and integrity. The Prophet (ﷺ) himself engaged in business partnerships before Prophethood, including with Khadijah (رضي الله عنها).</p>
          </div>
        </div>
      </section>

      {/* Scholarly Consensus */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Ijma&apos;</div>
            <h2 className="text-xl font-bold text-[#111827]">Scholarly Consensus</h2>
          </div>
        </div>
        <p className="text-gray-600 leading-relaxed mb-5">There is <strong className="text-[#111827]">Ijma&apos;</strong> (scholarly consensus) among all four major schools of Islamic jurisprudence on the permissibility of Musharaka:</p>
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {[
            { school: "Hanafi", scholar: "Abu Hanifah (d. 767 CE)", note: "Validated Shirkat al-Amwal extensively in Kitab al-Mabsut via Al-Sarakhsi." },
            { school: "Maliki", scholar: "Imam Malik (d. 795 CE)", note: "Discussed partnership in Al-Mudawwana; recognized all major forms of Musharaka." },
            { school: "Shafi'i", scholar: "Imam Al-Shafi'i (d. 820 CE)", note: "Addressed in Kitab al-Umm; permissibility of capital partnerships firmly established." },
            { school: "Hanbali", scholar: "Imam Ahmad ibn Hanbal (d. 855 CE)", note: "Ibn Qudamah's Al-Mughni documents extensive Hanbali jurisprudence on Shirkah." },
          ].map((m) => (
            <div key={m.school} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className="text-[#111827] font-bold text-sm mb-0.5">{m.school} School</div>
              <div className="text-[#40916c] text-xs mb-2">{m.scholar}</div>
              <p className="text-gray-400 text-xs leading-relaxed">{m.note}</p>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-3">
          <h3 className="text-[#111827] font-semibold text-sm">Contemporary Scholars</h3>
          <div className="space-y-2">
            {[
              { name: "Dr. Muhammad Taqi Usmani", role: "Former Chief Justice, Pakistan Shariah Court", text: "In An Introduction to Islamic Finance: \"Musharaka is the most ideal form of Islamic financing and is closest to the spirit of Islam...\"" },
              { name: "Ibn Qudamah al-Maqdisi", role: "Al-Mughni, 12th century CE", text: "\"Partnership in trade is permissible by the consensus of the scholars.\" — Al-Mughni, Vol. 5." },
              { name: "Ibn Rushd (Averroes)", role: "Bidayat al-Mujtahid", text: "Catalogued the conditions and forms of Shirkah across all madhabs — foundational comparative fiqh text still used in Islamic finance today." },
            ].map((s) => (
              <div key={s.name}>
                <span className="text-[#0f2a1e] font-semibold text-sm">{s.name}</span>
                <span className="text-gray-400 text-xs ml-2">({s.role})</span>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conditions */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#40916c]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#40916c] font-semibold">Fiqh Requirements</div>
            <h2 className="text-xl font-bold text-[#111827]">Conditions for Validity</h2>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { condition: "Capital must be real and present", detail: "Capital contributions must be actual monetary funds (or tangible assets) — not promises, debt, or future obligations. Our partners contribute verified capital before activation." },
            { condition: "Profit sharing ratio agreed upfront", detail: `The profit sharing ratio must be specified as a percentage of actual profit — never as a fixed lump sum. Our agreement specifies ${profitPct}% of net profit distributed to all partners proportionally to equity.` },
            { condition: "Losses borne according to capital ratio", detail: "Losses cannot be allocated arbitrarily. They must be borne in exact proportion to each partner's capital contribution. This is non-negotiable in all madhabs." },
            { condition: "Business activity must be Halal", detail: "The partnership enterprise must engage in Shariah-compliant activities. Mizark Global operates Leadash (SaaS) and an online academy — both are permissible businesses with no interest, alcohol, or prohibited products." },
            { condition: "No guaranteed return (no Riba)", detail: "Returns cannot be guaranteed or fixed. Profit depends on actual business performance. Partners share in real risk — this is the fundamental distinction from interest-based lending." },
            { condition: "Mutual consent (Rida)", detail: "All partners must enter the agreement voluntarily and with full informed consent. Our agreement process ensures partners review, understand, and sign the full agreement before activation." },
          ].map((c) => (
            <div key={c.condition} className="flex gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-[#40916c] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <div className="text-[#111827] font-semibold text-sm mb-1">{c.condition}</div>
                <p className="text-gray-500 text-xs leading-relaxed">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How Our Partnership Works */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#fffbeb] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#d4a843]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#d4a843] font-semibold">Our Structure</div>
            <h2 className="text-xl font-bold text-[#111827]">How Our Partnership Works</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-[#111827] font-semibold mb-3 text-sm">Partnership Structure</h3>
            <div className="space-y-2">
              {[
                { label: "Partnership Type", value: "Shirkat al-Amwal (Capital)" },
                { label: "Term", value: `${termYears} years from activation` },
                { label: "Profit Share to Partners", value: `${profitPct}% of quarterly net profit` },
                { label: "Distribution Frequency", value: "Quarterly" },
                { label: "Capital Return", value: "At term end (subject to business)" },
                { label: "Partner Role", value: "Silent (capital only)" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-400 text-xs">{r.label}</span>
                  <span className="text-[#111827] text-xs font-semibold">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-[#111827] font-semibold mb-3 text-sm">Profit Distribution Flow</h3>
            <div className="space-y-3">
              <div className="bg-[#f0fdf4] border border-[#d1fae5] rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wide text-[#40916c] font-semibold mb-1">Step 1 — Monthly</div>
                <p className="text-[#065f46] text-xs">Revenue recorded in Zoho Books. All business expenses deducted.</p>
              </div>
              <div className="bg-[#f0fdf4] border border-[#d1fae5] rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wide text-[#40916c] font-semibold mb-1">Step 2 — Quarterly</div>
                <p className="text-[#065f46] text-xs">Quarterly net profit calculated. {profitPct}% allocated to all partners proportionally to equity stake.</p>
              </div>
              <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wide text-[#d4a843] font-semibold mb-1">Step 3 — Distribution</div>
                <p className="text-amber-700 text-xs">Your share transferred to your bank account. Dashboard updated with records.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Riba comparison */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-red-400 font-semibold">Why This is NOT Riba</div>
            <h2 className="text-xl font-bold text-[#111827]">Distinction from Interest</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase">Aspect</th>
                <th className="text-left px-4 py-3 text-red-400 font-medium text-xs uppercase">Riba (Interest/Loan)</th>
                <th className="text-left px-4 py-3 text-[#40916c] font-medium text-xs uppercase">Musharaka (Our Structure)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Return", "Fixed, guaranteed regardless of outcomes", "Variable — depends on actual business profit"],
                ["Risk", "All risk on borrower; lender is always paid", "Risk shared — partner bears proportional losses"],
                ["Relationship", "Creditor and debtor — lender is owed money", "Co-owners — both have ownership stake in business"],
                ["Profit Source", "Time value of money (prohibited in Islam)", "Real economic activity and enterprise"],
                ["If Business Loses", "Borrower still owes the principal + interest", "Partners bear losses proportionally — no fixed obligation"],
                ["Ownership", "You own nothing; you are owed money", "You own a percentage of the actual business"],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-[#111827] font-medium text-xs">{row[0]}</td>
                  <td className="px-4 py-3 text-red-500 text-xs">{row[1]}</td>
                  <td className="px-4 py-3 text-[#40916c] text-xs font-medium">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Common Questions</div>
            <h2 className="text-xl font-bold text-[#111827]">FAQ</h2>
          </div>
        </div>
        <div className="space-y-4">
          {faq.map((item, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-5 bg-gray-50">
              <h3 className="text-[#111827] font-semibold text-sm mb-2">{item.q}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="bg-[#0f2a1e] rounded-2xl p-6 sm:p-8 text-center">
        <div className="text-[#d4a843] text-2xl mb-3 text-right" dir="rtl">بسم الله الرحمن الرحيم</div>
        <p className="text-white/70 text-sm mb-1">In the name of Allah, the Most Gracious, the Most Merciful</p>
        <p className="text-white/50 text-xs mt-4 max-w-lg mx-auto leading-relaxed">
          May Allah bless our partnership with barakah, protect us from riba, and grant us success in this life and the next. We take our obligations to our partners seriously — both contractually and before Allah.
        </p>
        <div className="text-[#40916c] text-xs mt-4 font-semibold">آمين</div>
      </div>

    </div>
  );
}
