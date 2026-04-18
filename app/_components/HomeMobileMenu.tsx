"use client";
import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  ["#businesses", "Businesses"],
  ["#opportunity", "Opportunity"],
  ["#terms", "Terms"],
  ["#team", "Team"],
  ["#faq", "FAQ"],
] as const;

export default function HomeMobileMenu({ ctaLabel }: { ctaLabel: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop nav links */}
      <div className="hidden md:flex items-center gap-7">
        {NAV_LINKS.map(([href, label]) => (
          <a key={href} href={href} className="text-white/55 hover:text-white text-[13px] transition-colors">
            {label}
          </a>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <Link href="/login" className="hidden md:block text-white/40 hover:text-white/70 text-[13px] transition-colors">
          Sign in
        </Link>
        <Link
          href="/apply"
          className="px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#d4a843,#c49a38)", color: "#0f2a1e" }}
        >
          {ctaLabel}
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-white/60 hover:text-white"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 md:hidden border-t border-white/10 px-5 py-4 flex flex-col gap-3 z-50"
          style={{ background: "#0f2a1e" }}
        >
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href} className="text-white/60 text-sm py-1" onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <Link href="/login" className="text-white/40 text-sm py-1">
            Sign in
          </Link>
        </div>
      )}
    </>
  );
}
