import Link from "next/link";
import MizarkLogo from "@/components/MizarkLogo";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MUSHARAKA_DEFAULTS } from "@/lib/musharaka-defaults";
import MusharakaContent from "@/app/_components/MusharakaContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Musharakah Explained | Mizark Partners",
  description: "Learn about the Islamic partnership principles — Musharakah — that govern the Mizark Global Partner Programme.",
};

export default async function MusharakaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const db = createAdminClient();
  const { data: config } = await db.from("program_config").select("settings").eq("id", 1).maybeSingle();
  const raw = (config as any)?.settings ?? {};
  const content = { ...MUSHARAKA_DEFAULTS, ...(raw.musharaka_content ?? {}) };
  const profitPct = raw.profit_dist_pct ?? 30;
  const termYears = raw.term_years ?? 3;

  const isPartner = !!user;

  return (
    <div className="min-h-screen bg-[#f4f6f4]" style={{ fontFamily: "var(--font-geist), 'Segoe UI', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.08]" style={{ background: "rgba(15,42,30,0.97)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-[62px] flex items-center justify-between">
          <Link href={isPartner ? "/dashboard" : "/"}>
            <MizarkLogo subtitle="Partner Programme" />
          </Link>
          <div className="flex items-center gap-3">
            {isPartner ? (
              <Link href="/dashboard" className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-white/50 hover:text-white text-sm transition-colors">Sign In</Link>
                <Link
                  href="/apply"
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-[10px] font-semibold text-[13px] transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#d4a843,#c49a38)", color: "#0f2a1e" }}
                >
                  Apply Now
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: "linear-gradient(160deg,#081a11,#0f2a1e)" }} className="py-16 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#74c69d] mb-3">Islamic Finance</p>
          <h1 className="text-[36px] sm:text-[48px] font-bold text-white tracking-[-0.025em] mb-4">Understanding Musharaka</h1>
          <p className="text-white/60 text-[15px] leading-relaxed max-w-xl">
            The Shariah-compliant foundation of the Mizark Global Partner Programme — Quranic evidence, Hadith, scholarly consensus, and how your investment works.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        <MusharakaContent profitPct={profitPct} termYears={termYears} faq={content.faq} />
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-4">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-wrap gap-5 justify-center text-xs text-gray-400">
          <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
          {isPartner && <Link href="/dashboard" className="hover:text-gray-600 transition-colors">Dashboard</Link>}
          <Link href="/apply" className="hover:text-gray-600 transition-colors">Apply</Link>
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
          <a href="mailto:partners@mizarkglobal.com" className="hover:text-gray-600 transition-colors">partners@mizarkglobal.com</a>
        </div>
      </footer>
    </div>
  );
}
